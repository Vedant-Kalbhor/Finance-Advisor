"""
Budget Model
=============
SQLAlchemy model for storing generated budget plans.
Each budget is linked to a user and contains the AI-generated
allocation percentages, amounts, and explanation.
"""

from sqlalchemy import Column, Integer, Float, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db.session import Base


class Budget(Base):
    """
    Stores a generated budget plan for a user.
    Multiple budgets can exist per user (budget history).
    """
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # The income used when this budget was generated
    income = Column(Float, nullable=False)

    # Budget allocation amounts (in currency)
    needs_amount = Column(Float, default=0.0)
    wants_amount = Column(Float, default=0.0)
    savings_amount = Column(Float, default=0.0)
    investments_amount = Column(Float, default=0.0)

    # Budget allocation percentages
    needs_pct = Column(Float, default=0.0)
    wants_pct = Column(Float, default=0.0)
    savings_pct = Column(Float, default=0.0)
    investments_pct = Column(Float, default=0.0)

    # AI-generated explanation for the budget allocation
    explanation = Column(Text, default="")

    # Timestamp for when this budget was generated
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship back to the user
    user = relationship("User", backref="budgets")
