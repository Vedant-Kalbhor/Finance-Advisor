"""
Expense Anomaly Detection using Isolation Forest (scikit-learn).
Detects unusual investment/expense entries compared to the user's typical spending patterns.
"""
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Any


def detect_anomalies(investments: List[Dict[str, Any]], contamination: float = 0.1) -> List[Dict[str, Any]]:
    """
    Runs Isolation Forest on the user's investment amounts to detect anomalies.
    
    Args:
        investments: List of investment dicts with 'amount', 'name', 'type' keys.
        contamination: Expected fraction of outliers (0.1 = 10%).
    
    Returns:
        List of anomaly results with is_anomaly flag and reason.
    """
    if len(investments) < 3:
        # Need minimum data points for meaningful ML detection
        return [
            {
                "id": inv.get("id"),
                "name": inv.get("name"),
                "amount": inv.get("amount"),
                "type": inv.get("type"),
                "is_anomaly": False,
                "confidence": 0,
                "reason": "Insufficient data for ML analysis (need 3+ transactions)",
                "severity": "info"
            }
            for inv in investments
        ]

    amounts = np.array([float(inv.get("amount", 0)) for inv in investments]).reshape(-1, 1)
    
    # Normalize amounts
    scaler = StandardScaler()
    amounts_scaled = scaler.fit_transform(amounts)
    
    # Isolation Forest: contamination = estimated % of outliers
    # n_estimators=100 means 100 decision trees
    clf = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=42
    )
    labels = clf.fit_predict(amounts_scaled)  # -1 = anomaly, 1 = normal
    scores = clf.score_samples(amounts_scaled)  # More negative = more anomalous
    
    # Compute statistics
    mean_amount = float(np.mean(amounts))
    std_amount = float(np.std(amounts))
    
    results = []
    for i, inv in enumerate(investments):
        amount = float(inv.get("amount", 0))
        is_anomaly = labels[i] == -1
        
        # Convert score to a 0-100 confidence (how anomalous it is)
        # scores are negative; more negative = more anomalous
        raw_score = scores[i]
        # Normalize: typical range is roughly -0.5 to 0.5
        confidence = min(100, max(0, int((-raw_score - 0.3) * 200))) if is_anomaly else 0
        
        # Human-readable reason
        reason = _explain_anomaly(amount, mean_amount, std_amount, is_anomaly)
        severity = _get_severity(confidence, amount, mean_amount)
        
        results.append({
            "id": inv.get("id"),
            "name": inv.get("name"),
            "amount": amount,
            "type": inv.get("type"),
            "is_anomaly": is_anomaly,
            "confidence": confidence,
            "reason": reason,
            "severity": severity,
            "mean_amount": round(mean_amount, 2),
            "std_amount": round(std_amount, 2),
        })
    
    return results


def _explain_anomaly(amount: float, mean: float, std: float, is_anomaly: bool) -> str:
    if not is_anomaly:
        return f"Normal transaction. Consistent with your average of ₹{mean:,.0f}."
    
    if amount > mean + 2 * std:
        ratio = round(amount / mean, 1)
        return (
            f"UNUSUALLY HIGH: This transaction (₹{amount:,.0f}) is {ratio}x your typical amount "
            f"(avg ₹{mean:,.0f}). Potential fraud or large one-time expense. Verify this entry."
        )
    elif amount < mean - 2 * std and amount > 0:
        return (
            f"UNUSUALLY LOW: This transaction (₹{amount:,.0f}) is significantly below your average "
            f"(avg ₹{mean:,.0f}). May indicate a data entry error or partial payment."
        )
    else:
        return (
            f"OUTLIER DETECTED: This transaction (₹{amount:,.0f}) deviates significantly from your "
            f"typical spending pattern (avg ₹{mean:,.0f}, std ₹{std:,.0f})."
        )


def _get_severity(confidence: int, amount: float, mean: float) -> str:
    if confidence == 0:
        return "normal"
    elif confidence >= 70 or amount > mean * 5:
        return "high"
    elif confidence >= 40 or amount > mean * 2:
        return "medium"
    else:
        return "low"
