"""
Pump.fun-style constant-product bonding curve — mirrors the math used in the
React frontend (context/store.ts) and the FastAPI backend (routers/coins.py).
All values are virtual "Apex Credits" — closed-loop, not real crypto/blockchain.
"""
import math
import random
import uuid
from datetime import datetime, timedelta

CURVE_INITIAL_CREDIT_RESERVE = 30.0
CURVE_INITIAL_COIN_RESERVE = 1_000_000_000.0
CURVE_TOTAL_SUPPLY = 1_000_000_000.0
CURVE_GRADUATION_TARGET = 500.0


def new_coin(name: str, ticker: str, image_url: str, description: str, creator_tag: str, is_demo=True) -> dict:
    k = CURVE_INITIAL_CREDIT_RESERVE * CURVE_INITIAL_COIN_RESERVE
    price = CURVE_INITIAL_CREDIT_RESERVE / CURVE_INITIAL_COIN_RESERVE
    return {
        "id": "coin_" + uuid.uuid4().hex[:10],
        "coin_id": "APEX-" + uuid.uuid4().hex[:8].upper(),
        "name": name,
        "ticker": (ticker or "COIN").upper()[:8],
        "image_url": image_url,
        "description": description,
        "creator_tag": creator_tag or "Anonymous",
        "created_at": datetime.utcnow().isoformat(),
        "virtual_credit_reserve": CURVE_INITIAL_CREDIT_RESERVE,
        "virtual_coin_reserve": CURVE_INITIAL_COIN_RESERVE,
        "k": k,
        "credits_raised": 0.0,
        "total_supply": CURVE_TOTAL_SUPPLY,
        "is_graduated": False,
        "is_demo_asset": is_demo,
        "market_price": price,
        "previous_price": price,
    }


def price_of(coin: dict) -> float:
    return coin["virtual_credit_reserve"] / coin["virtual_coin_reserve"]


def market_cap_of(coin: dict) -> float:
    return price_of(coin) * coin["total_supply"]


def buy(coin: dict, credits_to_spend: float):
    """Returns (coins_out, new_price) and mutates coin in place."""
    new_credit_reserve = coin["virtual_credit_reserve"] + credits_to_spend
    new_coin_reserve = coin["k"] / new_credit_reserve
    coins_out = coin["virtual_coin_reserve"] - new_coin_reserve
    new_price = new_credit_reserve / new_coin_reserve

    coin["previous_price"] = coin["market_price"]
    coin["market_price"] = new_price
    coin["virtual_credit_reserve"] = new_credit_reserve
    coin["virtual_coin_reserve"] = new_coin_reserve
    coin["credits_raised"] += credits_to_spend
    if coin["credits_raised"] >= CURVE_GRADUATION_TARGET:
        coin["is_graduated"] = True

    return coins_out, new_price


def sell(coin: dict, coins_to_sell: float):
    """Returns (credits_out, new_price) and mutates coin in place."""
    new_coin_reserve = coin["virtual_coin_reserve"] + coins_to_sell
    new_credit_reserve = coin["k"] / new_coin_reserve
    credits_out = coin["virtual_credit_reserve"] - new_credit_reserve
    new_price = new_credit_reserve / new_coin_reserve

    coin["previous_price"] = coin["market_price"]
    coin["market_price"] = new_price
    coin["virtual_credit_reserve"] = new_credit_reserve
    coin["virtual_coin_reserve"] = new_coin_reserve
    coin["credits_raised"] = max(0.0, coin["credits_raised"] - credits_out)

    return credits_out, new_price


