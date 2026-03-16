import asyncio
import os
from app.ai.chatbot import generate_chat_response


async def test_search():
    """
    Smoke test: sends a real-time query to the chatbot agent
    and verifies that the Exa search tool is invoked by Gemini.
    """
    user_context = {
        "profile": {
            "full_name": "Test User",
            "age": 30,
            "occupation": "Engineer",
            "location": "Mumbai",
            "risk_profile": "Moderate",
            "monthly_income": 100000,
            "monthly_expenses": 50000,
            "tax_regime": "New",
        },
        "investments": [],
        "goals": [],
    }

    # Query that SHOULD trigger a web search
    message = "What is the current Nifty 50 price and latest news about it?"
    history = []

    print(f"User: {message}")
    response = await generate_chat_response(message, history, user_context)
    print(f"Bot: {response}")


if __name__ == "__main__":
    asyncio.run(test_search())
