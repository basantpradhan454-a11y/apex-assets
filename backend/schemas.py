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
    kyc_status: str
    virtual_balance: float
    real_wallet_balance: float
    tenant_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# KYC
class KYCRequest(BaseModel):
    aadhaar: str
    pan: str
    bank_account: str

# Coins
class LaunchCoinRequest(BaseModel):
    name: str
    ticker: str
    image_url: Optional[str] = None
    description: Optional[str] = None
    creator_tag: str
    is_demo_asset: bool = True
    tenant_id: Optional[str] = None

class CoinResponse(BaseModel):
    id: str
    coin_id: str
    ticker: str
    name: str
    image_url: Optional[str]
    description: Optional[str]
    creator_tag: str
    virtual_credit_reserve: float
    virtual_coin_reserve: float
    credits_raised: float
    total_supply: float
    is_graduated: bool
    market_price: float
    previous_price: float
    is_demo_asset: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Trades (bonding curve buy/sell)
class BuyCoinRequest(BaseModel):
    credits_to_spend: float

class SellCoinRequest(BaseModel):
    coins_to_sell: float

class TradeResponse(BaseModel):
    id: str
    status: str
    message: str
    coin_amount: Optional[float] = None
    credit_amount: Optional[float] = None
    price_per_coin: Optional[float] = None

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
