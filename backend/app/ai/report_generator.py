import os
import json
import requests
from google.generativeai import GenerativeModel
import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama2:latest"

async def generate_comprehensive_financial_report(user_context: dict, report_type: str = "Overview") -> str:
    """
    Generates a professional financial report using Ollama (Llama2) or Gemini (fallback).
    """
    
    # Extract context into a structured string
    profile = user_context.get("profile", {})
    investments = user_context.get("investments", [])
    goals = user_context.get("goals", [])
    
    context_summary = f"""
    --- USER PROFILE ---
    Full Name: {profile.get('full_name', 'User')}
    Age: {profile.get('age', 'N/A')}
    Income: ₹{profile.get('monthly_income', 0)} / mo
    Expenses: ₹{profile.get('monthly_expenses', 0)} / mo
    Risk Profile: {profile.get('risk_profile', 'Moderate')}
    Region: {profile.get('location', 'India')}
    
    --- ASSETS ---
    Total Assets count: {len(investments)}
    Items: {', '.join([f"{i.get('name')} (₹{i.get('amount')}, {i.get('type')})" for i in investments])}
    
    --- GOALS ---
    Total Goals: {len(goals)}
    Targets: {', '.join([f"{g.get('name')} (Target: ₹{g.get('target_amount')})" for g in goals])}
    """

    prompt = f"""
    You are a Senior Financial Advisor. Write a highly professional, 
    concise but deep '{report_type}' report for this client based on the context below.
    
    CONTEXT:
    {context_summary}
    
    INSTRUCTIONS:
    - Language: Professional, informative, and actionable.
    - Format: Use headers like 'EXECUTIVE SUMMARY', 'ASSET ALLOCATION ANALYSIS', 'STRATEGIC RECOMMENDATIONS', and 'GOAL PATHING'.
    - Use Indian Rupee (₹) for calculations.
    - Tone: Trustworthy and analytical.
    - Do NOT use filler words. 
    - Keep it within 500-600 words.
    
    REPORT TYPE: {report_type}
    """

    # 1. Try Ollama (llama2)
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=30 # local LLMs can be slow
        )
        if response.status_code == 200:
            return response.json().get("response", "")
    except Exception as e:
        print(f"[ReportGen] Ollama error, falling back to Gemini: {e}")

    # 2. Fallback to Gemini
    if not GEMINI_API_KEY:
        return "ERROR: No LLM engine available for high-quality report generation."

    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = GenerativeModel("gemini-2.0-flash") # Fallback
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"[ReportGen] Gemini fallback error: {e}")
        return "ERROR: Could not generate report. Please try again later."
