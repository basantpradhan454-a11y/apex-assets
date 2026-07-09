"""
Apex Assets — Streamlit Edition
A self-contained digital collectible marketplace with pump.fun-style bonding curve
coin trading. Matte Black + Brushed Gold theme.

Persistence priority:
  1. DATABASE_URL set  -> real Postgres persistence via db.py (this IS the backend)
  2. BACKEND_URL set    -> optional separate FastAPI service (api_client.py)
  3. neither            -> in-memory st.session_state (per-browser-session demo)
"""
import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from datetime import datetime

import bonding_curve as bc
import api_client as api
import db

st.set_page_config(page_title="Apex Assets", page_icon="◆", layout="wide", initial_sidebar_state="expanded")

# ---------------------------------------------------------------------------
# Theme / CSS
# ---------------------------------------------------------------------------
st.markdown("""
<style>
    .stApp { background-color: #0A0A0B; }
    h1, h2, h3 { color: #F5F5F7 !important; }
    .gold-text { color: #D4AF37 !important; font-weight: 700; }
    .apex-card {
        background: #161618; border: 1px solid #2A2A2E; border-radius: 14px;
        padding: 18px; margin-bottom: 12px;
    }
    .apex-card:hover { border-color: rgba(212,175,55,0.4); }
    .ticker-up { color: #22C55E; font-family: monospace; }
    .ticker-down { color: #EF4444; font-family: monospace; }
    .badge-gold {
        display: inline-block; background: rgba(212,175,55,0.15); color: #D4AF37;
        border: 1px solid rgba(212,175,55,0.4); border-radius: 999px; padding: 2px 10px;
        font-size: 11px; font-weight: 600;
    }
    .badge-graduated {
        display: inline-block; background: rgba(212,175,55,0.15); color: #D4AF37;
        border-radius: 999px; padding: 2px 10px; font-size: 11px; font-weight: 600;
    }
    .stButton>button {
        background: linear-gradient(135deg, #D4AF37, #B8942E); color: #0A0A0B;
        font-weight: 700; border: none; border-radius: 8px;
    }
    .stButton>button:hover { opacity: 0.9; }
    div[data-testid="stMetricValue"] { color: #D4AF37; }
    .disclaimer { color: #6B6B70; font-size: 11px; text-align: center; margin-top: 24px; }
</style>
""", unsafe_allow_html=True)

DB_MODE = db.is_enabled()
BACKEND_LIVE = False if DB_MODE else api.is_backend_available()

if DB_MODE:
    db.init_db()
    db.seed_if_empty()

# ---------------------------------------------------------------------------
# Session state init
# ---------------------------------------------------------------------------
if "authed" not in st.session_state:
    st.session_state.authed = False
    st.session_state.username = None
    st.session_state.user_id = None
    st.session_state.token = None
    st.session_state.mode = "demo"
    st.session_state.virtual_balance = 10000.0
    st.session_state.real_wallet_balance = 0.0
    st.session_state.is_kyc_verified = False
    st.session_state.kyc_status = "none"
    st.session_state.coins = bc.default_seed_coins()
    st.session_state.holdings = {}
    st.session_state.trades = []


def sync_user_from_dict(u: dict):
    st.session_state.user_id = u["id"]
    st.session_state.virtual_balance = u["virtual_balance"]
    st.session_state.real_wallet_balance = u["real_wallet_balance"]
    st.session_state.is_kyc_verified = u["is_kyc_verified"]
    st.session_state.kyc_status = u.get("kyc_status", "none")


