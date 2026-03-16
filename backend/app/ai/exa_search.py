"""
Exa Web Search Tool
===================
Provides real-time web search capability using Exa's neural search engine.
Exa is a search engine designed for LLMs — it understands natural language
queries and returns high-quality, relevant results.

Used as a LangChain tool bound to the chatbot and investment recommendation
agents so the LLM can autonomously search for current market data, news,
prices, and financial information.

Docs: https://docs.exa.ai | https://docs.langchain.com/oss/python/integrations/tools/exa_search
"""

import os
from dotenv import load_dotenv

load_dotenv()

EXA_API_KEY = os.getenv("EXA_API_KEY", "")


def get_exa_search_tool():
    """
    Return a configured ExaSearchResults tool instance for use in LangChain agents.

    Returns None if the EXA_API_KEY is not set, allowing the agent to
    gracefully run without web search capability.
    """
    if not EXA_API_KEY:
        print("[ExaSearch] EXA_API_KEY not configured. Web search tool will be unavailable.")
        return None

    try:
        from langchain_exa import ExaSearchResults

        tool = ExaSearchResults(
            exa_api_key=EXA_API_KEY,
            max_results=3,
        )
        print("[ExaSearch] Exa search tool initialized successfully.")
        return tool

    except Exception as e:
        print(f"[ExaSearch] Failed to initialize Exa search tool: {e}")
        return None
