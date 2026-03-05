"""
Chatbot API Endpoint
=====================
Exposes POST /chatbot/chat for the frontend chatbot UI.
Fetches the authenticated user's financial data and passes it
to the AI chatbot module for personalized responses.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from ..db.session import get_db
from ..models.user import User, Profile, Goal, Investment
from ..api.auth import get_current_user
from ..ai.chatbot import generate_chat_response

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Send a message to the AI financial advisor chatbot.
    The chatbot has access to the user's profile, investments, and goals.
    """
    # Fetch user's financial data
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    investments = db.query(Investment).filter(Investment.user_id == current_user.id).all()
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()

    # Build user context dict
    user_context = {
        "profile": {
            "full_name": current_user.full_name,
            "age": profile.age if profile else None,
            "occupation": profile.occupation if profile else None,
            "monthly_income": profile.monthly_income if profile else 0,
            "monthly_expenses": profile.monthly_expenses if profile else 0,
            "risk_profile": profile.risk_profile if profile else "Moderate",
            "location": profile.location if profile else "",
            "tax_regime": profile.tax_regime if profile else "New",
            "deductions_80c": profile.deductions_80c if profile else 0,
            "deductions_80d": profile.deductions_80d if profile else 0,
            "other_deductions": profile.other_deductions if profile else 0,
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

    # Convert history to list of dicts
    history_dicts = [{"role": msg.role, "content": msg.content} for msg in (request.history or [])]

    # Generate AI response
    reply = await generate_chat_response(
        message=request.message,
        history=history_dicts,
        user_context=user_context,
    )

    return ChatResponse(reply=reply)