# ---------------------------------------------------------------------------
# Sidebar — Auth + Nav
# ---------------------------------------------------------------------------
with st.sidebar:
    st.markdown("## ◆ <span class='gold-text'>APEX ASSETS</span>", unsafe_allow_html=True)
    st.caption("Digital Collectible Marketplace")
    if DB_MODE:
        st.caption("🟢 Live — Postgres persistence")
    elif BACKEND_LIVE:
        st.caption("🟢 Connected to backend API")
    else:
        st.caption("🟡 Local demo mode (no DB configured)")
    st.divider()

    if not st.session_state.authed:
        st.markdown("##### Sign in")
        st.caption("Username only — closed-loop virtual credits, no password needed for the demo.")
        name_input = st.text_input("Username", key="name_input")
        if st.button("Enter Apex Assets", use_container_width=True):
            if name_input:
                if DB_MODE:
                    u = db.get_or_create_user(name_input)
                    sync_user_from_dict(u)
                    st.session_state.username = name_input
                    st.session_state.authed = True
                    st.rerun()
                elif BACKEND_LIVE:
                    try:
                        res = api.login(name_input, "demo")
                    except Exception:
                        try:
                            res = api.signup(name_input, f"{name_input}@apexassets.demo", "demo12345")
                        except Exception as e:
                            st.error(f"Couldn't reach backend: {e}")
                            res = None
                    if res:
                        st.session_state.token = res["token"]
                        u = res["user"]
                        st.session_state.username = u["username"]
                        st.session_state.virtual_balance = u["virtual_balance"]
                        st.session_state.real_wallet_balance = u["real_wallet_balance"]
                        st.session_state.is_kyc_verified = u["is_kyc_verified"]
                        st.session_state.authed = True
                        st.rerun()
                else:
                    st.session_state.username = name_input
                    st.session_state.authed = True
                    st.rerun()
            else:
                st.warning("Enter a username")
        st.stop()

    st.success(f"👤 {st.session_state.username}")
    mode = st.radio("Mode", ["demo", "live"], index=0 if st.session_state.mode == "demo" else 1,
                     format_func=lambda m: "Demo" if m == "demo" else "Live", horizontal=True)
    st.session_state.mode = mode
    if mode == "live" and not st.session_state.is_kyc_verified:
        st.warning("Complete KYC in Wallet to unlock Live trading")

    page = st.radio("Navigate", ["Dashboard", "Marketplace", "Coin Launchpad", "Wallet"], label_visibility="collapsed")

    if st.button("Log Out", use_container_width=True):
        for k in list(st.session_state.keys()):
            del st.session_state[k]
        st.rerun()

# ---------------------------------------------------------------------------
# Data loading (db / backend / local)
# ---------------------------------------------------------------------------
def load_coins():
    if DB_MODE:
        try:
            return db.list_coins()
        except Exception as e:
            st.error(f"DB error loading coins: {e}")
            return []
    if BACKEND_LIVE:
        try:
            return api.list_coins()
        except Exception:
            pass
    return st.session_state.coins


coins = load_coins()

if DB_MODE and st.session_state.get("user_id"):
    st.session_state.holdings = db.get_holdings(st.session_state.user_id)


def render_chart(coin, timeframe="1H"):
    if BACKEND_LIVE:
        try:
            raw = api.get_coin_history(coin["id"], timeframe)
            df = pd.DataFrame(raw)
            df["time"] = pd.to_datetime(df["time"], unit="s")
        except Exception:
            data = bc.generate_candle_data(coin, timeframe)
            df = pd.DataFrame(data)
    else:
        data = bc.generate_candle_data(coin, timeframe)
        df = pd.DataFrame(data)

    fig = go.Figure(data=[go.Candlestick(
        x=df["time"], open=df["open"], high=df["high"], low=df["low"], close=df["close"],
        increasing_line_color="#F5F5F7", increasing_fillcolor="#F5F5F7",
        decreasing_line_color="#0A0A0B", decreasing_fillcolor="#0A0A0B",
        line=dict(width=1),
    )])
    fig.update_layout(
        height=340, paper_bgcolor="#0A0A0B", plot_bgcolor="#0A0A0B",
        font=dict(color="#A0A0A8", size=11),
        xaxis=dict(gridcolor="rgba(42,42,46,0.4)", rangeslider=dict(visible=False)),
        yaxis=dict(gridcolor="rgba(42,42,46,0.4)"),
        margin=dict(l=10, r=10, t=10, b=10),
    )
    st.plotly_chart(fig, use_container_width=True)


