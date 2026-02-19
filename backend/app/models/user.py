from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON
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
    
    user = relationship("User", back_populates="profile")
