"""
Analytics API: Expense Anomaly Detection + Monte Carlo Goal Simulations
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db.session import get_db
from ..models.user import User, Investment, Goal, Profile
from .auth import get_current_user
from ..ai.anomaly_detector import detect_anomalies
from ..ai.monte_carlo import run_monte_carlo_simulation
import math

router = APIRouter()


# ===========================================================================
# ENDPOINT 1: Expense / Investment Anomaly Detection
# ===========================================================================
@router.get("/anomalies")
def get_anomalies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Runs Isolation Forest ML on the user's investments to detect anomalies.
    Returns each investment with an is_anomaly flag and explanation.
    """
    investments = db.query(Investment).filter(Investment.user_id == current_user.id).all()

    if not investments:
        return {"anomalies": [], "summary": "No investment data found for analysis.", "total": 0}

    investment_dicts = [
        {
            "id": inv.id,
            "name": inv.name,
            "amount": inv.amount,
            "type": inv.type,
        }
        for inv in investments
    ]

    results = detect_anomalies(investment_dicts)
    anomaly_count = sum(1 for r in results if r["is_anomaly"])

    return {
        "anomalies": results,
        "total": len(results),
        "anomaly_count": anomaly_count,
        "summary": (
            f"ML analysis complete. Found {anomaly_count} potential anomaly/anomalies "
            f"out of {len(results)} transactions. Review flagged items carefully."
            if anomaly_count > 0
            else f"All {len(results)} transactions look normal. No unusual patterns detected."
        ),
    }


# ===========================================================================
# ENDPOINT 2: Monte Carlo Goal Simulations
# ===========================================================================
@router.get("/monte-carlo/{goal_id}")
def get_monte_carlo(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Runs 1,000 Monte Carlo simulations for a specific goal.
    Returns probability cones and success likelihood.
    """
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    investments = db.query(Investment).filter(Investment.user_id == current_user.id).all()

    risk_profile = profile.risk_profile if profile else "Moderate"
    monthly_income = profile.monthly_income if profile else 0
    monthly_expenses = profile.monthly_expenses if profile else 0
    monthly_surplus = monthly_income - monthly_expenses

    # Estimate linked investment amount
    linked_total = sum(inv.amount for inv in investments if inv.goal_id == goal.id)
    current_amount = (goal.current_amount or 0) + linked_total

    # Estimate SIP needed using standard formula
    try:
        target_date_str = goal.target_date
        from datetime import datetime
        target_date = datetime.strptime(target_date_str, "%Y-%m-%d")
        now = datetime.now()
        months_left = max(1, (target_date.year - now.year) * 12 + (target_date.month - now.month))
    except Exception:
        months_left = 60

    annual_return = {"Conservative": 0.08, "Moderate": 0.12, "Aggressive": 0.16}.get(risk_profile, 0.12)
    r = annual_return / 12
    future_value_needed = max(0, goal.target_amount - current_amount)
    if months_left > 0 and r > 0:
        denom = math.pow(1 + r, months_left) - 1
        suggested_sip = (future_value_needed * r) / denom if denom > 0 else future_value_needed / months_left
    else:
        suggested_sip = future_value_needed / max(1, months_left)

    # Use the smaller of suggested SIP and actual surplus (realistic)
    monthly_sip = min(suggested_sip, max(0, monthly_surplus))

    goal_dict = {
        "name": goal.name,
        "target_amount": goal.target_amount,
        "target_date": goal.target_date,
    }

    result = run_monte_carlo_simulation(
        goal=goal_dict,
        monthly_sip=monthly_sip,
        current_amount=current_amount,
        risk_profile=risk_profile,
    )

    return result


@router.get("/monte-carlo-all")
def get_all_monte_carlo(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Runs Monte Carlo simulations for all user goals (lightweight version).
    """
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    investments = db.query(Investment).filter(Investment.user_id == current_user.id).all()

    if not goals:
        return {"simulations": [], "message": "No goals found."}

    risk_profile = profile.risk_profile if profile else "Moderate"
    monthly_income = profile.monthly_income if profile else 0
    monthly_expenses = profile.monthly_expenses if profile else 0
    monthly_surplus = monthly_income - monthly_expenses

    results = []
    for goal in goals:
        try:
            linked_total = sum(inv.amount for inv in investments if inv.goal_id == goal.id)
            current_amount = (goal.current_amount or 0) + linked_total
            annual_return = {"Conservative": 0.08, "Moderate": 0.12, "Aggressive": 0.16}.get(risk_profile, 0.12)
            r = annual_return / 12
            from datetime import datetime
            target_date = datetime.strptime(goal.target_date, "%Y-%m-%d")
            months_left = max(1, (target_date.year - datetime.now().year) * 12 + (target_date.month - datetime.now().month))
            future_needed = max(0, goal.target_amount - current_amount)
            denom = math.pow(1 + r, months_left) - 1
            sip = (future_needed * r / denom) if denom > 0 else future_needed / months_left
            monthly_sip = min(sip, max(0, monthly_surplus))

            sim = run_monte_carlo_simulation(
                goal={"name": goal.name, "target_amount": goal.target_amount, "target_date": goal.target_date},
                monthly_sip=monthly_sip,
                current_amount=current_amount,
                risk_profile=risk_profile,
            )
            results.append(sim)
        except Exception as e:
            print(f"[MonteCarlo] Skipped goal {goal.name}: {e}")

    return {"simulations": results}
