from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from ..db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    
    profile = relationship("Profile", back_populates="user", uselist=False)

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    age = Column(Integer)
    occupation = Column(String)
    monthly_income = Column(Float, default=0.0)
    monthly_expenses = Column(Float, default=0.0)
    risk_profile = Column(String, default="Moderate") # Conservative, Moderate, Aggressive
    financial_goals = Column(JSON, default={}) # List of goals (old field, replaced by Goal model)
    location = Column(String, default="") # User's city/region for cost-of-living context
    
    # Tax fields
    tax_regime = Column(String, default="New") # Old or New
    deductions_80c = Column(Float, default=0.0)
    deductions_80d = Column(Float, default=0.0)
    other_deductions = Column(Float, default=0.0)
    
    user = relationship("User", back_populates="profile")

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String) # e.g., "Retirement", "House", "Vacation"
    target_amount = Column(Float)
    target_date = Column(String) # YYYY-MM-DD
    current_amount = Column(Float, default=0.0)
    priority = Column(String, default="Medium") # Low, Medium, High
    category = Column(String) # Retirement, Education, etc.

    user = relationship("User")

class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=True) # Link to a specific goal
    name = Column(String)
    type = Column(String)  # SIP, Mutual Fund, FD, Gold, Cash, etc.
    amount = Column(Float)
    is_tax_saving = Column(Boolean, default=False) # For 80C automation
    start_date = Column(String)
    frequency = Column(String, default="Monthly") # Monthly, One-time
    expected_return = Column(Float, default=12.0)
    
    user = relationship("User")
    goal = relationship("Goal")

class BrokerConfig(Base):
    __tablename__ = "broker_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    broker_name = Column(String, default="Zerodha")
    api_key = Column(String)
    api_secret = Column(String) # Encrypted
    access_token = Column(String)
    is_active = Column(Boolean, default=False)
    
    user = relationship("User")
