"""
Self-contained persistence layer for the Streamlit app — no separate FastAPI service.
Uses SQLAlchemy (sync) against Postgres when DATABASE_URL is set. If it's not set
(e.g. running locally without a DB), all functions return None and app.py falls
back to in-memory st.session_state so the app is always demoable.
"""
import os
import uuid
from datetime import datetime

from sqlalchemy import (
    create_engine, Column, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

import bonding_curve as bc

DATABASE_URL = os.getenv("DATABASE_URL", "")
# Render/Heroku-style URLs sometimes come as postgres:// — SQLAlchemy needs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

Base = declarative_base()
_engine = None
_Session = None


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_uuid)
    username = Column(String(50), unique=True, nullable=False)
    virtual_balance = Column(Float, default=10000.0)
    real_wallet_balance = Column(Float, default=0.0)
    is_kyc_verified = Column(Boolean, default=False)
    kyc_status = Column(String(20), default="none")
    kyc_aadhaar = Column(String(20), nullable=True)
    kyc_pan = Column(String(20), nullable=True)
    kyc_bank_account = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Coin(Base):
    __tablename__ = "coins"
    id = Column(String, primary_key=True, default=gen_uuid)
    coin_id = Column(String(20), unique=True)
    ticker = Column(String(12), nullable=False)
    name = Column(String(100), nullable=False)
    image_url = Column(Text)
    description = Column(Text, nullable=True)
    creator_tag = Column(String(50))
    virtual_credit_reserve = Column(Float, default=bc.CURVE_INITIAL_CREDIT_RESERVE)
    virtual_coin_reserve = Column(Float, default=bc.CURVE_INITIAL_COIN_RESERVE)
    k = Column(Float, default=bc.CURVE_INITIAL_CREDIT_RESERVE * bc.CURVE_INITIAL_COIN_RESERVE)
    credits_raised = Column(Float, default=0.0)
    total_supply = Column(Float, default=bc.CURVE_TOTAL_SUPPLY)
    is_graduated = Column(Boolean, default=False)
    market_price = Column(Float, default=bc.CURVE_INITIAL_CREDIT_RESERVE / bc.CURVE_INITIAL_COIN_RESERVE)
    previous_price = Column(Float, default=bc.CURVE_INITIAL_CREDIT_RESERVE / bc.CURVE_INITIAL_COIN_RESERVE)
    is_demo_asset = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Holding(Base):
    __tablename__ = "holdings"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    coin_id = Column(String, ForeignKey("coins.id"), nullable=False)
    quantity = Column(Float, default=0.0)


class Trade(Base):
    __tablename__ = "trades"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    coin_id = Column(String, ForeignKey("coins.id"), nullable=False)
    trade_type = Column(String(10), nullable=False)
    coin_amount = Column(Float, nullable=False)
    credit_amount = Column(Float, nullable=False)
    price_per_coin = Column(Float, nullable=False)
    mode = Column(String(10), default="demo")
    counterparty = Column(String(30), default="AI Market Maker")
    created_at = Column(DateTime, default=datetime.utcnow)


def is_enabled() -> bool:
    return bool(DATABASE_URL)


def init_db():
    global _engine, _Session
    if not DATABASE_URL:
        return False
    if _engine is None:
        _engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
        Base.metadata.create_all(_engine)
        _Session = sessionmaker(bind=_engine, expire_on_commit=False, future=True)
    return True


def get_session():
    if _Session is None:
        init_db()
    return _Session()


def coin_to_dict(c: "Coin") -> dict:
    return {
        "id": c.id, "coin_id": c.coin_id, "ticker": c.ticker, "name": c.name,
        "image_url": c.image_url, "description": c.description, "creator_tag": c.creator_tag,
        "created_at": c.created_at.isoformat(),
        "virtual_credit_reserve": c.virtual_credit_reserve, "virtual_coin_reserve": c.virtual_coin_reserve,
        "k": c.k, "credits_raised": c.credits_raised, "total_supply": c.total_supply,
        "is_graduated": c.is_graduated, "market_price": c.market_price, "previous_price": c.previous_price,
        "is_demo_asset": c.is_demo_asset,
    }


