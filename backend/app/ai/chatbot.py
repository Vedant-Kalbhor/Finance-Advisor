"""
Chatbot AI Module
==================
Uses Google Gemini to power a conversational financial advisor chatbot.
The chatbot receives the user's full financial context (profile, investments,
goals) and responds to finance-related queries in simplified language.

Google Search grounding is enabled so the chatbot can answer questions
about current market conditions, stock prices, news, and trends.
Sources are cited in the response.

Input: user message, conversation history, user financial context
Output: AI-generated response string (with source citations appended)
"""

import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Google Search tool — allows Gemini to search the web
# for current market data, news, and real-time financial information.
google_search_tool = genai.protos.Tool(
    google_search=genai.protos.Tool.GoogleSearch()
)


def _build_system_prompt(user_context: dict) -> str:
    """
    Builds a system prompt that gives Gemini full context about the user's
    financial situation so it can provide personalized advice.
    """
    profile = user_context.get("profile", {})
    investments = user_context.get("investments", [])
    goals = user_context.get("goals", [])

    investments_summary = "None"
    if investments:
        inv_lines = []
        for inv in investments:
            inv_lines.append(
                f"  - {inv.get('name', 'Unknown')}: ₹{inv.get('amount', 0):,.2f} "
                f"({inv.get('type', 'N/A')}, {inv.get('frequency', 'N/A')}, "
                f"Expected Return: {inv.get('expected_return', 0)}%)"
            )
        investments_summary = "\n".join(inv_lines)

    goals_summary = "None"
    if goals:
        goal_lines = []
        for goal in goals:
            progress = 0
            if goal.get("target_amount", 0) > 0:
                progress = round(
                    (goal.get("current_amount", 0) / goal["target_amount"]) * 100, 1
                )
            goal_lines.append(
                f"  - {goal.get('name', 'Unknown')}: Target ₹{goal.get('target_amount', 0):,.2f}, "
                f"Current ₹{goal.get('current_amount', 0):,.2f} ({progress}% done), "
                f"Priority: {goal.get('priority', 'Medium')}, By: {goal.get('target_date', 'N/A')}"
            )
        goals_summary = "\n".join(goal_lines)

    monthly_income = profile.get("monthly_income", 0)
    monthly_expenses = profile.get("monthly_expenses", 0)
    savings = monthly_income - monthly_expenses
    savings_rate = round((savings / monthly_income) * 100, 1) if monthly_income > 0 else 0
    total_invested = sum(inv.get("amount", 0) for inv in investments)

    system_prompt = f"""You are "Finance Advisor AI", a friendly, knowledgeable, and up-to-date personal finance advisor chatbot.
You have access to the user's complete financial profile AND the ability to search the internet for current market data, news, and financial trends.

═══════════════════════════════════════
CORE BEHAVIOR RULES
═══════════════════════════════════════

1. **Simple Language**: Always respond in simple, easy-to-understand language. If you must use a financial term (like "P/E ratio", "NAV", "yield"), explain it briefly in parentheses.

2. **Personalized Advice**: Base your advice on the user's actual financial data shown below. Reference their specific numbers, goals, and risk profile when relevant.

3. **Honest & Encouraging**: Be supportive but honest. If something looks risky or the user is making a questionable financial decision, say so gently with a clear explanation of why.

4. **Concise Responses**: Keep responses to 2-4 paragraphs unless the user explicitly asks for a detailed breakdown or analysis.

5. **Finance Only**: If the user asks something unrelated to finance, money, investments, taxes, or economics, politely redirect them back to financial topics.

6. **Indian Context**: Use Indian Rupee (₹) for all currency. Be aware of Indian financial instruments (PPF, NPS, ELSS, FDs, etc.), Indian tax laws (Section 80C, 80D, HRA, etc.), and Indian market indices (Nifty, Sensex).

7. **Formatting**: Use bullet points, numbered lists, and bold text to make responses scannable and clear.

═══════════════════════════════════════
WEB SEARCH & CURRENT MARKET DATA
═══════════════════════════════════════

You have access to Google Search. Use it proactively when the user asks about:
- Current stock prices, index levels (Nifty, Sensex, S&P 500), or crypto prices
- Recent market news, IPOs, or economic events
- Current interest rates (RBI repo rate, FD rates, loan rates)
- Latest government schemes, tax rule changes, or budget announcements
- Fund/stock performance, ratings, or analyst opinions
- Any question where real-time or recent data would improve your answer

CITATION RULES:
- When you use information from web search, ALWAYS cite your sources inline in your response.
- Format citations as: **[Source Name](URL)** — e.g., **[Moneycontrol](https://www.moneycontrol.com/...)**
- Prefer reliable, authoritative financial sources:
  * Official sources: RBI, SEBI, Income Tax Department, NSE/BSE
  * Trusted financial portals: Moneycontrol, Economic Times, LiveMint, NDTV Profit, Value Research
  * Global: Bloomberg, Reuters, Yahoo Finance, Investopedia
- AVOID citing: random blogs, forums, social media posts, or unverified sources.
- If the data is time-sensitive (e.g., stock prices), mention the date/time context so the user knows how current it is.
- At the end of your response, if you cited multiple sources, add a brief "**Sources:**" section listing them.

═══════════════════════════════════════
USER'S FINANCIAL PROFILE
═══════════════════════════════════════

- Name: {profile.get('full_name', 'User')}
- Age: {profile.get('age', 'Not specified')}
- Occupation: {profile.get('occupation', 'Not specified')}
- Location: {profile.get('location', 'Not specified')}
- Risk Profile: {profile.get('risk_profile', 'Moderate')}

MONTHLY CASHFLOW:
- Monthly Income: ₹{monthly_income:,.2f}
- Monthly Expenses: ₹{monthly_expenses:,.2f}
- Monthly Savings: ₹{savings:,.2f}
- Savings Rate: {savings_rate}%

TAX INFORMATION:
- Tax Regime: {profile.get('tax_regime', 'New')}
- 80C Deductions: ₹{profile.get('deductions_80c', 0):,.2f}
- 80D Deductions: ₹{profile.get('deductions_80d', 0):,.2f}
- Other Deductions: ₹{profile.get('other_deductions', 0):,.2f}

INVESTMENTS (Total: ₹{total_invested:,.2f}):
{investments_summary}

FINANCIAL GOALS:
{goals_summary}

═══════════════════════════════════════

Remember: You're their trusted financial friend. Be warm, practical, data-driven, and always back up market-related claims with real sources."""

    return system_prompt


