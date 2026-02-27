from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class ProfileBase(BaseModel):
    age: Optional[int] = None
    occupation: Optional[str] = None
    monthly_income: float = 0.0
    monthly_expenses: float = 0.0
    risk_profile: str = "Moderate"
    financial_goals: Dict = {}
    location: Optional[str] = ""

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class InvestmentBase(BaseModel):
    name: str
    type: str
    amount: float
    start_date: Optional[str] = None
    frequency: str = "Monthly"
    expected_return: float = 12.0

class InvestmentCreate(InvestmentBase):
    pass

class InvestmentUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    amount: Optional[float] = None
    frequency: Optional[str] = None
    expected_return: Optional[float] = None

class InvestmentResponse(InvestmentBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class BrokerBase(BaseModel):
    broker_name: str = "Zerodha"
    api_key: Optional[str] = None
    is_active: bool = False

class BrokerUpdate(BrokerBase):
    api_secret: Optional[str] = None
    access_token: Optional[str] = None

class BrokerResponse(BrokerBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
