"""
Budget API Router
==================
Endpoints for generating and retrieving personalized budgets.
All endpoints require authentication via JWT token.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.user import User, Profile
from ..models.budget import Budget
from ..schemas.budget import BudgetRequest, BudgetResponse, BudgetHistoryResponse
from ..ai.budget_generator import generate_budget
from .auth import get_current_user

router = APIRouter()


@router.post("/generate", response_model=BudgetResponse)
async def generate_user_budget(
    budget_input: BudgetRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a personalized budget using AI.
    
    Takes optional overrides for income/expenses/location/risk/goals.
    If not provided, values are pulled from the user's saved profile.
    The generated budget is saved to the database for history tracking.
    """
    # Fetch the user's profile to get default values
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your profile before generating a budget."
        )

    # Use provided values or fall back to profile data
    income = budget_input.income or profile.monthly_income
    expenses = budget_input.expenses or profile.monthly_expenses
    location = budget_input.location or (profile.location if hasattr(profile, 'location') else "")
    risk_profile = budget_input.risk_profile or profile.risk_profile
    goals = budget_input.financial_goals or profile.financial_goals or {}

    # Validate that income is provided and positive
    if not income or income <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Monthly income must be a positive number. Please update your profile."
        )

    # Call the AI budget generator
    budget_data = await generate_budget(
        income=income,
        expenses=expenses,
        goals=goals,
        location=location,
        risk_profile=risk_profile
    )

    # Save the generated budget to the database
    new_budget = Budget(
        user_id=current_user.id,
        income=income,
        needs_amount=budget_data["needs_amount"],
        wants_amount=budget_data["wants_amount"],
        savings_amount=budget_data["savings_amount"],
        investments_amount=budget_data["investments_amount"],
        needs_pct=budget_data["needs_pct"],
        wants_pct=budget_data["wants_pct"],
        savings_pct=budget_data["savings_pct"],
        investments_pct=budget_data["investments_pct"],
        explanation=budget_data["explanation"],
    )
    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)

    return new_budget


@router.get("/latest", response_model=BudgetResponse)
async def get_latest_budget(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve the most recently generated budget for the current user.
    Returns 404 if no budgets have been generated yet.
    """
    budget = (
        db.query(Budget)
        .filter(Budget.user_id == current_user.id)
        .order_by(Budget.created_at.desc())
        .first()
    )
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No budgets found. Generate your first budget!"
        )
    return budget


@router.get("/history", response_model=BudgetHistoryResponse)
async def get_budget_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve all generated budgets for the current user,
    ordered by most recent first. Useful for tracking how
    budget recommendations evolve over time.
    """
    budgets = (
        db.query(Budget)
        .filter(Budget.user_id == current_user.id)
        .order_by(Budget.created_at.desc())
        .all()
    )
    return BudgetHistoryResponse(budgets=budgets, total=len(budgets))
