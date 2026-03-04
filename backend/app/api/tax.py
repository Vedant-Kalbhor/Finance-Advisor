from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.user import User, Profile, Investment
from .auth import get_current_user

router = APIRouter()


# ---------------- NEW TAX REGIME FY 2025-26 ----------------
def calculate_tax_new_regime(annual_income: float) -> dict:
    # Standard deduction
    taxable_income = max(0, annual_income - 75000)

    tax = 0
    remaining = taxable_income
    breakdown = []

    # 0 - 4L
    tier = min(remaining, 400000)
    breakdown.append({"slab": "0-4L", "rate": "0%", "tax": 0})
    remaining -= tier

    # 4 - 8L (5%)
    if remaining > 0:
        tier = min(remaining, 400000)
        tier_tax = tier * 0.05
        tax += tier_tax
        breakdown.append({"slab": "4-8L", "rate": "5%", "tax": tier_tax})
        remaining -= tier

    # 8 - 12L (10%)
    if remaining > 0:
        tier = min(remaining, 400000)
        tier_tax = tier * 0.10
        tax += tier_tax
        breakdown.append({"slab": "8-12L", "rate": "10%", "tax": tier_tax})
        remaining -= tier

    # 12 - 16L (15%)
    if remaining > 0:
        tier = min(remaining, 400000)
        tier_tax = tier * 0.15
        tax += tier_tax
        breakdown.append({"slab": "12-16L", "rate": "15%", "tax": tier_tax})
        remaining -= tier

    # 16 - 20L (20%)
    if remaining > 0:
        tier = min(remaining, 400000)
        tier_tax = tier * 0.20
        tax += tier_tax
        breakdown.append({"slab": "16-20L", "rate": "20%", "tax": tier_tax})
        remaining -= tier

    # 20 - 24L (25%)
    if remaining > 0:
        tier = min(remaining, 400000)
        tier_tax = tier * 0.25
        tax += tier_tax
        breakdown.append({"slab": "20-24L", "rate": "25%", "tax": tier_tax})
        remaining -= tier

    # Above 24L (30%)
    if remaining > 0:
        tier_tax = remaining * 0.30
        tax += tier_tax
        breakdown.append({"slab": "Above 24L", "rate": "30%", "tax": tier_tax})

    # Rebate u/s 87A
    # If taxable income ≤ 12L → rebate up to 60,000
    if taxable_income <= 1200000:
        tax = max(0, tax - min(tax, 60000))

    return {
        "total_tax": tax,
        "breakdown": breakdown,
        "taxable_income": taxable_income
    }


# ---------------- OLD TAX REGIME ----------------
def calculate_tax_old_regime(annual_income: float, deductions: float) -> dict:
    taxable_income = max(0, annual_income - deductions - 50000)

    tax = 0
    breakdown = []

    # 0 - 2.5L
    tier = min(taxable_income, 250000)
    breakdown.append({"slab": "0-2.5L", "rate": "0%", "tax": 0})
    remaining = taxable_income - tier

    # 2.5 - 5L (5%)
    if remaining > 0:
        tier = min(remaining, 250000)
        tier_tax = tier * 0.05
        tax += tier_tax
        breakdown.append({"slab": "2.5-5L", "rate": "5%", "tax": tier_tax})
        remaining -= tier

    # 5 - 10L (20%)
    if remaining > 0:
        tier = min(remaining, 500000)
        tier_tax = tier * 0.20
        tax += tier_tax
        breakdown.append({"slab": "5-10L", "rate": "20%", "tax": tier_tax})
        remaining -= tier

    # Above 10L (30%)
    if remaining > 0:
        tier_tax = remaining * 0.30
        tax += tier_tax
        breakdown.append({"slab": "Above 10L", "rate": "30%", "tax": tier_tax})

    # Rebate u/s 87A
    if taxable_income <= 500000:
        tax = 0

    return {
        "total_tax": tax,
        "breakdown": breakdown,
        "taxable_income": taxable_income
    }


# ---------------- TAX ESTIMATE ROUTE ----------------
@router.get("/estimate")
def get_tax_estimate(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    annual_income = profile.monthly_income * 12

    # Automate 80C: Profile manual + Investments marked as tax-saving
    invest_80c = db.query(Investment).filter(
        Investment.user_id == current_user.id,
        Investment.is_tax_saving == True
    ).all()
    
    automated_80c = sum(inv.amount for inv in invest_80c)
    effective_80c = min(150000, profile.deductions_80c + automated_80c)

    total_deductions = (
        effective_80c +
        profile.deductions_80d +
        profile.other_deductions
    )

    new_regime_calc = calculate_tax_new_regime(annual_income)
    old_regime_calc = calculate_tax_old_regime(annual_income, total_deductions)

    # 4% Health & Education Cess
    new_regime_calc["cess"] = new_regime_calc["total_tax"] * 0.04
    old_regime_calc["cess"] = old_regime_calc["total_tax"] * 0.04

    new_regime_calc["final_tax"] = new_regime_calc["total_tax"] + new_regime_calc["cess"]
    old_regime_calc["final_tax"] = old_regime_calc["total_tax"] + old_regime_calc["cess"]

    recommendation = (
        "New Regime"
        if new_regime_calc["final_tax"] <= old_regime_calc["final_tax"]
        else "Old Regime"
    )

    return {
        "annual_income": annual_income,
        "current_regime": profile.tax_regime,
        "recommendation": recommendation,
        "new_regime": new_regime_calc,
        "old_regime": old_regime_calc,
        "savings_potential": {
            "80C_total": effective_80c,
            "80C_automated": automated_80c,
            "80C_remaining": max(0, 150000 - effective_80c),
            "80D_remaining": max(0, 25000 - profile.deductions_80d)
        }
    }