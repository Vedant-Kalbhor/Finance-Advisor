# Generative Personal Finance Advisor

An AI-powered system that analyzes financial data to provide personalized planning, explainable recommendations, and conversational guidance.

## Project Structure

- `backend/`: FastAPI application for the API and business logic.
- `frontend/`: React application for the user interface.
- `ai_models/`: Local AI models and configurations.
- `data/`: Data storage and processing scripts.
- `docs/`: Technical documentation and project plans.

## Tech Stack

- **Frontend:** React, Tailwind CSS, Recharts
- **Backend:** FastAPI,SQLite
- **AI/ML:** Llama/Gemini, LangChain, FAISS
- **Data:** Pandas, NumPy

## Getting Started

### Backend Setup
1. Navigate to `/backend`
2. Create a virtual environment: `python -m venv venv`
3. Install dependencies: `pip install -r requirements.txt`
4. Run the server: `uvicorn app.main:app --reload`

### Frontend Setup
1. Navigate to `/frontend`
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