def seed_coin(name, ticker, image_url, creator_tag, description, created_at_iso, credits_raised) -> dict:
    """Build a demo coin that already had some buys since launch (for a lively seed marketplace)."""
    k = CURVE_INITIAL_CREDIT_RESERVE * CURVE_INITIAL_COIN_RESERVE
    vcr = CURVE_INITIAL_CREDIT_RESERVE + credits_raised
    vwr = k / vcr
    price = vcr / vwr
    return {
        "id": "coin_" + uuid.uuid4().hex[:10],
        "coin_id": "APEX-" + uuid.uuid4().hex[:8].upper(),
        "name": name,
        "ticker": ticker,
        "image_url": image_url,
        "description": description,
        "creator_tag": creator_tag,
        "created_at": created_at_iso,
        "virtual_credit_reserve": vcr,
        "virtual_coin_reserve": vwr,
        "k": k,
        "credits_raised": credits_raised,
        "total_supply": CURVE_TOTAL_SUPPLY,
        "is_graduated": credits_raised >= CURVE_GRADUATION_TARGET,
        "is_demo_asset": True,
        "market_price": price,
        "previous_price": price * random.uniform(0.9, 1.05),
    }


def default_seed_coins():
    return [
        seed_coin("Golden Ape Genesis", "GAPE", "https://picsum.photos/seed/ape1/400/400", "ApexOfficial",
                  "The genesis meme coin of Apex Assets.", "2025-11-02T10:00:00", 410),
        seed_coin("Neon Tiger Wave", "NTIGER", "https://picsum.photos/seed/tiger2/400/400", "PixelKing",
                  "Ride the neon wave.", "2025-12-18T12:00:00", 180),
        seed_coin("Cosmic Rider", "CSMC", "https://picsum.photos/seed/cosmic3/400/400", "NeonArt",
                  "To the moon and back.", "2026-01-20T09:00:00", 495),
        seed_coin("Diamond Pegasus", "DPEG", "https://picsum.photos/seed/pegasus4/400/400", "MythicMint",
                  "Mythical, rare, unstoppable.", "2026-02-22T14:00:00", 60),
        seed_coin("Volt Lynx", "VOLT", "https://picsum.photos/seed/lynx5/400/400", "VoltStudio",
                  "Fast. Electric. Untamed.", "2026-03-25T11:00:00", 22),
        seed_coin("Shadow Bear", "SHDW", "https://picsum.photos/seed/bear6/400/400", "DarkMint",
                  "Lurking in the dark pools.", "2026-04-28T16:00:00", 8),
    ]


def generate_candle_data(coin: dict, timeframe: str = "1H"):
    """Full bonding-curve price history from the coin's launch date to today."""
    tf_minutes = {"1m": 1, "5m": 5, "1H": 60, "1D": 1440, "1W": 10080}
    interval = tf_minutes.get(timeframe, 60)

    launch = datetime.fromisoformat(coin["created_at"])
    now = datetime.utcnow()
    span_minutes = max(interval, (now - launch).total_seconds() / 60)
    count = min(max(int(span_minutes / interval), 20), 500)

    rnd = random.Random(hash(coin["id"] + timeframe) & 0xFFFFFFFF)
    start_price = CURVE_INITIAL_CREDIT_RESERVE / CURVE_INITIAL_COIN_RESERVE
    total_growth = coin["market_price"] - start_price
    volatility = max(coin["market_price"] * 0.0001, coin["market_price"] * 0.03)
    step = (now - launch) / count if count else timedelta(minutes=interval)

    data = []
    prev_close = start_price
    for i in range(count):
        t = launch + step * i
        progress = (i / count) ** 1.4 if count else 0
        trend_target = start_price + total_growth * progress
        noise = (rnd.random() - 0.45) * volatility
        open_p = prev_close
        close_p = max(start_price * 0.5, trend_target + noise)
        high = max(open_p, close_p) + rnd.random() * volatility * 0.5
        low = max(start_price * 0.4, min(open_p, close_p) - rnd.random() * volatility * 0.5)
        data.append({"time": t, "open": open_p, "high": high, "low": low, "close": close_p})
        prev_close = close_p

    if data:
        data[-1]["close"] = coin["market_price"]
        data[-1]["high"] = max(data[-1]["high"], coin["market_price"])

    return data
