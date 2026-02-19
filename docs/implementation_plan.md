# Implementation Plan: Generative Personal Finance Advisor

This project follows an **Incremental Model**, where each increment adds a functional layer to the application, moving from a static profile to a fully generative AI advisor.

---

## Increment 1: Foundation & Financial Identity (Weeks 1-2)
**Goal:** Establish the core system, database, and user profile management.

### Features:
- **User Authentication:** JWT-based login and registration.
- **Financial Profile:** Input forms for Income, Fixed Expenses, Savings, and Debts.
- **Backend Setup:** Database schema implementation (PostgreSQL) and FastAPI routes for CRUD operations.
- **Frontend Scaffolding:** Dashboard layout using React and Tailwind CSS.

### Key Milestones:
1. Database migrations for Users and Profiles.
2. Auth middleware implementation.
3. Dashboard "At a Glance" UI with static data display.

---

## Increment 2: Smart Expense Tracking & Categorization (Weeks 3-4)
**Goal:** Move from manual input to automated record keeping and basic categorization.

### Features:
- **Transaction Management:** CRUD for daily transactions.
- **AI Categorization:** Integration of a basic ML/Rule-based model to categorize "Starbucks" as "Food" or "Rent" as "Bills".
- **Visual Analytics:** Implementation of Pie/Bar charts (Recharts) for expense distribution.
- **PDF Parsing:** Basic parsing of bank statements to extract transaction lists.

### Key Milestones:
1. Transaction API with filtering by date and category.
2. Integration of a lightweight classification model in `backend/app/ai`.
3. Working CSV/PDF upload utility.

---

## Increment 3: Budgeting Engine & Goal Planning (Weeks 5-6)
**Goal:** Add decision-making intelligence to the application.

### Features:
- **Budget Generator:** AI-suggested 50/30/20 budget based on current profile.
- **Goal Tracker:** UI to set goals (e.g., "Buy a House") and calculate required monthly contributions.
- **Investment Recommendations:** Logic to suggest asset allocation (Stocks, Bonds, Cash) based on risk profile (Conservative, Aggressive).
- **Explanation Layer:** Simple "Why" text for every recommendation.

### Key Milestones:
1. Math engine for retirement and savings calculations.
2. Budget optimization algorithm implementation.
3. Interactive "Goal Progress" charts.

---

## Increment 4: The Generative AI Advisor (Weeks 7-8)
**Goal:** Transform the app into a conversational conversational experience using LLMs.

### Features:
- **Financial Chatbot:** Integration with Gemini/Llama via LangChain.
- **RAG (Retrieval-Augmented Generation):** Feed user profile data and financial rules into the LLM context for personalized advice.
- **Context-Aware Queries:** Support for questions like "Can I afford a 2L hike vacation next month?"
- **Explainable AI:** Dynamic justification for investment shifts.

### Key Milestones:
1. Vector DB setup (FAISS) for financial knowledge base.
2. Chat history persistence in PostgreSQL.
3. LLM prompt engineering for financial accuracy.

---

## Increment 5: Advanced Forecasting & Polish (Week 9+)
**Goal:** Predictive capabilities and production-level refinement.

### Features:
- **Financial Forecasting:** Time-series prediction for Net Worth growth.
- **Risk Assessment:** Portfolio stress-testing and anomaly detection.
- **Notifications:** Smart alerts for overspending or investment rebalancing.
- **Optimization:** UI/UX polish and mobile-responsive refinement.

### Key Milestones:
1. Deployment-ready Docker configuration.
2. Implementation of prediction models (Prophet/ARIMA).
3. Final security audit and performance tuning.
