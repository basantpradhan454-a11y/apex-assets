"""
Wallet Router — Buy credits, check balance, transaction history
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import uuid

from database import get_db
from models.models import User, Transaction
from schemas import BuyCreditsRequest, BuyCreditsResponse
from routers.auth import verify_token

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

@router.get("/balance")
async def get_balance(user: User = Depends(get_current_user)):
    """Get wallet balance"""
    return {
        "virtual_balance": user.virtual_balance,
        "real_wallet_balance": user.real_wallet_balance,
        "is_kyc_verified": user.is_kyc_verified,
    }

@router.post("/buy-credits", response_model=BuyCreditsResponse)
async def buy_credits(
    req: BuyCreditsRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Purchase Apex Credits via payment gateway"""
    if not user.is_kyc_verified:
        raise HTTPException(status_code=403, detail="KYC verification required to purchase credits")

    # 1 INR = 1 Apex Credit (configurable)
    credits = req.amount

    # Create transaction record
    tx = Transaction(
        user_id=user.id,
        amount=req.amount,
        credits_purchased=credits,
        gateway=req.gateway,
        gateway_ref=f"{req.gateway}_{uuid.uuid4().hex[:12]}",
        status="pending",
    )
    db.add(tx)
    await db.commit()
    await db.refresh(tx)

    # In production, create actual Razorpay/PhonePe order here
    # razorpay_client.order.create(amount=int(req.amount * 100), currency="INR")
    
    return BuyCreditsResponse(
        order_id=tx.id,
        amount=req.amount,
        gateway=req.gateway,
        payment_link=f"https://checkout.mock-gateway.com/pay/{tx.gateway_ref}",
    )

@router.post("/payment/webhook")
async def payment_webhook(payload: dict, db: AsyncSession = Depends(get_db)):
    """Webhook for payment gateway callbacks (Razorpay/PhonePe)"""
    # Verify webhook signature in production
    gateway_ref = payload.get("ref_id")
    status = payload.get("status")

    result = await db.execute(
        select(Transaction).where(Transaction.gateway_ref == gateway_ref)
    )
    tx = result.scalar_one_or_none()

    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if status == "success":
        tx.status = "completed"
        # Credit user wallet
        user_result = await db.execute(select(User).where(User.id == tx.user_id))
        user = user_result.scalar_one_or_none()
        if user:
            user.real_wallet_balance += tx.credits_purchased

    await db.commit()
    return {"status": "ok"}

@router.get("/transactions")
async def get_transactions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get transaction history"""
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == user.id)
        .order_by(Transaction.created_at.desc())
        .limit(50)
    )
    txs = result.scalars().all()
    return [
        {
            "id": tx.id,
            "amount": tx.amount,
            "credits": tx.credits_purchased,
            "gateway": tx.gateway,
            "status": tx.status,
            "date": tx.created_at.isoformat(),
        }
        for tx in txs
    ]
