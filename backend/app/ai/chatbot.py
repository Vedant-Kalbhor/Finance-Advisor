"""
Chatbot AI Module
==================
Uses a LangChain ReAct agent powered by Google Gemini to run a
conversational financial advisor chatbot.

The agent receives the user's full financial context (profile, investments,
goals) via a system prompt and has access to an Exa web search tool so it
can autonomously look up real-time market data, news, prices, and financial
information when it decides it needs to.

Architecture:
  LangGraph create_react_agent  ->  ChatGoogleGenerativeAI (Gemini)
                                 ->  ExaSearchResults (web search tool)

Input:  user message, conversation history, user financial context
Output: AI-generated response string (with source citations)
"""

import os
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.prebuilt import create_react_agent

from .exa_search import get_exa_search_tool

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


# ---------------------------------------------------------------------------
# LLM & tool initialization (done once at module load)
# ---------------------------------------------------------------------------

def _create_llm():
    """Create and return the ChatGoogleGenerativeAI (Gemini) LLM instance."""
    if not GEMINI_API_KEY:
        return None
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=GEMINI_API_KEY,
        temperature=0.7,
    )


def _get_tools() -> list:
    """Collect all available tools for the agent."""
    tools = []
    exa_tool = get_exa_search_tool()
    if exa_tool:
        tools.append(exa_tool)
    return tools


_llm = _create_llm()
_tools = _get_tools()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_text(content) -> str:
    """
    Safely extract a plain-text string from an AIMessage's content field.

    AIMessage.content can be:
      - str              -> return as-is
      - list[str]        -> join them
      - list[dict]       -> extract "text" blocks, skip tool_use blocks
    """
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and item.get("type") == "text":
                parts.append(item.get("text", ""))
        return "\n".join(parts).strip()
    return str(content).strip()


# Maximum number of reasoning steps the agent is allowed to take.
# Each step = 1 LLM call + potentially 1 tool call.
# This prevents runaway loops that burn through API credits.
AGENT_RECURSION_LIMIT = 8


def _convert_history(history: list) -> list:
    """
    Convert the app's chat history format to LangChain message objects.

    App format:  [{"role": "user"|"assistant", "content": "..."}, ...]
    LangChain:   [HumanMessage(...), AIMessage(...), ...]
    """
    messages = []
    for msg in history:
        content = msg.get("content", "")
        if msg.get("role") == "user":
            messages.append(HumanMessage(content=content))
        else:
            messages.append(AIMessage(content=content))
    return messages


# ---------------------------------------------------------------------------
# System prompts
# ---------------------------------------------------------------------------

def _build_system_prompt(user_context: dict) -> str:
    """
    Builds a system prompt that gives the agent full context about the user's
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
You have access to the user's complete financial profile AND you have a web search tool to find real-time financial data.

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

8. **Tool Usage**: Use the web search tool whenever you need up-to-date market information, news, current prices, or to verify facts you are unsure of. Add "India" or "Indian market" to your search queries for better relevance.

═══════════════════════════════════════
CITATION RULES
═══════════════════════════════════════

When you use information from web search results:
- ALWAYS cite your sources inline in your response.
- Format citations as: **[Source Name](URL)** — e.g., **[Moneycontrol](https://www.moneycontrol.com/...)**
- Prefer reliable, authoritative financial sources (RBI, SEBI, Moneycontrol, Economic Times, Bloomberg, etc.).
- If data is time-sensitive (stock prices), mention the date/time from the source.

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

Remember: You're their trusted financial friend. Be proactive in using your search tool to give current and actionable advice."""

    return system_prompt


# ---------------------------------------------------------------------------
# Public API — same signatures as before, so the API layer needs no changes
# ---------------------------------------------------------------------------

