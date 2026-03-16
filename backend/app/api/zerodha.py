from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..services.zerodha_service import ZerodhaService
from ..api.auth import get_current_user
from ..models.user import BrokerConfig, User, Investment
import os
import logging
from kiteconnect import exceptions as kite_exceptions

router = APIRouter()

def get_zerodha_service():
    api_key = os.getenv("ZERODHA_API_KEY")
    api_secret = os.getenv("ZERODHA_API_SECRET")
    
    if not api_key or not api_secret:
        logging.error("Zerodha API credentials missing in .env")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Zerodha API credentials not configured in environment. Please check your .env file."
        )
    return ZerodhaService(api_key=api_key, api_secret=api_secret)

def get_broker_config(db: Session, user_id: int):
    broker_config = db.query(BrokerConfig).filter(
        BrokerConfig.user_id == user_id, 
        BrokerConfig.broker_name == "Zerodha"
    ).first()
    return broker_config

@router.get("/login")
def get_login_url(
    current_user: User = Depends(get_current_user),
    service: ZerodhaService = Depends(get_zerodha_service)
):
    """Returns the Zerodha login URL."""
    try:
        url = service.get_login_url()
        return {"login_url": url}
    except Exception as e:
        logging.exception("Failed to get login URL")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get login URL: {str(e)}"
        )

@router.post("/disconnect")
def disconnect_zerodha(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Disconnects Zerodha and clears the access token."""
    broker_config = get_broker_config(db, current_user.id)
    if not broker_config:
        raise HTTPException(status_code=404, detail="Zerodha configuration not found")
    
    broker_config.access_token = None
    broker_config.is_active = False
    db.commit()
    
    return {"message": "Zerodha disconnected successfully"}

@router.post("/callback")
def zerodha_callback(
    request_token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: ZerodhaService = Depends(get_zerodha_service)
):
    """Exchanges request token for access token and saves to DB."""
    try:
        data = service.generate_session(request_token)
        access_token = data.get("access_token")
        
        # Save or update BrokerConfig table
        broker_config = get_broker_config(db, current_user.id)
        if broker_config:
            broker_config.access_token = access_token
            broker_config.is_active = True
        else:
            broker_config = BrokerConfig(
                user_id=current_user.id,
                broker_name="Zerodha",
                access_token=access_token,
                is_active=True
            )
            db.add(broker_config)
            
        db.commit()
        return {"message": "Zerodha authentication successful", "status": "active"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/profile")
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: ZerodhaService = Depends(get_zerodha_service)
):
    """Gets Zerodha user profile."""
    broker_config = get_broker_config(db, current_user.id)
    if not broker_config or not broker_config.access_token:
        raise HTTPException(status_code=401, detail="Zerodha account not linked or token expired")
        
    try:
        kite = service._get_kite_instance(broker_config.access_token)
        return kite.profile()
    except kite_exceptions.TokenException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Zerodha session expired or invalid. Please re-authenticate."
        )
    except Exception as e:
        logging.exception("Failed to fetch profile")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch profile: {str(e)}"
        )

@router.get("/holdings")
def get_holdings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: ZerodhaService = Depends(get_zerodha_service)
):
    """Retrieves user's holdings from Zerodha."""
    broker_config = get_broker_config(db, current_user.id)
    if not broker_config or not broker_config.access_token:
        raise HTTPException(status_code=401, detail="Zerodha account not linked or token expired")
        
    try:
        holdings = service.get_holdings(broker_config.access_token)
        return {"holdings": holdings}
    except kite_exceptions.TokenException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Zerodha session expired or invalid. Please re-authenticate."
        )
    except Exception as e:
        logging.exception("Failed to fetch holdings")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch holdings: {str(e)}"
        )

@router.post("/sync-portfolio")
def sync_portfolio(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: ZerodhaService = Depends(get_zerodha_service)
):
    """Fetches user's holdings from Zerodha and synchronizes them with internal Investment records."""
    broker_config = get_broker_config(db, current_user.id)
    if not broker_config or not broker_config.access_token:
        raise HTTPException(status_code=401, detail="Zerodha account not linked or token expired")
        
    try:
        holdings = service.get_holdings(broker_config.access_token)
        
        # In a generic portfolio sync, we'll map all equity to type 'Stock'
        # Group logic: find existing investments linked to this user with Type=Stock and same Name.
        synced_count = 0
        new_count = 0
        
        for holding in holdings:
            instrument_name = holding.get("tradingsymbol", "Unknown Asset")
            current_value = float(holding.get("last_price", 0) * holding.get("quantity", 0))
            if current_value == 0:
                continue # Skip dead holdings
                
            # Attempt to find an existing Stock investment for this user with the same name
            existing_investment = db.query(Investment).filter(
                Investment.user_id == current_user.id,
                Investment.name == instrument_name,
                Investment.type == "Stock"
            ).first()
            
            if existing_investment:
                # Update the amount to match live valuation
                existing_investment.amount = current_value
                synced_count += 1
            else:
                # Create a new investment block entirely
                new_inv = Investment(
                    user_id=current_user.id,
                    name=instrument_name,
                    type="Stock",
                    amount=current_value,
                    frequency="One-time", # Typically direct equity is one-time chunks
                    expected_return=12.0 # Default fallback
                )
                db.add(new_inv)
                new_count += 1
                
        db.commit()
        return {
            "message": "Portfolio synchronized successfully",
            "synced_investments": synced_count,
            "new_investments": new_count
        }
    except kite_exceptions.TokenException:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Zerodha session expired or invalid. Please re-authenticate."
        )
    except Exception as e:
        db.rollback()
        logging.exception("Failed to sync portfolio")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync portfolio: {str(e)}"
        )

@router.get("/positions")
def get_positions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: ZerodhaService = Depends(get_zerodha_service)
):
    """Retrieves user's net and day positions from Zerodha."""
    broker_config = get_broker_config(db, current_user.id)
    if not broker_config or not broker_config.access_token:
        raise HTTPException(status_code=401, detail="Zerodha account not linked or token expired")
        
    try:
        positions = service.get_positions(broker_config.access_token)
        return {"positions": positions}
    except kite_exceptions.TokenException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Zerodha session expired or invalid. Please re-authenticate."
        )
    except Exception as e:
        logging.exception("Failed to fetch positions")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch positions: {str(e)}"
        )
