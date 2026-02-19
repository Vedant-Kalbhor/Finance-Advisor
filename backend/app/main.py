from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import auth
from .db.session import create_tables

# Create database tables
create_tables()

app = FastAPI(title="Generative Personal Finance Advisor")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Generative Personal Finance Advisor API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