async def generate_chat_response(
    message: str,
    history: list,
    user_context: dict,
) -> str:
    """
    Generate a chatbot response using a LangChain ReAct agent
    (Gemini LLM + Exa web search tool).

    Args:
        message:      The user's current message.
        history:      Conversation history as [{"role": "user"|"assistant", "content": "..."}].
        user_context: Dict with keys "profile", "investments", "goals".

    Returns:
        AI-generated response string.
    """
    if not _llm:
        return (
            "I'm sorry, the AI service is not configured right now. "
            "Please contact support to enable the chatbot feature."
        )

    try:
        system_prompt = _build_system_prompt(user_context)

        # Build the agent with the system prompt and tools
        agent = create_react_agent(
            model=_llm,
            tools=_tools,
            prompt=system_prompt,
        )

        # Build message list: history + current user message
        messages = _convert_history(history)
        messages.append(HumanMessage(content=message))

        # Invoke the agent (capped to prevent runaway tool-call loops)
        result = await agent.ainvoke(
            {"messages": messages},
            config={"recursion_limit": AGENT_RECURSION_LIMIT},
        )

        # Extract the final AI response from the agent's message list
        ai_messages = [
            m for m in result["messages"]
            if isinstance(m, AIMessage) and m.content
        ]
        if ai_messages:
            return _extract_text(ai_messages[-1].content)

        return "I wasn't able to generate a response. Please try again."

    except Exception as e:
        print(f"[Chatbot] AI generation failed: {e}")
        import traceback
        traceback.print_exc()
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
    Generate AI-powered investment recommendations using a LangChain ReAct agent
    (Gemini LLM + Exa web search tool).

    Args:
        risk_level:      e.g. "Conservative", "Moderate", "Aggressive"
        investment_type: e.g. "Mutual Fund", "Stock", "Gold"
        user_context:    Dict with keys "profile", "investments", "goals".

    Returns:
        AI-generated recommendations string.
    """
    if not _llm:
        return (
            "The AI service is not configured. "
            "Please contact support to enable recommendations."
        )

    try:
        profile = user_context.get("profile", {})
        investments = user_context.get("investments", [])
        goals = user_context.get("goals", [])

        # Build portfolio summary
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

        system_prompt = f"""You are an expert investment advisor AI. You have access to a web search tool
to gather real-time market data.

CRITICAL: Use the search tool to find specific, current funds, prices, and market trends.
Do NOT make up fund names or prices. Only recommend options you find through search or know exist.
Add "India" or "Indian market" to your search queries for better relevance.

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

1. **Search first**: Use the web search tool to find the latest data on {investment_type} options in India.

2. **Recommend 5 specific options** with current returns/performance data.

3. **Suggest specific amounts** to invest based on their ₹{monthly_savings:,.2f} monthly savings.

4. **Diversity**: Ensure the 5 options provide a balanced portfolio.

5. **Cite sources** as: **[Source Name](URL)** using the URLs from search.

6. **Be honest**: Include appropriate disclaimers about market risks. Use ₹ for all currency.

═══════════════════════════════════════
USER'S CURRENT SITUATION
═══════════════════════════════════════
- Profile: {profile.get('risk_profile', 'Moderate')}
- Monthly Savings: ₹{monthly_savings:,.2f}
- Existing Investments: {portfolio_summary}
- Goals: {goals_summary}
"""

        # Build the agent with investment-focused system prompt
        agent = create_react_agent(
            model=_llm,
            tools=_tools,
            prompt=system_prompt,
        )

        user_message = (
            f"Recommend 5 specific {investment_type} options for me with a {risk_level.lower()} risk approach. "
            "Use your search tool to give me the latest data."
        )

        result = await agent.ainvoke(
            {"messages": [HumanMessage(content=user_message)]},
            config={"recursion_limit": AGENT_RECURSION_LIMIT},
        )

        # Extract the final AI response
        ai_messages = [
            m for m in result["messages"]
            if isinstance(m, AIMessage) and m.content
        ]
        if ai_messages:
            return _extract_text(ai_messages[-1].content)

        return "I wasn't able to generate recommendations. Please try again."

    except Exception as e:
        print(f"[AI Recommendations] Generation failed: {e}")
        import traceback
        traceback.print_exc()
        return (
            "I'm having trouble generating recommendations right now. "
            "Please try again in a moment."
        )
