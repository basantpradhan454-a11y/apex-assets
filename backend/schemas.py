"""
Pydantic Schemas — Request/Response validation
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Auth
class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    is_kyc_verified: bool
    virtual_balance: float
    real_wallet_balance: float
    tenant_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# KYC
class KYCRequest(BaseModel):
    document_type: str  # aadhaar, pan, passport
    document_url: str

# Cards
class MintCardRequest(BaseModel):
    name: str
    image_url: Optional[str] = None
    creator_tag: str
    rarity_score: int = 50
    minting_supply: int
    is_demo_asset: bool = True
    tenant_id: Optional[str] = None

class CardResponse(BaseModel):
    id: str
    card_id: str
    name: str
    image_url: Optional[str]
    creator_tag: str
    rarity_score: int
    trend_index: float
    minting_supply: int
    minted_count: int
    market_price: float
    previous_price: float
    is_demo_asset: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Trades
class TradeRequest(BaseModel):
    card_id: str
    trade_type: str  # buy, sell
    amount: float

class TradeResponse(BaseModel):
    id: str
    status: str
    message: str

# Wallet
class BuyCreditsRequest(BaseModel):
    amount: float  # INR
    gateway: str = "razorpay"  # razorpay, phonepe

class BuyCreditsResponse(BaseModel):
    order_id: str
    amount: float
    currency: str = "INR"
    gateway: str
    payment_link: Optional[str] = None

TokenResponse.model_rebuild()
