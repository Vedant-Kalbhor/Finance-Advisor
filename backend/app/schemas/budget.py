"""
Budget Schemas
===============
Pydantic models for budget API request/response validation.
Ensures type safety and clean API contracts.
"""

from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class BudgetRequest(BaseModel):
    """
    Input schema for generating a budget.
    All fields are optional — if not provided, they'll be
    pulled from the user's saved profile.
    """
    income: Optional[float] = None
    expenses: Optional[float] = None
    location: Optional[str] = None
    risk_profile: Optional[str] = None
    financial_goals: Optional[Dict] = None


class BudgetResponse(BaseModel):
    """
    Output schema for a single generated budget.
    Contains the allocation breakdown and AI explanation.
    """
    id: int
    user_id: int
    income: float

    # Amounts allocated to each category
    needs_amount: float
    wants_amount: float
    savings_amount: float
    investments_amount: float

    # Percentage allocation for each category
    needs_pct: float
    wants_pct: float
    savings_pct: float
    investments_pct: float

    # AI-generated reasoning for the allocations
    explanation: str

    # When this budget was created
    created_at: datetime

    class Config:
        from_attributes = True


class BudgetHistoryResponse(BaseModel):
    """
    Wrapper for returning a list of past budgets.
    """
    budgets: List[BudgetResponse]
    total: int
