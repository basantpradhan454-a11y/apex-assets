"""
Coins Router — Launch, List, Get, Buy, Sell
Trading uses a pump.fun-style constant-product bonding curve: virtual_credit_reserve * virtual_coin_reserve = k.
All values are in virtual "Apex Credits" — closed-loop, not real crypto/blockchain.
"""
import math
import random
import re
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.models import (
    Coin, Holding, Trade, User,
    CURVE_INITIAL_CREDIT_RESERVE, CURVE_INITIAL_COIN_RESERVE,
    CURVE_TOTAL_SUPPLY, CURVE_GRADUATION_TARGET,
)
from schemas import LaunchCoinRequest, CoinResponse, BuyCoinRequest, SellCoinRequest, TradeResponse
from routers.auth import get_current_user

router = APIRouter()


@router.post("/launch", response_model=CoinResponse)
async def launch_coin(
    req: LaunchCoinRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Instantly launch a new coin onto the bonding curve — no manual supply/price, pump.fun style."""
    ticker = re.sub(r"[^A-Z0-9]", "", req.ticker.upper())[:8] or "COIN"
    k = CURVE_INITIAL_CREDIT_RESERVE * CURVE_INITIAL_COIN_RESERVE

    coin = Coin(
        name=req.name,
        ticker=ticker,
        image_url=req.image_url,
        description=req.description,
        creator_tag=req.creator_tag,
        creator_id=user.id,
        virtual_credit_reserve=CURVE_INITIAL_CREDIT_RESERVE,
        virtual_coin_reserve=CURVE_INITIAL_COIN_RESERVE,
        k=k,
        credits_raised=0.0,
        total_supply=CURVE_TOTAL_SUPPLY,
        is_graduated=False,
        market_price=CURVE_INITIAL_CREDIT_RESERVE / CURVE_INITIAL_COIN_RESERVE,
        previous_price=CURVE_INITIAL_CREDIT_RESERVE / CURVE_INITIAL_COIN_RESERVE,
        is_demo_asset=req.is_demo_asset,
        tenant_id=req.tenant_id,
    )
    db.add(coin)
    await db.commit()
    await db.refresh(coin)
    return CoinResponse.model_validate(coin)


@router.get("/", response_model=list[CoinResponse])
async def list_coins(
    skip: int = 0,
    limit: int = 50,
    demo_only: bool = False,
    graduated_only: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """List all coins in the marketplace"""
    query = select(Coin).offset(skip).limit(limit).order_by(Coin.created_at.desc())
    if demo_only:
        query = query.where(Coin.is_demo_asset == True)
    if graduated_only:
        query = query.where(Coin.is_graduated == True)
    result = await db.execute(query)
    coins = result.scalars().all()
    return [CoinResponse.model_validate(c) for c in coins]


@router.get("/{coin_id}", response_model=CoinResponse)
async def get_coin(coin_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single coin by ID"""
    result = await db.execute(select(Coin).where(Coin.id == coin_id))
    coin = result.scalar_one_or_none()
    if not coin:
        raise HTTPException(status_code=404, detail="Coin not found")
    return CoinResponse.model_validate(coin)


@router.get("/{coin_id}/history")
async def get_price_history(coin_id: str, timeframe: str = "1H", db: AsyncSession = Depends(get_db)):
    """Full bonding-curve price history from launch date to today, for charting"""
    result = await db.execute(select(Coin).where(Coin.id == coin_id))
    coin = result.scalar_one_or_none()
    if not coin:
        raise HTTPException(status_code=404, detail="Coin not found")

    tf_minutes = {"1m": 1, "5m": 5, "1H": 60, "1D": 1440, "1W": 10080}
    interval = tf_minutes.get(timeframe, 60)

    launch = coin.created_at
    now = datetime.utcnow()
    span_minutes = max(interval, (now - launch).total_seconds() / 60)
    count = min(max(int(span_minutes / interval), 20), 500)

    start_price = CURVE_INITIAL_CREDIT_RESERVE / CURVE_INITIAL_COIN_RESERVE
    total_growth = coin.market_price - start_price
    volatility = max(coin.market_price * 0.0001, coin.market_price * 0.03)
    step = (now - launch) / count if count else timedelta(minutes=interval)

    rand = random.Random(hash(coin.id + timeframe))
    data = []
    prev_close = start_price

    for i in range(count):
        t = launch + step * i
        progress = (i / count) ** 1.4 if count else 0
        trend_target = start_price + total_growth * progress
        noise = (rand.random() - 0.45) * volatility
        open_p = prev_close
        close_p = max(start_price * 0.5, trend_target + noise)
        high = max(open_p, close_p) + rand.random() * volatility * 0.5
        low = max(start_price * 0.4, min(open_p, close_p) - rand.random() * volatility * 0.5)
        data.append({
            "time": int(t.timestamp()),
            "open": round(open_p, 8),
            "high": round(high, 8),
            "low": round(low, 8),
            "close": round(close_p, 8),
        })
        prev_close = close_p

    if data:
        data[-1]["close"] = coin.market_price
        data[-1]["high"] = max(data[-1]["high"], coin.market_price)

    return {"coin_id": coin_id, "timeframe": timeframe, "data": data}


@router.post("/{coin_id}/buy", response_model=TradeResponse)
async def buy_coin(
    coin_id: str,
    req: BuyCoinRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Buy coins by spending credits — constant-product bonding curve, AI-driven in Demo mode"""
    result = await db.execute(select(Coin).where(Coin.id == coin_id))
    coin = result.scalar_one_or_none()
    if not coin:
        raise HTTPException(status_code=404, detail="Coin not found")
    if coin.is_graduated:
        raise HTTPException(status_code=400, detail=f"{coin.ticker} has graduated — trade it on the open Marketplace")
    if req.credits_to_spend <= 0:
        raise HTTPException(status_code=400, detail="Enter a valid amount")

    mode = "demo" if coin.is_demo_asset else "live"
    if mode == "live" and not user.is_kyc_verified:
        raise HTTPException(status_code=403, detail="KYC required for live trading")

    balance = user.virtual_balance if mode == "demo" else user.real_wallet_balance
    if balance < req.credits_to_spend:
        raise HTTPException(status_code=400, detail="Insufficient credits")

    new_credit_reserve = coin.virtual_credit_reserve + req.credits_to_spend
    new_coin_reserve = coin.k / new_credit_reserve
    coins_out = coin.virtual_coin_reserve - new_coin_reserve
    new_price = new_credit_reserve / new_coin_reserve
    new_raised = coin.credits_raised + req.credits_to_spend
    graduated = new_raised >= CURVE_GRADUATION_TARGET

    coin.previous_price = coin.market_price
    coin.market_price = new_price
    coin.virtual_credit_reserve = new_credit_reserve
    coin.virtual_coin_reserve = new_coin_reserve
    coin.credits_raised = new_raised
    coin.is_graduated = graduated

    if mode == "demo":
        user.virtual_balance -= req.credits_to_spend
    else:
        user.real_wallet_balance -= req.credits_to_spend

    # Update holding
    holding_result = await db.execute(
        select(Holding).where(Holding.user_id == user.id, Holding.coin_id == coin.id)
    )
    holding = holding_result.scalar_one_or_none()
    if holding:
        holding.quantity += coins_out
    else:
        holding = Holding(user_id=user.id, coin_id=coin.id, quantity=coins_out)
        db.add(holding)

    trade = Trade(
        user_id=user.id,
        coin_id=coin.id,
        trade_type="buy",
        coin_amount=coins_out,
        credit_amount=req.credits_to_spend,
        price_per_coin=new_price,
        mode=mode,
        counterparty="AI Market Maker" if mode == "demo" else "Bonding Curve",
    )
    db.add(trade)
    await db.commit()
    await db.refresh(trade)

    message = f"{coin.ticker} just graduated to the Marketplace!" if graduated else f"Bought {coins_out:,.0f} {coin.ticker}"
    return TradeResponse(
        id=trade.id, status="completed", message=message,
        coin_amount=coins_out, credit_amount=req.credits_to_spend, price_per_coin=new_price,
    )


@router.post("/{coin_id}/sell", response_model=TradeResponse)
async def sell_coin(
    coin_id: str,
    req: SellCoinRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Sell coins back into the bonding curve for credits"""
    result = await db.execute(select(Coin).where(Coin.id == coin_id))
    coin = result.scalar_one_or_none()
    if not coin:
        raise HTTPException(status_code=404, detail="Coin not found")
    if coin.is_graduated:
        raise HTTPException(status_code=400, detail=f"{coin.ticker} has graduated — trade it on the open Marketplace")

    mode = "demo" if coin.is_demo_asset else "live"
    if mode == "live" and not user.is_kyc_verified:
        raise HTTPException(status_code=403, detail="KYC required for live trading")

    holding_result = await db.execute(
        select(Holding).where(Holding.user_id == user.id, Holding.coin_id == coin.id)
    )
    holding = holding_result.scalar_one_or_none()
    held = holding.quantity if holding else 0.0

    if req.coins_to_sell <= 0 or req.coins_to_sell > held:
        raise HTTPException(status_code=400, detail=f"You only hold {held:,.0f} {coin.ticker}")

    new_coin_reserve = coin.virtual_coin_reserve + req.coins_to_sell
    new_credit_reserve = coin.k / new_coin_reserve
    credits_out = coin.virtual_credit_reserve - new_credit_reserve
    new_price = new_credit_reserve / new_coin_reserve
    new_raised = max(0.0, coin.credits_raised - credits_out)

    coin.previous_price = coin.market_price
    coin.market_price = new_price
    coin.virtual_credit_reserve = new_credit_reserve
    coin.virtual_coin_reserve = new_coin_reserve
    coin.credits_raised = new_raised

    if mode == "demo":
        user.virtual_balance += credits_out
    else:
        user.real_wallet_balance += credits_out

    holding.quantity -= req.coins_to_sell

    trade = Trade(
        user_id=user.id,
        coin_id=coin.id,
        trade_type="sell",
        coin_amount=req.coins_to_sell,
        credit_amount=credits_out,
        price_per_coin=new_price,
        mode=mode,
        counterparty="AI Market Maker" if mode == "demo" else "Bonding Curve",
    )
    db.add(trade)
    await db.commit()
    await db.refresh(trade)

    return TradeResponse(
        id=trade.id, status="completed", message=f"Sold {req.coins_to_sell:,.0f} {coin.ticker}",
        coin_amount=req.coins_to_sell, credit_amount=credits_out, price_per_coin=new_price,
    )