def _extract_citations(response) -> list:
    """
    Extract source citations from Gemini's grounding metadata.
    Returns a list of dicts with 'title' and 'url' keys.
    """
    citations = []
    seen_urls = set()

    try:
        candidate = response.candidates[0]
        grounding_meta = getattr(candidate, "grounding_metadata", None)
        if not grounding_meta:
            return citations

        grounding_chunks = getattr(grounding_meta, "grounding_chunks", [])
        for chunk in grounding_chunks:
            web = getattr(chunk, "web", None)
            if web:
                url = getattr(web, "uri", "")
                title = getattr(web, "title", "")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    citations.append({
                        "title": title.strip() if title else url,
                        "url": url,
                    })
    except Exception as e:
        print(f"[Chatbot] Citation extraction error: {e}")

    return citations


def _format_response_with_citations(text: str, citations: list) -> str:
    """
    Appends a formatted sources section to the response if there are
    citations from web search that aren't already mentioned in the text.
    """
    if not citations:
        return text

    # Check which citations are not already in the response text
    new_citations = []
    for cite in citations:
        if cite["url"] not in text:
            new_citations.append(cite)

    if not new_citations:
        return text

    sources_section = "\n\n---\n📌 **Sources:**\n"
    for cite in new_citations:
        sources_section += f"- [{cite['title']}]({cite['url']})\n"

    return text + sources_section


async def generate_chat_response(
    message: str,
    history: list,
    user_context: dict,
) -> str:
    """
    Generate a chatbot response using Gemini with Google Search grounding.

    Args:
        message: The user's current message
        history: List of previous messages [{"role": "user"|"assistant", "content": "..."}]
        user_context: Dict with "profile", "investments", "goals" keys

    Returns:
        The AI-generated response string with source citations
    """
    if not GEMINI_API_KEY:
        return (
            "I'm sorry, the AI service is not configured right now. "
            "Please contact support to enable the chatbot feature."
        )

    try:
        system_prompt = _build_system_prompt(user_context)

        model = genai.GenerativeModel(
            "gemini-2.5-flash",
            system_instruction=system_prompt,
            tools=[google_search_tool],
        )

        # Convert history to Gemini's format
        gemini_history = []
        for msg in history:
            role = "user" if msg.get("role") == "user" else "model"
            gemini_history.append({
                "role": role,
                "parts": [msg.get("content", "")],
            })

        chat = model.start_chat(history=gemini_history)
        response = chat.send_message(message)

        response_text = response.text.strip()

        # Extract citations from grounding metadata and append if needed
        citations = _extract_citations(response)
        response_text = _format_response_with_citations(response_text, citations)

        return response_text

    except Exception as e:
        print(f"[Chatbot] AI generation failed: {e}")
        return (
            "I'm having a bit of trouble processing your request right now. "
            "Could you try rephrasing your question, or try again in a moment?"
        )


