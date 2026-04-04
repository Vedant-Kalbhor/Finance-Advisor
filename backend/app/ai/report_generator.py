import os
import requests
import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OLLAMA_URLS = ["http://127.0.0.1:11434/api/generate", "http://localhost:11434/api/generate"]
OLLAMA_MODEL = "llama2:latest"


def _build_prompt(user_context: dict, report_type: str) -> str:
    profile = user_context.get("profile", {})
    investments = user_context.get("investments", [])
    goals = user_context.get("goals", [])

    monthly_income = profile.get("monthly_income", 0) or 0
    monthly_expenses = profile.get("monthly_expenses", 0) or 0
    monthly_savings = monthly_income - monthly_expenses
    savings_rate = round((monthly_savings / monthly_income * 100), 1) if monthly_income > 0 else 0
    total_invested = sum(i.get("amount", 0) or 0 for i in investments)

    assets_text = "\n".join(
        [f"  - {i.get('name', 'N/A')} | Type: {i.get('type', 'N/A')} | Invested: INR {i.get('amount', 0):,.0f}" for i in investments]
    ) or "  No assets recorded."

    goals_text = "\n".join(
        [f"  - {g.get('name', 'N/A')} | Target: INR {g.get('target_amount', 0):,.0f}" for g in goals]
    ) or "  No goals set."

    return f"""
You are a Senior Certified Financial Planner (CFP) preparing a formal '{report_type}' report for a client.
Write a structured, professional, and data-driven report using ONLY the information provided below.
Do NOT make up numbers. Use Indian financial context (INR, Indian tax laws, SEBI regulations).

=== CLIENT PROFILE ===
Name: {profile.get('full_name', 'Valued Client')}
Age: {profile.get('age', 'N/A')}
Occupation region: {profile.get('location', 'India')}
Risk Appetite: {profile.get('risk_profile', 'Moderate')}

=== FINANCIAL SNAPSHOT ===
Monthly Income: INR {monthly_income:,.0f}
Monthly Expenses: INR {monthly_expenses:,.0f}
Monthly Savings: INR {monthly_savings:,.0f}
Savings Rate: {savings_rate}%
Total Portfolio Value: INR {total_invested:,.0f}

=== PORTFOLIO HOLDINGS ===
{assets_text}

=== FINANCIAL GOALS ===
{goals_text}

=== REPORT INSTRUCTIONS ===
Write the following sections with clear headings:

1. EXECUTIVE SUMMARY
   - Overall financial health assessment in 3-4 sentences.

2. SAVINGS & CASHFLOW ANALYSIS
   - Comment on savings rate ({savings_rate}%). Is this healthy?
   - Benchmark against the 50/30/20 rule.

3. PORTFOLIO ASSESSMENT
   - Evaluate the holdings quality and diversity.
   - Note any concentration risk.

4. STRATEGIC RECOMMENDATIONS (at least 4 specific, actionable)
   - E.g., "Increase SIP in diversified equity funds by INR X"
   - Reference specific asset classes for the client's risk profile.

5. GOAL FEASIBILITY ASSESSMENT
   - Comment on whether goals are realistic given current savings pace.

Keep it within 600 words. Use plain text, not markdown.
"""


async def generate_comprehensive_financial_report(user_context: dict, report_type: str = "Overview") -> str:
    prompt = _build_prompt(user_context, report_type)

    # 1. Try Ollama (local Llama2)
    for url in OLLAMA_URLS:
        try:
            response = requests.post(
                url,
                json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
                timeout=45,
            )
            if response.status_code == 200:
                text = response.json().get("response", "").strip()
                if text:
                    print(f"[ReportGen] Success via Ollama at {url}")
                    return text
        except Exception as e:
            print(f"[ReportGen] Ollama at {url} failed: {e}")

    # 2. Fallback to Gemini
    if not GEMINI_API_KEY:
        print("[ReportGen] No GEMINI_API_KEY found. Generating data-based report.")
        return _generate_data_based_report(user_context, report_type)

    for model_name in ["gemini-2.5-flash", "gemini-2.5-pro"]:
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            text = response.text.strip()
            if text:
                print(f"[ReportGen] Success via Gemini model: {model_name}")
                return text
        except Exception as e:
            print(f"[ReportGen] Gemini {model_name} failed: {e}")

    # 3. Final Fallback: data-based template
    return _generate_data_based_report(user_context, report_type)


