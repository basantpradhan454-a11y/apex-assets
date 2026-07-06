"""
SQLAlchemy Models — Database Schema
Tables: tenants, users, cards, demo_trades, live_trades, transactions
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

def gen_card_id():
    return f"APEX-{uuid.uuid4().hex[:8].upper()}"

class Tenant(Base):
    """Multi-tenant: each brand/creator gets their own space"""
    __tablename__ = "tenants"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(100), nullable=False)
    logo_url = Column(Text)
    theme_config = Column(JSON)  # {primary_color, accent, ...}
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="tenant")
    cards = relationship("Card", back_populates="tenant")


class User(Base):
    """Platform users with role-based access"""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="unverified")  # unverified, demo_user, verified_trader
    is_kyc_verified = Column(Boolean, default=False)
    kyc_document_url = Column(Text, nullable=True)
    virtual_balance = Column(Float, default=10000.0)  # Demo credits
    real_wallet_balance = Column(Float, default=0.0)  # Apex Credits (purchased)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="users")
    cards = relationship("Card", back_populates="creator")


class Card(Base):
    """Digital Collectible Cards"""
    __tablename__ = "cards"

    id = Column(String, primary_key=True, default=gen_uuid)
    card_id = Column(String(20), unique=True, default=gen_card_id)  # APEX-XXXXXXXX
    name = Column(String(100), nullable=False)
    image_url = Column(Text)
    creator_tag = Column(String(50))
    creator_id = Column(String, ForeignKey("users.id"))
    
    # Card attributes
    rarity_score = Column(Integer, default=50)  # 1-100
    trend_index = Column(Float, default=50.0)
    minting_supply = Column(Integer, nullable=False)  # total supply
    minted_count = Column(Integer, default=0)  # minted so far
    
    # Market data
    market_price = Column(Float, default=0.0)
    previous_price = Column(Float, default=0.0)
    
    # Metadata
    meme_metadata = Column(JSON)  # {tags, category, ...}
    is_demo_asset = Column(Boolean, default=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User", back_populates="cards")
    tenant = relationship("Tenant", back_populates="cards")


class DemoTrade(Base):
    """Demo mode trades (virtual credits)"""
    __tablename__ = "demo_trades"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    card_id = Column(String, ForeignKey("cards.id"), nullable=False)
    trade_type = Column(String(10), nullable=False)  # buy, sell
    amount = Column(Float, nullable=False)
    credits_used = Column(Float, nullable=False)
    status = Column(String(20), default="completed")
    created_at = Column(DateTime, default=datetime.utcnow)


class LiveTrade(Base):
    """Live trades (Apex Credits) — immutable record"""
    __tablename__ = "live_trades"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    card_id = Column(String, ForeignKey("cards.id"), nullable=False)
    trade_type = Column(String(10), nullable=False)
    amount = Column(Float, nullable=False)
    credits_used = Column(Float, nullable=False)
    payment_ref = Column(String(100))  # Razorpay/PhonePe reference
    status = Column(String(20), default="pending")
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