def get_or_create_user(username: str) -> dict:
    """Simple username-based identity (no password) — good enough for a closed-loop
    virtual-credit demo; swap for real auth before handling real money."""
    with get_session() as s:
        user = s.query(User).filter_by(username=username).first()
        if not user:
            user = User(username=username)
            s.add(user)
            s.commit()
            s.refresh(user)
        return {
            "id": user.id, "username": user.username,
            "virtual_balance": user.virtual_balance, "real_wallet_balance": user.real_wallet_balance,
            "is_kyc_verified": user.is_kyc_verified, "kyc_status": user.kyc_status,
        }


def submit_kyc(user_id: str, aadhaar: str, pan: str, bank_account: str):
    with get_session() as s:
        user = s.query(User).get(user_id)
        user.kyc_aadhaar = aadhaar
        user.kyc_pan = pan
        user.kyc_bank_account = bank_account
        user.kyc_status = "pending"
        s.commit()


def seed_if_empty():
    with get_session() as s:
        if s.query(Coin).count() > 0:
            return
        for seed in bc.default_seed_coins():
            c = Coin(
                id=seed["id"], coin_id=seed["coin_id"], ticker=seed["ticker"], name=seed["name"],
                image_url=seed["image_url"], description=seed["description"], creator_tag=seed["creator_tag"],
                created_at=datetime.fromisoformat(seed["created_at"]),
                virtual_credit_reserve=seed["virtual_credit_reserve"], virtual_coin_reserve=seed["virtual_coin_reserve"],
                k=seed["k"], credits_raised=seed["credits_raised"], total_supply=seed["total_supply"],
                is_graduated=seed["is_graduated"], market_price=seed["market_price"], previous_price=seed["previous_price"],
                is_demo_asset=seed["is_demo_asset"],
            )
            s.add(c)
        s.commit()


def list_coins() -> list:
    with get_session() as s:
        coins = s.query(Coin).order_by(Coin.created_at.desc()).all()
        return [coin_to_dict(c) for c in coins]


def launch_coin(name, ticker, image_url, description, creator_tag, is_demo=True) -> dict:
    with get_session() as s:
        k = bc.CURVE_INITIAL_CREDIT_RESERVE * bc.CURVE_INITIAL_COIN_RESERVE
        price = bc.CURVE_INITIAL_CREDIT_RESERVE / bc.CURVE_INITIAL_COIN_RESERVE
        c = Coin(
            coin_id="APEX-" + uuid.uuid4().hex[:8].upper(),
            ticker=(ticker or "COIN").upper()[:8], name=name, image_url=image_url,
            description=description, creator_tag=creator_tag or "Anonymous",
            virtual_credit_reserve=bc.CURVE_INITIAL_CREDIT_RESERVE,
            virtual_coin_reserve=bc.CURVE_INITIAL_COIN_RESERVE, k=k,
            credits_raised=0.0, total_supply=bc.CURVE_TOTAL_SUPPLY, is_graduated=False,
            market_price=price, previous_price=price, is_demo_asset=is_demo,
        )
        s.add(c)
        s.commit()
        s.refresh(c)
        return coin_to_dict(c)


