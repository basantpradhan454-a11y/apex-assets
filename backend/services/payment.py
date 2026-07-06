"""
Payment Service — Razorpay / PhonePe integration
(In production, use actual SDK clients)
"""
import os
import hashlib
import hmac
import json

# Razorpay credentials (set via environment)
RAZORPAY_KEY = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
PHONEPE_MERCHANT = os.getenv("PHONEPE_MERCHANT_ID", "")
PHONEPE_SALT = os.getenv("PHONEPE_SALT_KEY", "")

class PaymentService:
    """Abstract payment gateway service"""

    async def create_order(self, amount: float, currency: str = "INR") -> dict:
        """Create a payment order"""
        # In production:
        # razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY, RAZORPAY_SECRET))
        # order = razorpay_client.order.create({
        #     "amount": int(amount * 100),
        #     "currency": currency,
        #     "payment_capture": 1
        # })
        # return order
        return {
            "order_id": f"order_{hashlib.sha256(str(amount).encode()).hexdigest()[:16]}",
            "amount": amount,
            "currency": currency,
            "status": "created",
        }

    async def verify_payment(self, payment_id: str, order_id: str, signature: str) -> bool:
        """Verify payment signature"""
        # Razorpay signature verification:
        # generated = hmac.new(
        #     RAZORPAY_SECRET.encode(),
        #     f"{order_id}|{payment_id}".encode(),
        #     hashlib.sha256
        # ).hexdigest()
        # return hmac.compare_digest(generated, signature)
        return True  # Mock for boilerplate

    async def verify_webhook(self, body: bytes, signature: str) -> bool:
        """Verify webhook signature"""
        # expected = hmac.new(
        #     RAZORPAY_SECRET.encode(),
        #     body,
        #     hashlib.sha256
        # ).hexdigest()
        # return hmac.compare_digest(expected, signature)
        return True

payment_service = PaymentService()
