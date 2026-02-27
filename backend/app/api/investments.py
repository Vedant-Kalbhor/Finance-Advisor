from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..db.session import get_db
from ..models.user import User, Investment, BrokerConfig
from ..schemas.user import InvestmentCreate, InvestmentUpdate, InvestmentResponse, BrokerBase, BrokerUpdate, BrokerResponse
from .auth import get_current_user

router = APIRouter()

# --- Manual Investments CRUD ---

@router.post("/", response_model=InvestmentResponse)
def create_investment(
    investment_in: InvestmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_investment = Investment(
        **investment_in.dict(),
        user_id=current_user.id
    )
    db.add(new_investment)
    db.commit()
    db.refresh(new_investment)
    return new_investment

@router.get("/", response_model=List[InvestmentResponse])
def get_investments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Investment).filter(Investment.user_id == current_user.id).all()

@router.put("/{investment_id}", response_model=InvestmentResponse)
def update_investment(
    investment_id: int,
    investment_in: InvestmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    investment = db.query(Investment).filter(
        Investment.id == investment_id,
        Investment.user_id == current_user.id
    ).first()
    
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    
    for field, value in investment_in.dict(exclude_unset=True).items():
        setattr(investment, field, value)
    
    db.commit()
    db.refresh(investment)
    return investment

@router.delete("/{investment_id}")
def delete_investment(
    investment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    investment = db.query(Investment).filter(
        Investment.id == investment_id,
        Investment.user_id == current_user.id
    ).first()
    
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    
    db.delete(investment)
    db.commit()
    return {"message": "Investment deleted successfully"}

# --- Broker Configuration ---

@router.get("/broker", response_model=BrokerResponse)
def get_broker_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    config = db.query(BrokerConfig).filter(BrokerConfig.user_id == current_user.id).first()
    if not config:
        # Create empty config if doesn't exist
        config = BrokerConfig(user_id=current_user.id)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.put("/broker", response_model=BrokerResponse)
def update_broker_config(
    config_in: BrokerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    config = db.query(BrokerConfig).filter(BrokerConfig.user_id == current_user.id).first()
    if not config:
        config = BrokerConfig(user_id=current_user.id)
        db.add(config)
    
    for field, value in config_in.dict(exclude_unset=True).items():
        setattr(config, field, value)
    
    db.commit()
    db.refresh(config)
    return config