def buy_coin(user_id: str, coin_id: str, credits_to_spend: float, mode: str) -> dict:
    with get_session() as s:
        coin = s.query(Coin).get(coin_id)
        user = s.query(User).get(user_id)
        if not coin or not user:
            raise ValueError("Coin or user not found")
        if coin.is_graduated:
            raise ValueError(f"{coin.ticker} has graduated — trade it on the open Marketplace")

        balance = user.virtual_balance if mode == "demo" else user.real_wallet_balance
        if balance < credits_to_spend:
            raise ValueError("Insufficient credits")

        new_credit_reserve = coin.virtual_credit_reserve + credits_to_spend
        new_coin_reserve = coin.k / new_credit_reserve
        coins_out = coin.virtual_coin_reserve - new_coin_reserve
        new_price = new_credit_reserve / new_coin_reserve

        coin.previous_price = coin.market_price
        coin.market_price = new_price
        coin.virtual_credit_reserve = new_credit_reserve
        coin.virtual_coin_reserve = new_coin_reserve
        coin.credits_raised += credits_to_spend
        if coin.credits_raised >= bc.CURVE_GRADUATION_TARGET:
            coin.is_graduated = True

        if mode == "demo":
            user.virtual_balance -= credits_to_spend
        else:
            user.real_wallet_balance -= credits_to_spend

        holding = s.query(Holding).filter_by(user_id=user_id, coin_id=coin_id).first()
        if holding:
            holding.quantity += coins_out
        else:
            s.add(Holding(user_id=user_id, coin_id=coin_id, quantity=coins_out))

        trade = Trade(
            user_id=user_id, coin_id=coin_id, trade_type="buy",
            coin_amount=coins_out, credit_amount=credits_to_spend, price_per_coin=new_price,
            mode=mode, counterparty="AI Market Maker" if mode == "demo" else "Bonding Curve",
        )
        s.add(trade)
        s.commit()
        return {"coin_amount": coins_out, "credit_amount": credits_to_spend, "price_per_coin": new_price,
                "graduated": coin.is_graduated}


def sell_coin(user_id: str, coin_id: str, coins_to_sell: float, mode: str) -> dict:
    with get_session() as s:
        coin = s.query(Coin).get(coin_id)
        user = s.query(User).get(user_id)
        if not coin or not user:
            raise ValueError("Coin or user not found")
        if coin.is_graduated:
            raise ValueError(f"{coin.ticker} has graduated — trade it on the open Marketplace")

        holding = s.query(Holding).filter_by(user_id=user_id, coin_id=coin_id).first()
        held = holding.quantity if holding else 0.0
        if coins_to_sell <= 0 or coins_to_sell > held:
            raise ValueError(f"You only hold {held:,.0f} {coin.ticker}")

        new_coin_reserve = coin.virtual_coin_reserve + coins_to_sell
        new_credit_reserve = coin.k / new_coin_reserve
        credits_out = coin.virtual_credit_reserve - new_credit_reserve
        new_price = new_credit_reserve / new_coin_reserve

        coin.previous_price = coin.market_price
        coin.market_price = new_price
        coin.virtual_credit_reserve = new_credit_reserve
        coin.virtual_coin_reserve = new_coin_reserve
        coin.credits_raised = max(0.0, coin.credits_raised - credits_out)

        if mode == "demo":
            user.virtual_balance += credits_out
        else:
            user.real_wallet_balance += credits_out

        holding.quantity -= coins_to_sell

        trade = Trade(
            user_id=user_id, coin_id=coin_id, trade_type="sell",
            coin_amount=coins_to_sell, credit_amount=credits_out, price_per_coin=new_price,
            mode=mode, counterparty="AI Market Maker" if mode == "demo" else "Bonding Curve",
        )
        s.add(trade)
        s.commit()
        return {"coin_amount": coins_to_sell, "credit_amount": credits_out, "price_per_coin": new_price}


def get_holdings(user_id: str) -> dict:
    with get_session() as s:
        rows = s.query(Holding).filter_by(user_id=user_id).all()
        return {r.coin_id: r.quantity for r in rows}


def get_trade_history(user_id: str, limit: int = 50) -> list:
    with get_session() as s:
        trades = (s.query(Trade, Coin)
                  .join(Coin, Trade.coin_id == Coin.id)
                  .filter(Trade.user_id == user_id)
                  .order_by(Trade.created_at.desc())
                  .limit(limit).all())
        return [{
            "coin_name": coin.name, "ticker": coin.ticker, "type": t.trade_type,
            "coin_amount": t.coin_amount, "credit_amount": t.credit_amount,
            "mode": t.mode, "timestamp": t.created_at.isoformat(),
        } for t, coin in trades]


def refresh_user(user_id: str) -> dict:
    with get_session() as s:
        user = s.query(User).get(user_id)
        return {
            "id": user.id, "username": user.username,
            "virtual_balance": user.virtual_balance, "real_wallet_balance": user.real_wallet_balance,
            "is_kyc_verified": user.is_kyc_verified, "kyc_status": user.kyc_status,
        }
