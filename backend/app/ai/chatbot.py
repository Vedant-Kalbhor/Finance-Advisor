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
  LangGraph create_react_agent  ->  ChatGoogleGenerativeAI (Gemini)   [primary]
                                ->  ChatOllama (llama2:latest)         [fallback]
                                ->  ExaSearchResults (web search tool)

Input:  user message, conversation history, user financial context
Output: AI-generated response string (with source citations)
"""

import os
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.chat_models import ChatOllama
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.prebuilt import create_react_agent

from .exa_search import get_exa_search_tool

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama2:latest")


# ---------------------------------------------------------------------------
# LLM fallback chain
# ---------------------------------------------------------------------------

def _build_llm_chain() -> list:
    """
    Returns an ordered list of LLM instances to try.
    Priority: Gemini models -> Ollama (llama2:latest)
    """
    chain = []

    # 1. Gemini (primary) — try multiple models in case one is quota-exhausted
    if GEMINI_API_KEY:
        for model_name in ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]:
            chain.append(
                ChatGoogleGenerativeAI(
                    model=model_name,
                    google_api_key=GEMINI_API_KEY,
                    temperature=0.7,
                )
            )

    # 2. Ollama local fallback
    try:
        ollama_llm = ChatOllama(
            model=OLLAMA_MODEL,
            base_url=OLLAMA_BASE_URL,
            temperature=0.7,
        )
        chain.append(ollama_llm)
        print(f"[Chatbot] Ollama fallback registered: {OLLAMA_MODEL} @ {OLLAMA_BASE_URL}")
    except Exception as e:
        print(f"[Chatbot] Could not register Ollama fallback: {e}")

    return chain


def _is_quota_error(e: Exception) -> bool:
    """Returns True if the exception is a 429 quota/rate-limit error."""
    msg = str(e).lower()
    return "429" in msg or "resource_exhausted" in msg or "quota" in msg or "rate_limit" in msg


def _get_tools() -> list:
    """Collect all available tools for the agent."""
    tools = []
    exa_tool = get_exa_search_tool()
    if exa_tool:
        tools.append(exa_tool)
    return tools


_llm_chain = _build_llm_chain()
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


async def _try_agent(llm, system_prompt: str, messages: list) -> str:
    """
    Run the ReAct agent with the given LLM.
    Raises on any failure so the caller can try the next LLM in the chain.

    Note: Ollama (llama2) is run without external tools to avoid tool-binding
    errors; Gemini models use the full Exa search tool chain.
    """
    is_ollama = isinstance(llm, ChatOllama)
    tools = [] if is_ollama else _tools

    agent = create_react_agent(
        model=llm,
        tools=tools,
        prompt=system_prompt,
    )
    result = await agent.ainvoke(
        {"messages": messages},
        config={"recursion_limit": AGENT_RECURSION_LIMIT},
    )
    ai_messages = [
        m for m in result["messages"]
        if isinstance(m, AIMessage) and m.content
    ]
    if ai_messages:
        return _extract_text(ai_messages[-1].content)
    raise RuntimeError("Agent returned empty response")


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
                f"  - {inv.get('name', 'Unknown')}: Rs.{inv.get('amount', 0):,.2f} "
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
                f"  - {goal.get('name', 'Unknown')}: Target Rs.{goal.get('target_amount', 0):,.2f}, "
                f"Current Rs.{goal.get('current_amount', 0):,.2f} ({progress}% done), "
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

CORE BEHAVIOR RULES:
1. Simple Language: Always respond in simple, easy-to-understand language. If you must use a financial term (like "P/E ratio", "NAV", "yield"), explain it briefly in parentheses.
2. Personalized Advice: Base your advice on the user's actual financial data shown below.
3. Honest and Encouraging: Be supportive but honest. If something looks risky, say so gently.
4. Concise Responses: Keep responses to 2-4 paragraphs unless the user asks for detailed breakdown.
5. Finance Only: If the user asks something unrelated to finance, politely redirect them.
6. Indian Context: Use Indian Rupee (Rs.) for all currency. Be aware of PPF, NPS, ELSS, FDs, Section 80C, 80D, HRA, Nifty, Sensex.
7. Tool Usage: Use the web search tool for up-to-date market information. Add "India" to search queries.

CITATION RULES:
- Always cite your sources inline as: [Source Name](URL)
- Prefer RBI, SEBI, Moneycontrol, Economic Times, Bloomberg sources.

USER'S FINANCIAL PROFILE:
- Name: {profile.get('full_name', 'User')}
- Age: {profile.get('age', 'Not specified')}
- Occupation: {profile.get('occupation', 'Not specified')}
- Location: {profile.get('location', 'Not specified')}
- Risk Profile: {profile.get('risk_profile', 'Moderate')}

MONTHLY CASHFLOW:
- Monthly Income: Rs.{monthly_income:,.2f}
- Monthly Expenses: Rs.{monthly_expenses:,.2f}
- Monthly Savings: Rs.{savings:,.2f}
- Savings Rate: {savings_rate}%

TAX INFORMATION:
- Tax Regime: {profile.get('tax_regime', 'New')}
- 80C Deductions: Rs.{profile.get('deductions_80c', 0):,.2f}
- 80D Deductions: Rs.{profile.get('deductions_80d', 0):,.2f}
- Other Deductions: Rs.{profile.get('other_deductions', 0):,.2f}

INVESTMENTS (Total: Rs.{total_invested:,.2f}):
{investments_summary}

FINANCIAL GOALS:
{goals_summary}

Remember: You are their trusted financial friend. Be proactive and give current, actionable advice."""

    return system_prompt


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def generate_chat_response(
    message: str,
    history: list,
    user_context: dict,
) -> str:
    """
    Generate a chatbot response using a LangChain ReAct agent.
    Tries each LLM in the fallback chain (Gemini -> Ollama) until one succeeds.

    Args:
        message:      The user's current message.
        history:      Conversation history as [{"role": "user"|"assistant", "content": "..."}].
        user_context: Dict with keys "profile", "investments", "goals".

    Returns:
        AI-generated response string.
    """
    if not _llm_chain:
        return (
            "I'm sorry, the AI service is not configured right now. "
            "Please contact support to enable the chatbot feature."
        )

    system_prompt = _build_system_prompt(user_context)
    messages = _convert_history(history)
    messages.append(HumanMessage(content=message))

    for idx, llm in enumerate(_llm_chain):
        llm_name = getattr(llm, "model", None) or getattr(llm, "model_name", "unknown")
        try:
            print(f"[Chatbot] Trying LLM [{idx+1}/{len(_llm_chain)}]: {llm_name}")
            response = await _try_agent(llm, system_prompt, messages)
            print(f"[Chatbot] Success via: {llm_name}")
            return response
        except Exception as e:
            if _is_quota_error(e):
                print(f"[Chatbot] {llm_name} quota exceeded, trying next fallback...")
            else:
                print(f"[Chatbot] {llm_name} failed: {e}")
            if idx == len(_llm_chain) - 1:
                print("[Chatbot] All LLMs exhausted.")
                import traceback
                traceback.print_exc()

    return (
        "I'm currently experiencing high demand and my AI services are temporarily unavailable. "
        "Please try again in a few minutes. In the meantime, you can explore your dashboard "
        "for your financial data and insights."
    )


