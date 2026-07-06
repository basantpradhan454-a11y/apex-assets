"""
Cards Router — Mint, List, Get
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import random

from database import get_db
from models.models import Card
from schemas import MintCardRequest, CardResponse

router = APIRouter()

@router.post("/mint", response_model=CardResponse)
async def mint_card(req: MintCardRequest, db: AsyncSession = Depends(get_db)):
    """Mint a new digital collectible card"""
    card = Card(
        name=req.name,
        image_url=req.image_url,
        creator_tag=req.creator_tag,
        rarity_score=req.rarity_score,
        trend_index=random.uniform(40, 80),
        minting_supply=req.minting_supply,
        minted_count=0,
        market_price=random.uniform(50, 500),
        previous_price=random.uniform(50, 500),
        is_demo_asset=req.is_demo_asset,
        tenant_id=req.tenant_id,
    )
    db.add(card)
    await db.commit()
    await db.refresh(card)
    return CardResponse.model_validate(card)

@router.get("/", response_model=list[CardResponse])
async def list_cards(
    skip: int = 0,
    limit: int = 50,
    demo_only: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """List all cards in the marketplace"""
    query = select(Card).offset(skip).limit(limit)
    if demo_only:
        query = query.where(Card.is_demo_asset == True)
    result = await db.execute(query)
    cards = result.scalars().all()
    return [CardResponse.model_validate(c) for c in cards]

@router.get("/{card_id}", response_model=CardResponse)
async def get_card(card_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single card by ID"""
    result = await db.execute(select(Card).where(Card.id == card_id))
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return CardResponse.model_validate(card)

@router.get("/history/{card_id}")
async def get_price_history(card_id: str, timeframe: str = "1H"):
    """Get price history for charting"""
    # Generate mock candlestick data
    import math
    from datetime import datetime, timedelta

    tf_minutes = {"1m": 1, "5m": 5, "1H": 60, "1D": 1440, "1W": 10080}
    interval = tf_minutes.get(timeframe, 60)
    count = 60
    now = datetime.utcnow()
    data = []

    for i in range(count):
        time = now - timedelta(minutes=interval * (count - i))
        base = 100 + math.sin(i / 10) * 20
        noise = random.uniform(-5, 5)
        open_p = base + noise
        close_p = base + noise + random.uniform(-3, 3)
        high = max(open_p, close_p) + random.uniform(0, 5)
        low = min(open_p, close_p) - random.uniform(0, 5)
        data.append({
            "time": time.isoformat(),
            "open": round(open_p, 2),
            "high": round(high, 2),
            "low": round(max(0.01, low), 2),
            "close": round(close_p, 2),
        })

    return {"card_id": card_id, "timeframe": timeframe, "data": data}
