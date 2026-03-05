from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from ..db.session import get_db
from ..models.user import User, Investment, BrokerConfig, Profile, Goal
from ..schemas.user import InvestmentCreate, InvestmentUpdate, InvestmentResponse, BrokerBase, BrokerUpdate, BrokerResponse
from .auth import get_current_user
from ..ai.chatbot import generate_investment_recommendations

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


# --- AI Investment Recommendations ---

class RecommendationRequest(BaseModel):
    risk_level: str
    investment_type: str


class RecommendationResponse(BaseModel):
    recommendations: str


@router.post("/ai-recommendations", response_model=RecommendationResponse)
async def get_ai_recommendations(
    request: RecommendationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get AI-powered investment recommendations based on user's risk level,
    preferred investment type, and their existing portfolio context.
    """
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    investments = db.query(Investment).filter(Investment.user_id == current_user.id).all()
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()

    user_context = {
        "profile": {
            "full_name": current_user.full_name,
            "age": profile.age if profile else None,
            "occupation": profile.occupation if profile else None,
            "monthly_income": profile.monthly_income if profile else 0,
            "monthly_expenses": profile.monthly_expenses if profile else 0,
            "risk_profile": profile.risk_profile if profile else "Moderate",
            "location": profile.location if profile else "",
        },
        "investments": [
            {
                "name": inv.name,
                "type": inv.type,
                "amount": inv.amount,
                "frequency": inv.frequency,
                "expected_return": inv.expected_return,
                "is_tax_saving": inv.is_tax_saving,
            }
            for inv in investments
        ],
        "goals": [
            {
                "name": goal.name,
                "target_amount": goal.target_amount,
                "current_amount": goal.current_amount,
                "target_date": goal.target_date,
                "priority": goal.priority,
                "category": goal.category,
            }
            for goal in goals
        ],
    }

    recommendations = await generate_investment_recommendations(
        risk_level=request.risk_level,
        investment_type=request.investment_type,
        user_context=user_context,
    )

    return RecommendationResponse(recommendations=recommendations)

