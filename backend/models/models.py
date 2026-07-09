"""
SQLAlchemy Models — Database Schema
Tables: tenants, users, coins, trades, transactions
Coin trading uses a pump.fun-style constant-product bonding curve (virtual Apex Credits only).
"""
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Text
)
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import uuid

def gen_uuid():
    return str(uuid.uuid4())

def gen_coin_id():
    return f"APEX-{uuid.uuid4().hex[:8].upper()}"

# ---- Bonding Curve Constants (pump.fun-style, denominated in Apex Credits) ----
CURVE_INITIAL_CREDIT_RESERVE = 30.0
CURVE_INITIAL_COIN_RESERVE = 1_000_000_000.0
CURVE_TOTAL_SUPPLY = 1_000_000_000.0
CURVE_GRADUATION_TARGET = 500.0


class Tenant(Base):
    """Multi-tenant: each brand/creator gets their own space"""
    __tablename__ = "tenants"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(100), nullable=False)
    logo_url = Column(Text)
    theme_config = Column(JSON)  # {primary_color, accent, ...}
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="tenant")
    coins = relationship("Coin", back_populates="tenant")


class User(Base):
    """Platform users with role-based access"""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="unverified")  # unverified, demo_user, verified_trader
    is_kyc_verified = Column(Boolean, default=False)

    # KYC capture (mock — real verification needs a licensed vendor e.g. DigiLocker/Signzy)
    kyc_aadhaar = Column(String(20), nullable=True)
    kyc_pan = Column(String(20), nullable=True)
    kyc_bank_account = Column(String(30), nullable=True)
    kyc_status = Column(String(20), default="none")  # none, pending, verified

    virtual_balance = Column(Float, default=10000.0)  # Demo credits
    real_wallet_balance = Column(Float, default=0.0)  # Apex Credits (purchased)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="users")
    coins = relationship("Coin", back_populates="creator")


class Coin(Base):
    """Meme coins traded on a pump.fun-style constant-product bonding curve"""
    __tablename__ = "coins"

    id = Column(String, primary_key=True, default=gen_uuid)
    coin_id = Column(String(20), unique=True, default=gen_coin_id)  # APEX-XXXXXXXX
    ticker = Column(String(12), nullable=False)
    name = Column(String(100), nullable=False)
    image_url = Column(Text)
    description = Column(Text, nullable=True)
    creator_tag = Column(String(50))
    creator_id = Column(String, ForeignKey("users.id"))

    # Bonding curve state — virtual_credit_reserve * virtual_coin_reserve = k (constant product)
    virtual_credit_reserve = Column(Float, default=CURVE_INITIAL_CREDIT_RESERVE)
    virtual_coin_reserve = Column(Float, default=CURVE_INITIAL_COIN_RESERVE)
    k = Column(Float, default=CURVE_INITIAL_CREDIT_RESERVE * CURVE_INITIAL_COIN_RESERVE)
    credits_raised = Column(Float, default=0.0)
    total_supply = Column(Float, default=CURVE_TOTAL_SUPPLY)
    is_graduated = Column(Boolean, default=False)  # locked from curve trading once graduated

    # Cached display fields (recomputed on every trade)
    market_price = Column(Float, default=CURVE_INITIAL_CREDIT_RESERVE / CURVE_INITIAL_COIN_RESERVE)
    previous_price = Column(Float, default=CURVE_INITIAL_CREDIT_RESERVE / CURVE_INITIAL_COIN_RESERVE)

    is_demo_asset = Column(Boolean, default=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User", back_populates="coins")
    tenant = relationship("Tenant", back_populates="coins")


class Holding(Base):
    """Per-user coin balances (off-chain, virtual)"""
    __tablename__ = "holdings"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    coin_id = Column(String, ForeignKey("coins.id"), nullable=False)
    quantity = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Trade(Base):
    """Unified buy/sell trade log — demo and live both recorded here, distinguished by `mode`"""
    __tablename__ = "trades"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    coin_id = Column(String, ForeignKey("coins.id"), nullable=False)
    trade_type = Column(String(10), nullable=False)  # buy, sell
    coin_amount = Column(Float, nullable=False)
    credit_amount = Column(Float, nullable=False)
    price_per_coin = Column(Float, nullable=False)
    mode = Column(String(10), default="demo")  # demo, live
    counterparty = Column(String(30), default="AI Market Maker")  # AI Market Maker (demo) / Bonding Curve (live)
    status = Column(String(20), default="completed")
    created_at = Column(DateTime, default=datetime.utcnow)


class Transaction(Base):
    """Credit purchase transactions via payment gateway"""
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)  # INR amount
    credits_purchased = Column(Float, nullable=False)
    gateway = Column(String(20))  # razorpay, phonepe
    gateway_ref = Column(String(100))
    status = Column(String(20), default="pending")  # pending, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
