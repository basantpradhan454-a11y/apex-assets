"""
Trades Router — Buy/Sell with credit deduction
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.models import Card, User, DemoTrade, LiveTrade
from schemas import TradeRequest, TradeResponse
from routers.auth import verify_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter()
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    user_id = verify_token(credentials.credentials)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/buy", response_model=TradeResponse)
async def buy_card(
    req: TradeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Buy/collect a card using credits"""
    # Get card
    card_result = await db.execute(select(Card).where(Card.id == req.card_id))
    card = card_result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    # Check supply
    if card.minted_count >= card.minting_supply:
        raise HTTPException(status_code=400, detail="Card sold out")

    # Check balance
    price = card.market_price * req.amount
    if card.is_demo_asset:
        if user.virtual_balance < price:
            raise HTTPException(status_code=400, detail="Insufficient virtual credits")
        user.virtual_balance -= price
        trade = DemoTrade(
            user_id=user.id,
            card_id=card.id,
            trade_type="buy",
            amount=req.amount,
            credits_used=price,
        )
    else:
        if not user.is_kyc_verified:
            raise HTTPException(status_code=403, detail="KYC required for live trading")
        if user.real_wallet_balance < price:
            raise HTTPException(status_code=400, detail="Insufficient Apex Credits")
        user.real_wallet_balance -= price
        trade = LiveTrade(
            user_id=user.id,
            card_id=card.id,
            trade_type="buy",
            amount=req.amount,
            credits_used=price,
        )

    card.minted_count += int(req.amount)
    card.previous_price = card.market_price
    card.market_price *= 1.01  # Price impact

    db.add(trade)
    await db.commit()

    return TradeResponse(
        id=trade.id,
        status="completed",
        message=f"Successfully collected {req.amount}x {card.name}"
    )

@router.post("/sell", response_model=TradeResponse)
async def sell_card(
    req: TradeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Sell/trade a card back to the marketplace"""
    card_result = await db.execute(select(Card).where(Card.id == req.card_id))
    card = card_result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    price = card.market_price * req.amount
    if card.is_demo_asset:
        user.virtual_balance += price
        trade = DemoTrade(
            user_id=user.id,
            card_id=card.id,
            trade_type="sell",
            amount=req.amount,
            credits_used=price,
        )
    else:
        if not user.is_kyc_verified:
            raise HTTPException(status_code=403, detail="KYC required for live trading")
        user.real_wallet_balance += price
        trade = LiveTrade(
            user_id=user.id,
            card_id=card.id,
            trade_type="sell",
            amount=req.amount,
            credits_used=price,
        )

    card.minted_count = max(0, card.minted_count - int(req.amount))
    card.previous_price = card.market_price
    card.market_price *= 0.99  # Price impact

    db.add(trade)
    await db.commit()

    return TradeResponse(
        id=trade.id,
        status="completed",
        message=f"Successfully traded {req.amount}x {card.name}"
    )
