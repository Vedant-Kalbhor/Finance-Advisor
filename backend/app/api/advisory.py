from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import math
from ..db.session import get_db
from ..models.user import User, Goal, Profile, Investment
from ..schemas.user import GoalCreate, GoalUpdate, GoalResponse
from .auth import get_current_user

router = APIRouter()

# --- Goals CRUD ---

@router.post("/goals", response_model=GoalResponse)
def create_goal(
    goal_in: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_goal = Goal(**goal_in.dict(), user_id=current_user.id)
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return new_goal

@router.get("/goals", response_model=List[GoalResponse])
def get_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Goal).filter(Goal.user_id == current_user.id).all()

@router.delete("/goals/{goal_id}")
def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted"}

# --- SIP Advisory Logic ---

@router.get("/recommendations")
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    investments = db.query(Investment).filter(Investment.user_id == current_user.id).all()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile required for recommendations")

    recommendations = []
    total_suggested_sip = 0
    
    # Simple risk-based return assumption
    expected_annual_return = 12.0
    if profile.risk_profile == "Conservative":
        expected_annual_return = 8.0
    elif profile.risk_profile == "Aggressive":
        expected_annual_return = 15.0
        
    r = (expected_annual_return / 100) / 12  # Monthly rate
    
    for goal in goals:
        try:
            # Calculate current amount based on linked investments
            linked_investments_total = sum(inv.amount for inv in investments if inv.goal_id == goal.id)
            # Add goal's own seed amount if any (historical)
            actual_current_amount = goal.current_amount + linked_investments_total

            target_date = datetime.strptime(goal.target_date, "%Y-%m-%d")
            now = datetime.now()
            months_left = (target_date.year - now.year) * 12 + (target_date.month - now.month)
            
            if months_left <= 0:
                continue
                
            future_value_needed = goal.target_amount - actual_current_amount
            if future_value_needed <= 0:
                recommendations.append({
                    "goal_name": goal.name,
                    "status": "Achieved",
                    "suggested_sip": 0,
                    "current_amount": actual_current_amount
                })
                continue
            
            denominator = math.pow(1 + r, months_left) - 1
            suggested_sip = (future_value_needed * r) / denominator
            
            total_suggested_sip += suggested_sip
            
            recommendations.append({
                "goal_id": goal.id,
                "goal_name": goal.name,
                "target_amount": goal.target_amount,
                "current_amount": actual_current_amount,
                "months_left": months_left,
                "suggested_sip": round(suggested_sip, 2),
                "expected_return": expected_annual_return
            })
        except Exception as e:
            continue

    # Gap analysis
    current_monthly_surplus = profile.monthly_income - profile.monthly_expenses
    gap = total_suggested_sip - current_monthly_surplus
    
    return {
        "goal_recommendations": recommendations,
        "total_required_sip": round(total_suggested_sip, 2),
        "monthly_surplus": current_monthly_surplus,
        "is_feasible": gap <= 0,
        "gap": round(gap, 2) if gap > 0 else 0,
        "advice": "Your current surplus covers your goals!" if gap <= 0 else f"You need to increase your monthly savings by ₹{round(gap, 2)} or extend your targets."
    }
