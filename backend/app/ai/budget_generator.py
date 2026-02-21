"""
Budget Generator AI Module
===========================
Uses Google Gemini to generate personalized budget plans based on user's 
financial profile. Falls back to rule-based 50/30/20 budgeting if AI is unavailable.

Input: income, expenses, goals, location, risk tolerance
Output: budget allocation (needs/wants/savings/investments) with AI explanation
"""

import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini with API key from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def _build_prompt(income: float, expenses: float, goals: dict,
                  location: str, risk_profile: str) -> str:
    """
    Constructs a detailed prompt for the Gemini model to generate
    a personalized budget plan. The prompt enforces JSON output format
    so we can parse it reliably.
    """
    goals_text = json.dumps(goals) if goals else "No specific goals set"

    prompt = f"""You are an expert personal finance advisor. Based on the following user profile, 
generate a personalized monthly budget plan.

USER PROFILE:
- Monthly Income: ₹{income:,.2f}
- Current Monthly Expenses: ₹{expenses:,.2f}
- Location: {location or "Not specified"}
- Risk Tolerance: {risk_profile}
- Financial Goals: {goals_text}

INSTRUCTIONS:
1. Allocate the monthly income into four categories: Needs, Wants, Savings, and Investments.
2. Consider the user's risk tolerance when deciding savings vs investment split.
3. Consider the user's location for cost-of-living adjustments.
4. Consider the user's financial goals for prioritizing savings/investments.
5. Provide a clear explanation for why you chose these allocations.

RESPOND ONLY WITH VALID JSON in this exact format (no markdown, no extra text):
{{
    "needs_pct": <number between 0 and 100>,
    "wants_pct": <number between 0 and 100>,
    "savings_pct": <number between 0 and 100>,
    "investments_pct": <number between 0 and 100>,
    "explanation": "<detailed explanation of 2-3 sentences explaining the reasoning>"
}}

RULES:
- All percentages MUST sum to exactly 100.
- For Conservative risk: favor savings over investments.
- For Aggressive risk: favor investments over savings.
- For Moderate risk: balanced approach.
- The explanation must reference the user's specific profile data.
"""
    return prompt


def _fallback_budget(income: float, risk_profile: str) -> dict:
    """
    Rule-based fallback using the classic 50/30/20 budgeting rule,
    adjusted by risk tolerance. Used when the AI call fails or
    when no API key is configured.
    """
    # Base allocation: 50% needs, 30% wants, 20% savings+investments
    if risk_profile == "Conservative":
        # Conservative: more savings, less investments
        needs_pct = 50
        wants_pct = 25
        savings_pct = 18
        investments_pct = 7
        explanation = (
            f"Based on your conservative risk profile, we recommend a cautious approach. "
            f"With ₹{income:,.2f} monthly income, 50% goes to essential needs, 25% to wants, "
            f"and the remaining 25% is split heavily toward savings (18%) over investments (7%) "
            f"to build a strong financial safety net."
        )
    elif risk_profile == "Aggressive":
        # Aggressive: more investments, less savings buffer
        needs_pct = 45
        wants_pct = 25
        savings_pct = 10
        investments_pct = 20
        explanation = (
            f"Based on your aggressive risk profile, we recommend maximizing growth potential. "
            f"With ₹{income:,.2f} monthly income, 45% covers needs, 25% for wants, "
            f"and 30% is directed toward wealth-building — with 20% in investments and 10% in savings."
        )
    else:
        # Moderate: balanced 50/30/20 split
        needs_pct = 50
        wants_pct = 25
        savings_pct = 13
        investments_pct = 12
        explanation = (
            f"Based on your moderate risk profile, we recommend a balanced approach. "
            f"With ₹{income:,.2f} monthly income, 50% goes to needs, 25% to wants, "
            f"and 25% is evenly split between savings (13%) and investments (12%) "
            f"for steady growth with a safety cushion."
        )

    return {
        "needs_pct": needs_pct,
        "wants_pct": wants_pct,
        "savings_pct": savings_pct,
        "investments_pct": investments_pct,
        "needs_amount": round(income * needs_pct / 100, 2),
        "wants_amount": round(income * wants_pct / 100, 2),
        "savings_amount": round(income * savings_pct / 100, 2),
        "investments_amount": round(income * investments_pct / 100, 2),
        "explanation": explanation,
    }


async def generate_budget(
    income: float,
    expenses: float,
    goals: dict,
    location: str,
    risk_profile: str
) -> dict:
    """
    Main entry point for budget generation.
    
    Attempts to use Google Gemini for intelligent budget allocation.
    Falls back to rule-based logic if AI is unavailable or fails.
    
    Returns a dict with: needs/wants/savings/investments amounts & percentages,
    plus an explanation string.
    """
    # If no API key is configured, use fallback immediately
    if not GEMINI_API_KEY:
        return _fallback_budget(income, risk_profile)

    try:
        # Build the prompt with user's financial data
        prompt = _build_prompt(income, expenses, goals, location, risk_profile)

        # Use Gemini to generate the budget plan
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)

        # Extract the text response and parse JSON
        response_text = response.text.strip()

        # Remove markdown code fences if Gemini wraps the response
        if response_text.startswith("```"):
            # Strip opening ``` line and closing ```
            lines = response_text.split("\n")
            # Remove first line (```json) and last line (```)
            lines = [l for l in lines if not l.strip().startswith("```")]
            response_text = "\n".join(lines)

        budget_data = json.loads(response_text)

        # Validate that all required fields exist
        required_fields = ["needs_pct", "wants_pct", "savings_pct",
                           "investments_pct", "explanation"]
        for field in required_fields:
            if field not in budget_data:
                raise ValueError(f"Missing field: {field}")

        # Validate percentages sum to 100 (allow small floating point tolerance)
        total = (budget_data["needs_pct"] + budget_data["wants_pct"] +
                 budget_data["savings_pct"] + budget_data["investments_pct"])
        if abs(total - 100) > 1:
            raise ValueError(f"Percentages sum to {total}, expected 100")

        # Calculate actual amounts from percentages
        budget_data["needs_amount"] = round(income * budget_data["needs_pct"] / 100, 2)
        budget_data["wants_amount"] = round(income * budget_data["wants_pct"] / 100, 2)
        budget_data["savings_amount"] = round(income * budget_data["savings_pct"] / 100, 2)
        budget_data["investments_amount"] = round(income * budget_data["investments_pct"] / 100, 2)

        return budget_data

    except Exception as e:
        # Log the error and fall back to rule-based budgeting
        print(f"[BudgetGenerator] AI generation failed: {e}. Using fallback.")
        return _fallback_budget(income, risk_profile)