async def generate_investment_recommendations(
    risk_level: str,
    investment_type: str,
    user_context: dict,
) -> str:
    """
    Generate AI-powered investment recommendations using Gemini with
    Google Search grounding.

    Args:
        risk_level: "Conservative", "Moderate", or "Aggressive"
        investment_type: e.g. "Stock", "Mutual Fund", "Commodity", "Gold/Silver", etc.
        user_context: Dict with "profile", "investments", "goals" keys

    Returns:
        Formatted markdown string with specific investment recommendations
        and source citations.
    """
    if not GEMINI_API_KEY:
        return (
            "The AI service is not configured. "
            "Please contact support to enable recommendations."
        )

    try:
        profile = user_context.get("profile", {})
        investments = user_context.get("investments", [])
        goals = user_context.get("goals", [])

        # Build portfolio summary for context
        portfolio_lines = []
        for inv in investments:
            portfolio_lines.append(
                f"  - {inv.get('name', 'Unknown')}: ₹{inv.get('amount', 0):,.2f} "
                f"({inv.get('type', 'N/A')}, Expected Return: {inv.get('expected_return', 0)}%)"
            )
        portfolio_summary = "\n".join(portfolio_lines) if portfolio_lines else "No existing investments."

        total_invested = sum(inv.get("amount", 0) for inv in investments)
        monthly_income = profile.get("monthly_income", 0)
        monthly_expenses = profile.get("monthly_expenses", 0)
        monthly_savings = monthly_income - monthly_expenses

        goals_summary = "None"
        if goals:
            goal_lines = []
            for g in goals:
                goal_lines.append(
                    f"  - {g.get('name', 'Unknown')}: Target ₹{g.get('target_amount', 0):,.2f}, "
                    f"Priority: {g.get('priority', 'Medium')}, By: {g.get('target_date', 'N/A')}"
                )
            goals_summary = "\n".join(goal_lines)

        system_prompt = f"""You are an expert investment advisor AI with access to real-time market data via Google Search.

Your task is to provide **5 specific, real investment recommendations** based on the user's preferences and financial profile.

═══════════════════════════════════════
USER PREFERENCES
═══════════════════════════════════════
- Risk Tolerance: {risk_level}
- Investment Type Requested: {investment_type}

═══════════════════════════════════════
USER'S FINANCIAL PROFILE
═══════════════════════════════════════
- Name: {profile.get('full_name', 'User')}
- Age: {profile.get('age', 'Not specified')}
- Risk Profile: {profile.get('risk_profile', 'Moderate')}
- Monthly Income: ₹{monthly_income:,.2f}
- Monthly Expenses: ₹{monthly_expenses:,.2f}
- Monthly Savings: ₹{monthly_savings:,.2f}
- Total Currently Invested: ₹{total_invested:,.2f}

CURRENT PORTFOLIO:
{portfolio_summary}

FINANCIAL GOALS:
{goals_summary}

═══════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════

1. **Search the internet** for current, real {investment_type} options that match the "{risk_level}" risk level.

2. Return exactly **5 specific recommendations**. For each, provide:
   - **Name** of the specific {investment_type} (real name, not generic)
   - **Current Price / NAV** (search for the latest available)
   - **Why it fits** the user's profile and risk tolerance
   - **Expected Returns** (based on historical performance)
   - **Risk Assessment** specific to this option

3. **Consider the user's existing portfolio** to:
   - Avoid recommending what they already own
   - Suggest diversification where needed
   - Align with their financial goals

4. **Indian Context**: Use ₹ for currency. Focus on Indian markets (NSE/BSE listed stocks, AMFI registered mutual funds, MCX commodities, etc.) unless the user's profile suggests otherwise.

5. **Format** your response clearly with:
   - A brief portfolio analysis paragraph at the top
   - Numbered list of 5 recommendations with details
   - A summary/disclaimer at the bottom

6. **Cite sources** for all market data using: **[Source Name](URL)**
   Prefer: Moneycontrol, Economic Times, NSE India, Value Research, LiveMint, AMFI.

7. **Be honest**: Include appropriate disclaimers about market risks. These are suggestions, not guaranteed returns.

Remember: These must be REAL, CURRENT investment options that actually exist in the market today."""

        model = genai.GenerativeModel(
            "gemini-2.5-flash",
            system_instruction=system_prompt,
            tools=[google_search_tool],
        )

        user_message = (
            f"Based on my profile and current portfolio, recommend 5 specific "
            f"{investment_type} options with a {risk_level.lower()} risk approach. "
            f"Search for the latest market data and give me actionable suggestions."
        )

        response = model.generate_content(user_message)
        response_text = response.text.strip()

        # Extract and append citations
        citations = _extract_citations(response)
        response_text = _format_response_with_citations(response_text, citations)

        return response_text

    except Exception as e:
        print(f"[AI Recommendations] Generation failed: {e}")
        return (
            "I'm having trouble generating recommendations right now. "
            "Please try again in a moment."
        )
