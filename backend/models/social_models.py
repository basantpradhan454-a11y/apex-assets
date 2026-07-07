"""
Social Layer Models — Portfolio Feed / Trader's Journal
NOTE: These tables are schema-ready but the following need real infra before going live:
  - Video/screenshot storage (CDN/object storage — e.g. S3/Cloudinary)
  - AI-based screenshot/trade-statement authenticity verification (vision model API)
  - Live tipping/subscription payments (requires KYC-verified real_wallet_balance + Razorpay/PhonePe)
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from datetime import datetime
from database import Base
import uuid

def gen_uuid():
    return str(uuid.uuid4())


class TradePost(Base):
    """A user's shared trade — video (Reels/Shorts) or screenshot + card/design tag"""
    __tablename__ = "trade_posts"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    card_id = Column(String, ForeignKey("cards.id"), nullable=True)
    design_id = Column(String, nullable=True)  # references a DesignTemplate (gallery)

    media_url = Column(Text, nullable=False)  # video or screenshot URL (needs CDN/object storage)
    media_type = Column(String(10), default="video")  # video, image
    caption = Column(Text, nullable=True)

    change_pct = Column(Float, default=0.0)  # displayed % change at time of post

    # AI Verification — set by a vision-model pipeline once connected (currently pending_setup)
    verification_status = Column(String(20), default="pending_setup")  # pending_setup, pending, verified, rejected
    verification_notes = Column(Text, nullable=True)

    tip_count = Column(Integer, default=0)
    tip_total = Column(Float, default=0.0)
    copy_count = Column(Integer, default=0)  # times "Copy Trade Design" was used

    created_at = Column(DateTime, default=datetime.utcnow)


class Tip(Base):
    """A tip sent to a trader/designer's post — requires KYC + live wallet on both sides"""
    __tablename__ = "tips"

    id = Column(String, primary_key=True, default=gen_uuid)
    post_id = Column(String, ForeignKey("trade_posts.id"), nullable=False)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(String, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)  # in Apex Credits
    status = Column(String(20), default="pending")  # pending, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)


class CreatorSubscription(Base):
    """A recurring subscription to a top trader/designer's content"""
    __tablename__ = "creator_subscriptions"

    id = Column(String, primary_key=True, default=gen_uuid)
    subscriber_id = Column(String, ForeignKey("users.id"), nullable=False)
    creator_id = Column(String, ForeignKey("users.id"), nullable=False)
    monthly_amount = Column(Float, nullable=False)
    status = Column(String(20), default="active")  # active, cancelled, expired
    started_at = Column(DateTime, default=datetime.utcnow)
    renewed_at = Column(DateTime, nullable=True)