def coin_card(coin, key_prefix):
    change = ((coin["market_price"] - coin["previous_price"]) / coin["previous_price"] * 100) if coin["previous_price"] > 0 else 0
    is_up = change >= 0
    progress = min(1.0, coin["credits_raised"] / bc.CURVE_GRADUATION_TARGET)
    mcap = coin["market_price"] * coin["total_supply"]

    with st.container(border=True):
        cols = st.columns([1, 3, 2])
        with cols[0]:
            st.image(coin["image_url"], width=70)
        with cols[1]:
            st.markdown(f"**{coin['name']}** &nbsp; <span class='gold-text'>${coin['ticker']}</span>", unsafe_allow_html=True)
            price_str = f"{coin['market_price']:.8f}" if coin["market_price"] < 0.01 else f"{coin['market_price']:.4f}"
            arrow_class = "ticker-up" if is_up else "ticker-down"
            st.markdown(f"<span class='gold-text'>{price_str}</span> &nbsp; "
                        f"<span class='{arrow_class}'>{'+' if is_up else ''}{change:.2f}%</span>", unsafe_allow_html=True)
            if coin["is_graduated"]:
                st.markdown("<span class='badge-graduated'>🎓 Graduated</span>", unsafe_allow_html=True)
            else:
                st.progress(progress, text=f"{progress*100:.0f}% bonded · MCap {mcap:.0f}")
        with cols[2]:
            held = st.session_state.holdings.get(coin["id"], 0)
            st.caption(f"You hold: {held:,.0f} {coin['ticker']}")
            if st.button("View & Trade", key=f"{key_prefix}_open_{coin['id']}", use_container_width=True):
                st.session_state[f"expand_{coin['id']}"] = not st.session_state.get(f"expand_{coin['id']}", False)

        if st.session_state.get(f"expand_{coin['id']}", False):
            st.divider()
            tf = st.select_slider("Timeframe", options=["1m", "5m", "1H", "1D", "1W"], value="1H", key=f"{key_prefix}_tf_{coin['id']}")
            render_chart(coin, tf)

            if coin["is_graduated"]:
                st.info(f"${coin['ticker']} has graduated — trade it on the open Marketplace.")
            else:
                buy_tab, sell_tab = st.tabs(["Buy", "Sell"])
                with buy_tab:
                    buy_key = f"{key_prefix}_buyamt_{coin['id']}"
                    st.session_state.setdefault(buy_key, 10.0)
                    qc = st.columns(4)
                    for i, v in enumerate([10, 50, 100, 500]):
                        if qc[i].button(str(v), key=f"{key_prefix}_qb_{coin['id']}_{v}"):
                            st.session_state[buy_key] = float(v)
                            st.rerun()
                    amt = st.number_input("Credits to spend", min_value=0.0, step=1.0, key=buy_key)
                    if st.button(f"Buy {coin['ticker']}", key=f"{key_prefix}_buybtn_{coin['id']}", use_container_width=True):
                        do_buy(coin, amt)
                with sell_tab:
                    held = st.session_state.holdings.get(coin["id"], 0)
                    sell_key = f"{key_prefix}_sellamt_{coin['id']}"
                    st.session_state.setdefault(sell_key, 0.0)
                    qc = st.columns(4)
                    for i, pct in enumerate([25, 50, 75, 100]):
                        if qc[i].button(f"{pct}%", key=f"{key_prefix}_qs_{coin['id']}_{pct}"):
                            st.session_state[sell_key] = held * pct / 100
                            st.rerun()
                    qty = st.number_input(f"Qty of {coin['ticker']} (you hold {held:,.0f})", min_value=0.0, key=sell_key)
                    if st.button(f"Sell {coin['ticker']}", key=f"{key_prefix}_sellbtn_{coin['id']}", use_container_width=True):
                        do_sell(coin, qty)

            st.caption("Demo Mode: counterparty is an AI Market Maker on the bonding curve, not a real trader."
                       if st.session_state.mode == "demo" else "Live Mode: trading against the bonding curve.")


