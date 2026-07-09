"""
Apex Assets — FastAPI Backend
Digital Collectible Marketplace
"""
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base, get_db
from routers import auth, coins, trades, wallet
import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="Apex Assets API",
    description="Digital Collectible Marketplace API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure with your Vercel URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(coins.router, prefix="/coins", tags=["Coins"])
app.include_router(trades.router, prefix="/trades", tags=["Trades"])
app.include_router(wallet.router, prefix="/wallet", tags=["Wallet"])

@app.get("/")
async def root():
    return {
        "name": "Apex Assets API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
