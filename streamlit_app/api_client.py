"""
Thin client for the Apex Assets FastAPI backend.
If BACKEND_URL isn't reachable (e.g. backend not deployed yet), the app falls
back to a local in-memory bonding curve so the Streamlit UI is always demoable.
"""
import os
import requests

BACKEND_URL = os.getenv("BACKEND_URL", "").rstrip("/")
TIMEOUT = 5


def is_backend_available() -> bool:
    if not BACKEND_URL:
        return False
    try:
        r = requests.get(f"{BACKEND_URL}/", timeout=TIMEOUT)
        return r.status_code == 200
    except requests.RequestException:
        return False


def signup(username, email, password):
    r = requests.post(f"{BACKEND_URL}/auth/signup", json={
        "username": username, "email": email, "password": password
    }, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def login(email, password):
    r = requests.post(f"{BACKEND_URL}/auth/login", json={
        "email": email, "password": password
    }, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def get_me(token):
    r = requests.get(f"{BACKEND_URL}/auth/me", headers=_auth_headers(token), timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def submit_kyc(token, aadhaar, pan, bank_account):
    r = requests.post(f"{BACKEND_URL}/auth/kyc", headers=_auth_headers(token), json={
        "aadhaar": aadhaar, "pan": pan, "bank_account": bank_account
    }, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def list_coins():
    r = requests.get(f"{BACKEND_URL}/coins/", timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def get_coin_history(coin_id, timeframe="1H"):
    r = requests.get(f"{BACKEND_URL}/coins/{coin_id}/history", params={"timeframe": timeframe}, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()["data"]


def launch_coin(token, name, ticker, image_url, description, creator_tag, is_demo=True):
    r = requests.post(f"{BACKEND_URL}/coins/launch", headers=_auth_headers(token), json={
        "name": name, "ticker": ticker, "image_url": image_url,
        "description": description, "creator_tag": creator_tag, "is_demo_asset": is_demo,
    }, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def buy_coin(token, coin_id, credits_to_spend):
    r = requests.post(f"{BACKEND_URL}/coins/{coin_id}/buy", headers=_auth_headers(token), json={
        "credits_to_spend": credits_to_spend
    }, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def sell_coin(token, coin_id, coins_to_sell):
    r = requests.post(f"{BACKEND_URL}/coins/{coin_id}/sell", headers=_auth_headers(token), json={
        "coins_to_sell": coins_to_sell
    }, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def get_trade_history(token):
    r = requests.get(f"{BACKEND_URL}/trades/history", headers=_auth_headers(token), timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def get_balance(token):
    r = requests.get(f"{BACKEND_URL}/wallet/balance", headers=_auth_headers(token), timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()