def do_buy(coin, credits_to_spend):
    if credits_to_spend <= 0:
        st.warning("Enter a valid amount")
        return

    if DB_MODE:
        try:
            res = db.buy_coin(st.session_state.user_id, coin["id"], credits_to_spend, st.session_state.mode)
            sync_user_from_dict(db.refresh_user(st.session_state.user_id))
            msg = f"{coin['ticker']} just graduated to the Marketplace!" if res["graduated"] else f"Bought {res['coin_amount']:,.0f} {coin['ticker']}"
            st.success(msg)
        except ValueError as e:
            st.error(str(e))
        st.rerun()
        return

    if BACKEND_LIVE and st.session_state.token:
        try:
            res = api.buy_coin(st.session_state.token, coin["id"], credits_to_spend)
            st.success(res["message"])
            st.rerun()
        except Exception as e:
            st.error(f"Buy failed: {e}")
        return

    balance = st.session_state.virtual_balance if st.session_state.mode == "demo" else st.session_state.real_wallet_balance
    if balance < credits_to_spend:
        st.error("Insufficient credits")
        return
    coins_out, _ = bc.buy(coin, credits_to_spend)
    if st.session_state.mode == "demo":
        st.session_state.virtual_balance -= credits_to_spend
    else:
        st.session_state.real_wallet_balance -= credits_to_spend
    st.session_state.holdings[coin["id"]] = st.session_state.holdings.get(coin["id"], 0) + coins_out
    st.session_state.trades.insert(0, {
        "coin_name": coin["name"], "ticker": coin["ticker"], "type": "buy",
        "coin_amount": coins_out, "credit_amount": credits_to_spend,
        "mode": st.session_state.mode, "timestamp": datetime.utcnow().isoformat(),
    })
    st.success(f"Bought {coins_out:,.0f} {coin['ticker']}")
    st.rerun()


def do_sell(coin, coins_to_sell):
    if DB_MODE:
        try:
            res = db.sell_coin(st.session_state.user_id, coin["id"], coins_to_sell, st.session_state.mode)
            sync_user_from_dict(db.refresh_user(st.session_state.user_id))
            st.success(f"Sold {res['coin_amount']:,.0f} {coin['ticker']}")
        except ValueError as e:
            st.error(str(e))
        st.rerun()
        return

    held = st.session_state.holdings.get(coin["id"], 0)
    if coins_to_sell <= 0 or coins_to_sell > held:
        st.error(f"You only hold {held:,.0f} {coin['ticker']}")
        return
    if BACKEND_LIVE and st.session_state.token:
        try:
            res = api.sell_coin(st.session_state.token, coin["id"], coins_to_sell)
            st.success(res["message"])
            st.rerun()
        except Exception as e:
            st.error(f"Sell failed: {e}")
        return

    credits_out, _ = bc.sell(coin, coins_to_sell)
    if st.session_state.mode == "demo":
        st.session_state.virtual_balance += credits_out
    else:
        st.session_state.real_wallet_balance += credits_out
    st.session_state.holdings[coin["id"]] -= coins_to_sell
    st.session_state.trades.insert(0, {
        "coin_name": coin["name"], "ticker": coin["ticker"], "type": "sell",
        "coin_amount": coins_to_sell, "credit_amount": credits_out,
        "mode": st.session_state.mode, "timestamp": datetime.utcnow().isoformat(),
    })
    st.success(f"Sold {coins_to_sell:,.0f} {coin['ticker']}")
    st.rerun()


