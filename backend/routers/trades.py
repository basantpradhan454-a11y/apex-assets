"""
Trades Router — Trade history (buy/sell execution lives in routers/coins.py,
kept atomic with the bonding curve update)
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.models import Trade, User
from routers.auth import get_current_user

router = APIRouter()


@router.get("/history")
async def get_trade_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
):
    """Get the current user's trade history across all coins"""
    result = await db.execute(
        select(Trade)
        .where(Trade.user_id == user.id)
        .order_by(Trade.created_at.desc())
        .limit(limit)
    )
    trades = result.scalars().all()
    return [
        {
            "id": t.id,
            "coin_id": t.coin_id,
            "trade_type": t.trade_type,
            "coin_amount": t.coin_amount,
            "credit_amount": t.credit_amount,
            "price_per_coin": t.price_per_coin,
            "mode": t.mode,
            "counterparty": t.counterparty,
            "created_at": t.created_at.isoformat(),
        }
        for t in trades
    ]