def _generate_data_based_report(user_context: dict, report_type: str) -> str:
    """
    Generates a structured financial report purely from data — no LLM needed.
    This is the failsafe so users always receive a meaningful PDF.
    """
    profile = user_context.get("profile", {})
    investments = user_context.get("investments", [])
    goals = user_context.get("goals", [])

    name = profile.get("full_name", "Valued Client")
    income = profile.get("monthly_income", 0) or 0
    expenses = profile.get("monthly_expenses", 0) or 0
    savings = income - expenses
    savings_rate = round((savings / income * 100), 1) if income > 0 else 0
    total_invested = sum(i.get("amount", 0) or 0 for i in investments)
    risk = profile.get("risk_profile", "Moderate")

    health = "Strong" if savings_rate >= 20 else ("Adequate" if savings_rate >= 10 else "Needs Attention")
    sip_advice = "Continue and increase SIP contributions systematically." if savings_rate >= 20 else "Consider reducing discretionary spending to boost savings rate to at least 20%."

    return f"""
FINANCIAL REPORT — {report_type.upper()}
Prepared for: {name} | Report Date: {__import__('datetime').datetime.now().strftime('%d %B %Y')}

EXECUTIVE SUMMARY
Your overall financial health is rated: {health}. With a monthly savings rate of {savings_rate}%, your financial trajectory requires {'continued discipline' if savings_rate >= 20 else 'improvement to meet long-term goals'}. Your current portfolio stands at INR {total_invested:,.0f} across {len(investments)} assets.

SAVINGS & CASHFLOW ANALYSIS
Monthly Income: INR {income:,.0f}
Monthly Expenses: INR {expenses:,.0f}
Monthly Surplus: INR {savings:,.0f} ({savings_rate}% savings rate)

The standard 50/30/20 benchmark recommends allocating 50% to needs, 30% to wants, and 20% to savings. Your current savings rate of {savings_rate}% is {'above' if savings_rate >= 20 else 'below'} this benchmark. {sip_advice}

PORTFOLIO ASSESSMENT
Total Portfolio Value: INR {total_invested:,.0f}
Number of Holdings: {len(investments)}
{chr(10).join([f"  - {i.get('name', 'N/A')}: INR {i.get('amount', 0):,.0f} ({i.get('type', 'N/A')})" for i in investments]) if investments else "  No holdings recorded. It is recommended to begin building a diversified portfolio."}

Risk Profile: {risk}. {'For a Moderate investor, a balanced allocation of 60% equity and 40% debt is recommended.' if risk == 'Moderate' else 'For an Aggressive investor, an 80% equity allocation is recommended for long-term wealth creation.' if risk == 'Aggressive' else 'For a Conservative investor, a 30% equity and 70% debt allocation is recommended.'}

STRATEGIC RECOMMENDATIONS
1. Maintain an emergency fund equivalent to 6 months of expenses (INR {expenses * 6:,.0f}).
2. {'Increase SIP contributions as your savings rate supports it.' if savings_rate >= 20 else f'Redirect INR {max(0, income*0.2 - savings):,.0f}/month from expenses to investments to reach a 20% savings rate.'}
3. Ensure tax-saving investments (ELSS, PPF) cover at least INR 1,50,000 annually under Section 80C.
4. Review portfolio allocation every 6 months and rebalance as needed.
5. Consider term life insurance cover of at least 10x annual income.

GOAL FEASIBILITY ASSESSMENT
{f'You have {len(goals)} active financial goal(s). At your current savings rate of {savings_rate}%, consistent monthly deployment of INR {savings:,.0f} should contribute meaningfully toward your targets.' if goals else 'No financial goals are currently defined. Setting clear goals with target dates is strongly recommended for structured wealth creation.'}

Note: This report was generated from profile data. Connect an AI model (Gemini or local Ollama) for deeper, personalized insights.
""".strip()