# ---------------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------------
if page == "Dashboard":
    st.markdown(f"# Welcome back, <span class='gold-text'>{st.session_state.username}</span>", unsafe_allow_html=True)
    if st.session_state.mode == "demo":
        st.markdown("<span class='badge-gold'>DEMO MODE</span>", unsafe_allow_html=True)

    balance = st.session_state.virtual_balance if st.session_state.mode == "demo" else st.session_state.real_wallet_balance
    holdings_value = sum(st.session_state.holdings.get(c["id"], 0) * c["market_price"] for c in coins)
    avg_change = sum(((c["market_price"] - c["previous_price"]) / c["previous_price"] * 100) if c["previous_price"] > 0 else 0 for c in coins) / max(len(coins), 1)
    held_count = sum(1 for c in coins if st.session_state.holdings.get(c["id"], 0) > 0)

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Virtual Credits" if st.session_state.mode == "demo" else "Wallet Balance", f"{balance:,.2f}")
    m2.metric("Holdings Value", f"{holdings_value:,.2f}")
    m3.metric("Avg. Market Trend", f"{avg_change:+.2f}%")
    m4.metric("Coins Held", held_count)

    st.markdown("### Live Ticker")
    ticker_line = " &nbsp;|&nbsp; ".join(
        f"${c['ticker']} <span class='gold-text'>{c['market_price']:.4f}</span>"
        for c in coins
    )
    st.markdown(f"<div class='apex-card'>{ticker_line}</div>", unsafe_allow_html=True)

    st.markdown("### Live Coins")
    for c in coins:
        coin_card(c, "dash")

elif page == "Marketplace":
    st.markdown("# <span class='gold-text'>Marketplace</span>", unsafe_allow_html=True)
    st.caption("Discover coins launched by creators, trading live on the bonding curve — pump.fun style.")

    search = st.text_input("Search by name, ticker, or creator")
    sort_by = st.selectbox("Sort by", ["Trending", "Newest", "Market Cap: High", "Bonding %"])

    filtered = [c for c in coins if search.lower() in c["name"].lower() or search.lower() in c["ticker"].lower() or search.lower() in c["creator_tag"].lower()] if search else list(coins)

    if sort_by == "Newest":
        filtered.sort(key=lambda c: c["created_at"], reverse=True)
    elif sort_by == "Market Cap: High":
        filtered.sort(key=lambda c: c["market_price"] * c["total_supply"], reverse=True)
    elif sort_by == "Bonding %":
        filtered.sort(key=lambda c: c["credits_raised"], reverse=True)
    else:
        filtered.sort(key=lambda c: ((c["market_price"] - c["previous_price"]) / c["previous_price"]) if c["previous_price"] > 0 else 0, reverse=True)

    for c in filtered:
        coin_card(c, "mkt")

    if not filtered:
        st.info("No coins found matching your filters.")

elif page == "Coin Launchpad":
    st.markdown("# Coin <span class='gold-text'>Launchpad</span>", unsafe_allow_html=True)
    st.caption("Launch a coin instantly — pump.fun style. It goes live on a bonding curve immediately, no manual pricing.")

    col1, col2 = st.columns(2)
    with col1:
        name = st.text_input("Coin Name", placeholder="e.g. Golden Ape Genesis")
        ticker = st.text_input("Ticker", placeholder="e.g. GAPE").upper()[:8]
        creator_tag = st.text_input("Creator Tag", value=st.session_state.username or "")
        description = st.text_area("Description", placeholder="What's this coin about?")
        image_url = st.text_input("Image URL (optional)", placeholder="https://...")

        start_price = bc.CURVE_INITIAL_CREDIT_RESERVE / bc.CURVE_INITIAL_COIN_RESERVE
        st.markdown(f"""
        <div class='apex-card'>
        <b>Total Supply:</b> 1,000,000,000<br>
        <b>Starting Price:</b> {start_price:.2e}<br>
        <b>Pricing Model:</b> <span class='gold-text'>Constant-product bonding curve</span>
        </div>
        """, unsafe_allow_html=True)

        if st.button("🚀 Launch Coin", use_container_width=True, disabled=not (name and ticker)):
            img = image_url or f"https://picsum.photos/seed/{name.replace(' ', '')}/400/400"
            if DB_MODE:
                try:
                    res = db.launch_coin(name, ticker, img, description, creator_tag, st.session_state.mode == "demo")
                    st.success(f"${res['ticker']} launched — live in Dashboard & Marketplace!")
                except Exception as e:
                    st.error(f"Launch failed: {e}")
            elif BACKEND_LIVE and st.session_state.token:
                try:
                    res = api.launch_coin(st.session_state.token, name, ticker, img, description, creator_tag, st.session_state.mode == "demo")
                    st.success(f"${res['ticker']} launched — live in Dashboard & Marketplace!")
                except Exception as e:
                    st.error(f"Launch failed: {e}")
            else:
                coin = bc.new_coin(name, ticker, img, description, creator_tag, st.session_state.mode == "demo")
                st.session_state.coins.insert(0, coin)
                st.success(f"${coin['ticker']} launched — live in Dashboard & Marketplace!")
            st.rerun()

    with col2:
        st.markdown("##### Live Preview")
        preview_img = image_url or "https://picsum.photos/seed/preview/400/400"
        with st.container(border=True):
            st.image(preview_img, width=140)
            st.markdown(f"**{name or 'Coin Name'}** &nbsp; <span class='gold-text'>${ticker or 'TICKER'}</span>", unsafe_allow_html=True)
            st.caption(description or "Coin description...")
            st.caption(f"Price: {start_price:.2e} · by {creator_tag or 'Unknown'}")

