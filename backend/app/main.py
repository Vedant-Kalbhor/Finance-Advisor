from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import auth, budget, investments, advisory, tax
from .models import budget as budget_model, user as user_model  # Ensures tables are created
from .db.session import create_tables

# Create database tables
create_tables()

app = FastAPI(title="Finance Advisor")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(budget.router, prefix="/budget", tags=["Budget"])
app.include_router(investments.router, prefix="/investments", tags=["Investments"])
app.include_router(advisory.router, prefix="/advisory", tags=["Advisory"])
app.include_router(tax.router, prefix="/tax", tags=["Tax"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Generative Personal Finance Advisor API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
