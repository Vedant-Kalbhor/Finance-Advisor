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
    financial_goals = Column(JSON, default={}) # List of goals
    location = Column(String, default="") # User's city/region for cost-of-living context
    
    user = relationship("User", back_populates="profile")

class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    type = Column(String)  # SIP, Mutual Fund, FD, Gold, Cash, etc.
    amount = Column(Float)
    start_date = Column(String)
    frequency = Column(String, default="Monthly") # Monthly, One-time
    expected_return = Column(Float, default=12.0)
    
    user = relationship("User")

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