elif page == "Wallet":
    st.markdown("# <span class='gold-text'>Wallet</span>", unsafe_allow_html=True)
    st.caption("Manage your credits, coin trades, and KYC verification.")

    balance = st.session_state.virtual_balance if st.session_state.mode == "demo" else st.session_state.real_wallet_balance
    col1, col2 = st.columns([2, 1])
    with col1:
        st.metric("Virtual Credits Balance" if st.session_state.mode == "demo" else "Apex Credits Balance", f"{balance:,.2f}")
        st.markdown(f"<span class='badge-gold'>{st.session_state.mode.upper()}</span>", unsafe_allow_html=True)

    with col2:
        st.markdown("##### KYC Verification")
        if st.session_state.is_kyc_verified:
            st.success("✅ Verified Trader — Live trading unlocked")
        elif st.session_state.kyc_status == "pending":
            st.warning("⏳ KYC under review (24-48 hrs)")
        else:
            with st.form("kyc_form"):
                aadhaar = st.text_input("Aadhaar Number")
                pan = st.text_input("PAN Number")
                bank = st.text_input("Bank Account Number")
                submitted = st.form_submit_button("Submit for Verification")
                if submitted and aadhaar and pan and bank:
                    if DB_MODE:
                        db.submit_kyc(st.session_state.user_id, aadhaar, pan, bank)
                    elif BACKEND_LIVE and st.session_state.token:
                        try:
                            api.submit_kyc(st.session_state.token, aadhaar, pan, bank)
                        except Exception as e:
                            st.error(f"KYC submit failed: {e}")
                    st.session_state.kyc_status = "pending"
                    st.info("Real Aadhaar/PAN verification needs a licensed KYC vendor (DigiLocker/Signzy) — captured, not yet auto-verified.")
                    st.rerun()

    st.markdown("### Transaction History")
    if DB_MODE:
        trades = db.get_trade_history(st.session_state.user_id)
    elif BACKEND_LIVE and st.session_state.token:
        try:
            trades = api.get_trade_history(st.session_state.token)
        except Exception:
            trades = st.session_state.trades
    else:
        trades = st.session_state.trades

    if trades:
        df = pd.DataFrame(trades)
        st.dataframe(df, use_container_width=True, hide_index=True)
    else:
        st.info("No trades yet — buy or sell a coin to see history here.")

st.markdown("""
<div class='disclaimer'>
Apex Assets is a digital collectible marketplace. Coins are virtual and intended for
entertainment purposes only, holding no external financial value.
</div>
""", unsafe_allow_html=True)