async def generate_investment_recommendations(
    risk_level: str,
    investment_type: str,
    user_context: dict,
) -> str:
    """
    Generate AI-powered investment recommendations.
    Tries each LLM in the fallback chain (Gemini -> Ollama) until one succeeds.

    Args:
        risk_level:      e.g. "Conservative", "Moderate", "Aggressive"
        investment_type: e.g. "Mutual Fund", "Stock", "Gold"
        user_context:    Dict with keys "profile", "investments", "goals".

    Returns:
        AI-generated recommendations string.
    """
    if not _llm_chain:
        return (
            "The AI service is not configured. "
            "Please contact support to enable recommendations."
        )

    profile = user_context.get("profile", {})
    investments = user_context.get("investments", [])
    goals = user_context.get("goals", [])

    portfolio_lines = []
    for inv in investments:
        portfolio_lines.append(
            f"  - {inv.get('name', 'Unknown')}: Rs.{inv.get('amount', 0):,.2f} "
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
                f"  - {g.get('name', 'Unknown')}: Target Rs.{g.get('target_amount', 0):,.2f}, "
                f"Priority: {g.get('priority', 'Medium')}, By: {g.get('target_date', 'N/A')}"
            )
        goals_summary = "\n".join(goal_lines)

    system_prompt = f"""You are an expert investment advisor AI.

Recommend 5 specific {investment_type} options for a {risk_level} risk profile.
Suggest specific investment amounts based on their Rs.{monthly_savings:,.2f} monthly savings.
Ensure diversification. Include risk disclaimers. Use Rs. for all currency.

USER PROFILE:
- Name: {profile.get('full_name', 'User')}
- Age: {profile.get('age', 'Not specified')}
- Risk Profile: {profile.get('risk_profile', 'Moderate')}
- Monthly Income: Rs.{monthly_income:,.2f}
- Monthly Savings: Rs.{monthly_savings:,.2f}
- Total Invested: Rs.{total_invested:,.2f}

CURRENT PORTFOLIO:
{portfolio_summary}

FINANCIAL GOALS:
{goals_summary}"""

    user_message = (
        f"Recommend 5 specific {investment_type} options for me with a {risk_level.lower()} risk approach."
    )
    messages = [HumanMessage(content=user_message)]

    for idx, llm in enumerate(_llm_chain):
        llm_name = getattr(llm, "model", None) or getattr(llm, "model_name", "unknown")
        try:
            print(f"[AI Recommendations] Trying LLM [{idx+1}/{len(_llm_chain)}]: {llm_name}")
            response = await _try_agent(llm, system_prompt, messages)
            print(f"[AI Recommendations] Success via: {llm_name}")
            return response
        except Exception as e:
            if _is_quota_error(e):
                print(f"[AI Recommendations] {llm_name} quota exceeded, trying next fallback...")
            else:
                print(f"[AI Recommendations] {llm_name} failed: {e}")
            if idx == len(_llm_chain) - 1:
                print("[AI Recommendations] All LLMs exhausted.")
                import traceback
                traceback.print_exc()

    return (
        "I'm having trouble generating recommendations right now due to high demand. "
        "Please try again in a few minutes."
    )
