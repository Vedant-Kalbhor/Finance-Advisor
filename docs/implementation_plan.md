# Revised Implementation Plan: Finance Advisor

This project follows an **Incremental Model**, transitioning from basic data entry to a fully automated AI Financial Advisor with broker integration and tax planning.

---

## Increment 1: Foundation & Financial Identity (COMPLETED)
**Goal:** Establish the core system and modern Light-Theme UI.

### Features:
- **Auth System:** JWT-based secure login/register.
- **Financial Profile:** Base Income, Expenses, and Risk Appetite setup.
- **Database:** SQLite implementation for zero-config local storage.
- **UI Scaffold:** Green + White + Black minimalist premium design.

---

## Increment 2: Investment Portfolio & Broker Integration
**Goal:** Centralize all user investments and automate portfolio tracking.

### Features:
- **Broker Integration (Zerodha):** Implement Kite Connect API to fetch holdings, positions, and profit/loss in real-time.
- **Manual Investment Manager:** CRUD interface for SIPs, Mutual Funds, and Fixed Deposits not captured by the broker.
- **Combined Portfolio View:** Unified dashboard showing total Net Worth (Broker + Manual).
- **Asset Allocation Tracking:** Visual breakdown (Stocks, Gold, Mutual Funds, Cash).

### Key Milestones:
1. Kite Connect authentication flow.
2. SIP scheduling and automated contribution tracking.
3. Portfolio synchronization background tasks.

---

## Increment 3: Strategic Advisory & Tax Management
**Goal:** Provide actionable financial strategies and tax optimization.

### Features:
- **Target-Based Suggestions:** Algorithm to suggest specific investment amounts based on ambitious targets (e.g., "Retire at 45") and current income.
- **Tax-Related Section:** 
  - Automated detection of 80C, 80D deductions.
  - Tax liability estimator based on income slabs.
  - Tax-saving investment suggestions (ELSS, PPF).
- **Expense Intelligence:** Automated classification of spending with PDF/CSV bank statement parsing.

### Key Milestones:
1. Indian Income Tax slab engine.
2. Goal-to-SIP math calculator.
3. Bank statement parser for categorization.

---

## Increment 4: Intelligence & Web Insights
**Goal:** Keep users informed with live market sentiment and news.

### Features:
- **Financial Insights Scraping:** Automated scrapers (BeautifulSoup/Selenium) to fetch latest news from MoneyControl, Economic Times, or Yahoo Finance.
- **Sentiment Analysis:** AI-based tagging of news (Positive/Negative/Neutral for specific sectors).
- **Market Alerts:** Daily summary of "Top 3 Things to Watch Today."

### Key Milestones:
1. Scheduled scraping jobs with Celery/APScheduler.
2. NLP sentiment tagging for scraped headlines.

---

## Increment 5: The AI Financial Advisor (GenAI)
**Goal:** Natural language interface for custom financial consultation.

### Features:
- **GenAI Chatbot:** LLM-powered assistant (Gemini/Llama) that knows the user's specific data.
- **RAG Capability:** Answering questions like "How much tax will I save if I start a 5k SIP?" using the user's fetched portfolio and profile.
- **Explainable Advice:** Justification for every investment recommendation.

### Key Milestones:
1. Vector DB setup for tax laws and financial knowledge.
2. LLM integration with user-data context injection.

---

## Increment 6: Advanced Forecasting & Scale
**Goal:** Long-term net worth prediction and production readiness.

### Features:
- **Wealth Forecasting:** Monte Carlo simulations and time-series growth predictions.
- **Smart Push Notifications:** Alerts for unusual spending patterns or windfall investment opportunities.
- **Multi-Device Sync:** Optimization for mobile responsiveness.

### Key Milestones:
1. Predictive modeling for portfolio growth.
2. Final security hardening and deployment config.
