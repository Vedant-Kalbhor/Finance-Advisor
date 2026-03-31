"""
Monte Carlo Goal Simulation Engine.
Runs N simulations with market volatility to produce probability cones for financial goals.
"""
import numpy as np
from typing import Dict, Any, List


# Annualized return and volatility assumptions by risk profile
RISK_PARAMS = {
    "Conservative": {"mean_return": 0.08, "volatility": 0.06},
    "Moderate":     {"mean_return": 0.12, "volatility": 0.12},
    "Aggressive":   {"mean_return": 0.16, "volatility": 0.20},
}

N_SIMULATIONS = 1000
MONTHS_PER_YEAR = 12


def run_monte_carlo_simulation(
    goal: Dict[str, Any],
    monthly_sip: float,
    current_amount: float,
    risk_profile: str = "Moderate",
    n_simulations: int = N_SIMULATIONS,
) -> Dict[str, Any]:
    """
    Run Monte Carlo simulation for a financial goal.

    Args:
        goal: Goal dict with target_amount, target_date, name.
        monthly_sip: Monthly SIP investment amount.
        current_amount: Already accumulated amount.
        risk_profile: 'Conservative', 'Moderate', or 'Aggressive'.
        n_simulations: Number of simulation paths to run.

    Returns:
        Simulation results with probability percentiles and cone data.
    """
    params = RISK_PARAMS.get(risk_profile, RISK_PARAMS["Moderate"])
    annual_mean = params["mean_return"]
    annual_vol = params["volatility"]

    # Convert to monthly
    monthly_mean = annual_mean / MONTHS_PER_YEAR
    monthly_vol = annual_vol / np.sqrt(MONTHS_PER_YEAR)

    # Calculate months to target
    target_amount = float(goal.get("target_amount", 0))
    target_date_str = goal.get("target_date", "")
    
    try:
        from datetime import datetime
        target_date = datetime.strptime(target_date_str, "%Y-%m-%d")
        now = datetime.now()
        months_left = max(1, (target_date.year - now.year) * 12 + (target_date.month - now.month))
    except Exception:
        months_left = 60  # Default 5 years

    # Run simulations
    rng = np.random.default_rng(seed=42)
    # Shape: (n_simulations, months_left)
    monthly_returns = rng.normal(monthly_mean, monthly_vol, size=(n_simulations, months_left))

    # Build portfolio value paths
    # Start all sims at current_amount
    portfolio = np.zeros((n_simulations, months_left + 1))
    portfolio[:, 0] = current_amount

    for month in range(months_left):
        portfolio[:, month + 1] = (portfolio[:, month] + monthly_sip) * (1 + monthly_returns[:, month])

    final_values = portfolio[:, -1]

    # --- Probability of reaching the goal ---
    prob_success = float(np.mean(final_values >= target_amount) * 100)

    # --- Percentile Cone (for chart visualization) ---
    # Compute percentiles at each month snapshot
    # We sample at most 36 points for chart performance
    step = max(1, months_left // 36)
    time_points = list(range(0, months_left + 1, step))
    if time_points[-1] != months_left:
        time_points.append(months_left)

    cone_data = []
    for t in time_points:
        col = portfolio[:, t]
        cone_data.append({
            "month": t,
            "p10": round(float(np.percentile(col, 10)), 2),
            "p25": round(float(np.percentile(col, 25)), 2),
            "p50": round(float(np.percentile(col, 50)), 2),  # Median
            "p75": round(float(np.percentile(col, 75)), 2),
            "p90": round(float(np.percentile(col, 90)), 2),
        })

    # --- Find years when goals are likely hit ---
    # For each sim, find which month portfolio first crosses target
    hit_months = []
    for sim_idx in range(n_simulations):
        path = portfolio[sim_idx]
        crossed = np.where(path >= target_amount)[0]
        if len(crossed) > 0:
            hit_months.append(crossed[0])

    hit_months = np.array(hit_months) if hit_months else np.array([])

    # Milestone probabilities
    milestones = {}
    checkpoint_months = [12, 24, 36, 48, 60, months_left]
    for m in sorted(set(checkpoint_months)):
        if m <= months_left:
            prob = float(np.mean(final_values >= target_amount) * 100) if m == months_left else _prob_by_month(portfolio, target_amount, m, n_simulations)
            milestones[f"month_{m}"] = round(prob, 1)

    return {
        "goal_name": goal.get("name", "Goal"),
        "target_amount": target_amount,
        "current_amount": current_amount,
        "monthly_sip": round(monthly_sip, 2),
        "months_to_target": months_left,
        "risk_profile": risk_profile,
        "n_simulations": n_simulations,
        "probability_of_success": round(prob_success, 1),
        "median_final_value": round(float(np.percentile(final_values, 50)), 2),
        "optimistic_final_value": round(float(np.percentile(final_values, 90)), 2),
        "pessimistic_final_value": round(float(np.percentile(final_values, 10)), 2),
        "cone_data": cone_data,
        "milestones": milestones,
        "early_hit_prob": round(float(np.mean(hit_months < months_left * 0.75) * 100), 1) if len(hit_months) > 0 else 0.0,
        "summary": _build_summary(prob_success, target_amount, months_left, risk_profile, float(np.percentile(final_values, 90))),
    }


def _prob_by_month(portfolio: np.ndarray, target: float, month: int, n_sims: int) -> float:
    if month >= portfolio.shape[1]:
        return 0.0
    return float(np.mean(portfolio[:, month] >= target) * 100)


def _build_summary(prob: float, target: float, months: float, risk: str, optimistic: float) -> str:
    years = round(months / 12, 1)
    if prob >= 80:
        return f"HIGH CONFIDENCE: You have a {prob:.0f}% probability of reaching ₹{target:,.0f} within {years} years with a {risk} strategy."
    elif prob >= 50:
        return f"MODERATE CONFIDENCE: {prob:.0f}% chance of success. Market conditions significantly impact outcomes. Consider increasing SIP to improve odds."
    else:
        return f"LOW CONFIDENCE ({prob:.0f}%): Current SIP is unlikely to reach ₹{target:,.0f} in {years} years. Consider increasing contributions or extending the timeline. Bullish scenario: ₹{optimistic:,.0f}."
