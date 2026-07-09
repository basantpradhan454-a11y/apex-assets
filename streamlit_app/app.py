"""
APEX ASSETS — Digital Coin Trading Platform
Professional Fintech UI | Streamlit Edition
Matte Black + Brushed Gold | Pump.fun bonding curve
"""
import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from datetime import datetime

import bonding_curve as bc
import api_client as api
import db

# ─── Page config ────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Apex Assets",
    page_icon="assets/logo.png" if False else None,
    layout="wide",
    initial_sidebar_state="collapsed",
    menu_items={}
)

# ─── Global CSS ─────────────────────────────────────────────────────────────
st.markdown("""
<style>
/* ── Reset & Base ── */
* { box-sizing: border-box; }
html, body, [class*="css"] { font-family: 'Inter', 'Segoe UI', sans-serif; }
.stApp { background: #0A0A0B; color: #E8E8EC; }
section[data-testid="stSidebar"] { display: none !important; }

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #111113; }
::-webkit-scrollbar-thumb { background: #2A2A2E; border-radius: 4px; }

/* ── Hide Streamlit chrome ── */
#MainMenu, footer, header { display: none !important; }
.stDeployButton { display: none !important; }
div[data-testid="stToolbar"] { display: none !important; }

/* ── Top Nav ── */
.apex-topnav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px; height: 56px;
    background: #0D0D0F; border-bottom: 1px solid #1E1E22;
    position: sticky; top: 0; z-index: 999;
}
.apex-logo {
    font-size: 15px; font-weight: 800; letter-spacing: 3px;
    color: #D4AF37; text-transform: uppercase;
}
.apex-logo span { color: #888; font-weight: 400; letter-spacing: 1px; font-size: 11px; margin-left: 10px; }
.apex-nav-links { display: flex; gap: 4px; }
.apex-nav-link {
    padding: 6px 16px; border-radius: 6px; font-size: 13px; font-weight: 500;
    color: #888; cursor: pointer; border: none; background: none;
    text-decoration: none; transition: all 0.15s;
}
.apex-nav-link:hover { color: #E8E8EC; background: #1A1A1E; }
.apex-nav-link.active { color: #D4AF37; background: rgba(212,175,55,0.08); }
.apex-nav-right { display: flex; align-items: center; gap: 12px; }
.apex-badge-demo {
    padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: 700;
    letter-spacing: 1.5px; background: rgba(212,175,55,0.1);
    color: #D4AF37; border: 1px solid rgba(212,175,55,0.25);
}
.apex-badge-live {
    padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: 700;
    letter-spacing: 1.5px; background: rgba(34,197,94,0.08);
    color: #22C55E; border: 1px solid rgba(34,197,94,0.25);
}
.apex-user-tag {
    font-size: 12px; color: #888; padding: 4px 12px;
    background: #161618; border: 1px solid #2A2A2E; border-radius: 6px;
}

/* ── Auth page ── */
.auth-wrapper {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #0A0A0B;
}
.auth-card {
    width: 420px; background: #111113; border: 1px solid #1E1E22;
    border-radius: 12px; padding: 40px 36px;
}
.auth-logo {
    text-align: center; font-size: 22px; font-weight: 800;
    letter-spacing: 4px; color: #D4AF37; margin-bottom: 4px;
}
.auth-sub { text-align: center; color: #555; font-size: 12px; margin-bottom: 32px; letter-spacing: 1px; }
.auth-divider { height: 1px; background: #1E1E22; margin: 20px 0; }
.auth-label { font-size: 11px; color: #888; font-weight: 600; letter-spacing: 1px; margin-bottom: 4px; }
.auth-disclaimer {
    font-size: 10px; color: #444; text-align: center;
    margin-top: 24px; line-height: 1.6;
}

/* ── Stat card ── */
.stat-card {
    background: #111113; border: 1px solid #1E1E22; border-radius: 10px;
    padding: 20px 22px;
}
.stat-label { font-size: 10px; color: #666; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px; }
.stat-value { font-size: 26px; font-weight: 700; color: #E8E8EC; line-height: 1; }
.stat-sub { font-size: 11px; color: #555; margin-top: 4px; }
.stat-up { color: #22C55E; font-size: 12px; font-weight: 600; }
.stat-down { color: #EF4444; font-size: 12px; font-weight: 600; }
.stat-neutral { color: #888; font-size: 12px; }

/* ── Coin row ── */
.coin-row {
    display: flex; align-items: center; gap: 16px;
    background: #111113; border: 1px solid #1E1E22; border-radius: 10px;
    padding: 14px 18px; margin-bottom: 8px; transition: border-color 0.15s;
}
.coin-row:hover { border-color: rgba(212,175,55,0.3); }
.coin-img { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.coin-name { font-size: 14px; font-weight: 600; color: #E8E8EC; }
.coin-ticker { font-size: 11px; color: #D4AF37; font-weight: 700; letter-spacing: 1px; }
.coin-creator { font-size: 10px; color: #555; margin-top: 2px; }
.coin-price { font-size: 14px; font-weight: 700; color: #E8E8EC; text-align: right; }
.price-up { color: #22C55E; font-size: 11px; font-weight: 600; }
.price-down { color: #EF4444; font-size: 11px; font-weight: 600; }
.bonding-bar-bg { background: #1E1E22; border-radius: 3px; height: 4px; margin-top: 6px; }
.bonding-bar-fill { background: linear-gradient(90deg, #D4AF37, #F5C842); height: 4px; border-radius: 3px; }
.graduated-pill {
    display: inline-block; padding: 2px 8px; border-radius: 3px;
    font-size: 9px; font-weight: 700; letter-spacing: 1px;
    background: rgba(212,175,55,0.1); color: #D4AF37; border: 1px solid rgba(212,175,55,0.3);
    text-transform: uppercase;
}

/* ── Chart modal area ── */
.chart-header {
    display: flex; align-items: baseline; gap: 12px;
    padding: 12px 0 8px; border-bottom: 1px solid #1E1E22; margin-bottom: 12px;
}
.chart-title { font-size: 16px; font-weight: 700; color: #E8E8EC; }
.chart-price { font-size: 20px; font-weight: 800; color: #D4AF37; }

/* ── Trade panel ── */
.trade-panel {
    background: #111113; border: 1px solid #1E1E22;
    border-radius: 10px; padding: 20px;
}
.trade-input-row { display: flex; gap: 8px; margin-bottom: 8px; }
.quick-btn {
    flex: 1; padding: 6px 0; border: 1px solid #2A2A2E; border-radius: 6px;
    background: #161618; color: #888; font-size: 12px; font-weight: 600;
    cursor: pointer; text-align: center; transition: all 0.12s;
}
.quick-btn:hover { border-color: #D4AF37; color: #D4AF37; }

/* ── Section header ── */
.section-title {
    font-size: 11px; font-weight: 700; color: #555; letter-spacing: 2px;
    text-transform: uppercase; margin: 24px 0 12px;
}

/* ── Ticker strip ── */
.ticker-strip {
    background: #0D0D0F; border-top: 1px solid #1E1E22; border-bottom: 1px solid #1E1E22;
    padding: 8px 32px; font-size: 12px; color: #666;
    display: flex; gap: 32px; overflow-x: auto; white-space: nowrap;
}
.ticker-item { display: flex; gap: 6px; }
.ticker-sym { color: #D4AF37; font-weight: 700; }
.ticker-px { color: #E8E8EC; }
.ticker-chg-up { color: #22C55E; }
.ticker-chg-dn { color: #EF4444; }

/* ── Table ── */
.stDataFrame { background: #111113 !important; }
thead { background: #0D0D0F !important; }

/* ── Form inputs ── */
.stTextInput input, .stNumberInput input, .stTextArea textarea, .stSelectbox select {
    background: #161618 !important; border: 1px solid #2A2A2E !important;
    color: #E8E8EC !important; border-radius: 6px !important;
}
.stTextInput input:focus, .stNumberInput input:focus {
    border-color: #D4AF37 !important; box-shadow: 0 0 0 2px rgba(212,175,55,0.1) !important;
}
label, .stSelectbox label { color: #888 !important; font-size: 11px !important; font-weight: 600; letter-spacing: 1px; }

/* ── Buttons ── */
.stButton > button {
    background: linear-gradient(135deg, #D4AF37 0%, #B8942E 100%) !important;
    color: #0A0A0B !important; font-weight: 700 !important; font-size: 13px !important;
    border: none !important; border-radius: 6px !important;
    padding: 10px 20px !important; width: 100%; transition: opacity 0.15s;
    letter-spacing: 0.5px;
}
.stButton > button:hover { opacity: 0.88 !important; }
.stButton > button:disabled { opacity: 0.35 !important; }

/* ── Metrics ── */
div[data-testid="stMetricValue"] { color: #D4AF37 !important; font-size: 22px !important; font-weight: 700 !important; }
div[data-testid="stMetricDelta"] { font-size: 11px !important; }
div[data-testid="stMetricLabel"] { font-size: 10px !important; color: #555 !important; letter-spacing: 1.5px !important; text-transform: uppercase; }
div[data-testid="metric-container"] {
    background: #111113; border: 1px solid #1E1E22; border-radius: 10px; padding: 18px !important;
}

/* ── Tabs ── */
button[data-baseweb="tab"] { color: #666 !important; font-size: 12px !important; font-weight: 600 !important; }
button[data-baseweb="tab"][aria-selected="true"] { color: #D4AF37 !important; border-bottom-color: #D4AF37 !important; }

/* ── Progress ── */
.stProgress > div > div { background: linear-gradient(90deg, #D4AF37, #F5C842) !important; }

/* ── Info/Success/Warning ── */
div[data-testid="stAlert"] { border-radius: 8px !important; }

/* ── Separator ── */
hr { border-color: #1E1E22 !important; }

/* ── Hide index col in dataframe ── */
.stDataFrame tbody tr th { display: none; }

/* ── KYC form ── */
.kyc-card {
    background: #111113; border: 1px solid #1E1E22;
    border-radius: 10px; padding: 24px;
}
.kyc-verified { color: #22C55E; font-size: 13px; font-weight: 600; }
.kyc-pending { color: #D4AF37; font-size: 13px; font-weight: 600; }
</style>
""", unsafe_allow_html=True)

# ─── Backend / DB detection ──────────────────────────────────────────────────
DB_MODE = db.is_enabled()
BACKEND_LIVE = False if DB_MODE else api.is_backend_available()

if DB_MODE:
    db.init_db()
    db.seed_if_empty()

# ─── Session state init ──────────────────────────────────────────────────────
def _ss_init():
    defaults = {
        "page": "auth",          # auth | dashboard | markets | launch | portfolio | wallet
        "auth_tab": "login",     # login | signup
        "authed": False,
        "username": None,
        "user_id": None,
        "mode": "demo",
        "virtual_balance": 10000.0,
        "real_wallet_balance": 0.0,
        "is_kyc_verified": False,
        "kyc_status": "none",
        "coins": bc.default_seed_coins(),
        "holdings": {},
        "trades": [],
        "active_coin": None,     # coin dict being viewed in trade panel
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v

_ss_init()

# ─── Helpers ────────────────────────────────────────────────────────────────
def goto(page: str):
    st.session_state.page = page
    st.rerun()

def sync_user(u: dict):
    st.session_state.user_id = u["id"]
    st.session_state.virtual_balance = u["virtual_balance"]
    st.session_state.real_wallet_balance = u["real_wallet_balance"]
    st.session_state.is_kyc_verified = u["is_kyc_verified"]
    st.session_state.kyc_status = u.get("kyc_status", "none")

def load_coins():
    if DB_MODE:
        try: return db.list_coins()
        except: return []
    return st.session_state.coins

def balance():
    return st.session_state.virtual_balance if st.session_state.mode == "demo" else st.session_state.real_wallet_balance

def held(coin_id):
    return st.session_state.holdings.get(coin_id, 0)

def fmt_price(p):
    if p < 0.000001: return f"{p:.2e}"
    if p < 0.01:     return f"{p:.8f}"
    if p < 1:        return f"{p:.6f}"
    return f"{p:.4f}"

def pct_change(coin):
    if coin["previous_price"] > 0:
        return (coin["market_price"] - coin["previous_price"]) / coin["previous_price"] * 100
    return 0.0

# ─── Auth Page ───────────────────────────────────────────────────────────────
def page_auth():
    st.markdown("""
    <div style="min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#0A0A0B;">
        <div style="width:440px;">
    """, unsafe_allow_html=True)

    st.markdown("""
        <div style="text-align:center; margin-bottom:36px;">
            <div style="font-size:26px; font-weight:900; letter-spacing:5px; color:#D4AF37;">APEX ASSETS</div>
            <div style="font-size:11px; color:#555; letter-spacing:2px; margin-top:6px; text-transform:uppercase;">Digital Coin Trading Platform</div>
        </div>
    """, unsafe_allow_html=True)

    tab_login, tab_signup = st.tabs(["SIGN IN", "CREATE ACCOUNT"])

    with tab_login:
        with st.form("login_form", clear_on_submit=False):
            st.markdown('<div class="auth-label">USERNAME</div>', unsafe_allow_html=True)
            li_user = st.text_input("", placeholder="Enter your username", label_visibility="collapsed", key="li_user")
            st.markdown('<div class="auth-label" style="margin-top:12px;">PASSWORD</div>', unsafe_allow_html=True)
            li_pass = st.text_input("", placeholder="Enter your password", type="password", label_visibility="collapsed", key="li_pass")
            st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)
            submitted = st.form_submit_button("SIGN IN", use_container_width=True)
            if submitted:
                if not li_user:
                    st.error("Enter your username.")
                else:
                    if DB_MODE:
                        u = db.get_or_create_user(li_user.strip())
                        sync_user(u)
                        st.session_state.username = li_user.strip()
                        st.session_state.authed = True
                        goto("dashboard")
                    else:
                        st.session_state.username = li_user.strip()
                        st.session_state.authed = True
                        goto("dashboard")

    with tab_signup:
        with st.form("signup_form", clear_on_submit=False):
            st.markdown('<div class="auth-label">FULL NAME</div>', unsafe_allow_html=True)
            su_name = st.text_input("", placeholder="Your full name", label_visibility="collapsed", key="su_name")
            st.markdown('<div class="auth-label" style="margin-top:12px;">USERNAME</div>', unsafe_allow_html=True)
            su_user = st.text_input("", placeholder="Choose a username", label_visibility="collapsed", key="su_user")
            st.markdown('<div class="auth-label" style="margin-top:12px;">EMAIL</div>', unsafe_allow_html=True)
            su_email = st.text_input("", placeholder="Your email address", label_visibility="collapsed", key="su_email")
            st.markdown('<div class="auth-label" style="margin-top:12px;">PASSWORD</div>', unsafe_allow_html=True)
            su_pass = st.text_input("", placeholder="Create a password", type="password", label_visibility="collapsed", key="su_pass")
            st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)
            sub2 = st.form_submit_button("CREATE ACCOUNT", use_container_width=True)
            if sub2:
                if not su_user or not su_name:
                    st.error("Name and username are required.")
                else:
                    if DB_MODE:
                        u = db.get_or_create_user(su_user.strip())
                        sync_user(u)
                        st.session_state.username = su_user.strip()
                        st.session_state.authed = True
                        goto("dashboard")
                    else:
                        st.session_state.username = su_user.strip()
                        st.session_state.authed = True
                        goto("dashboard")

    st.markdown("""
        <div style="text-align:center; font-size:10px; color:#333; margin-top:28px; line-height:1.7;">
        Apex Assets is a digital collectible marketplace.<br>
        Coins are virtual and intended for entertainment purposes only.<br>
        No external financial value is implied or guaranteed.
        </div>
    </div></div>
    """, unsafe_allow_html=True)

# ─── Top Nav ─────────────────────────────────────────────────────────────────
def render_topnav():
    cur = st.session_state.page
    mode_html = f'<span class="apex-badge-demo">DEMO</span>' if st.session_state.mode == "demo" else '<span class="apex-badge-live">LIVE</span>'
    st.markdown(f"""
    <div class="apex-topnav">
        <div class="apex-logo">APEX ASSETS <span>Digital Coin Trading</span></div>
        <div class="apex-nav-links" id="navlinks"></div>
        <div class="apex-nav-right">
            {mode_html}
            <div class="apex-user-tag">{st.session_state.username or ''}</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    nav_items = [
        ("Dashboard", "dashboard"),
        ("Markets",   "markets"),
        ("Launch",    "launch"),
        ("Portfolio", "portfolio"),
        ("Wallet",    "wallet"),
    ]
    cols = st.columns([1]*len(nav_items) + [3, 1])
    for i, (label, key) in enumerate(nav_items):
        with cols[i]:
            active = "active" if cur == key else ""
            style = "color:#D4AF37; background:rgba(212,175,55,0.08);" if active else ""
            if st.button(label, key=f"nav_{key}", use_container_width=True):
                goto(key)
    with cols[-1]:
        if st.button("Sign Out", key="nav_logout", use_container_width=True):
            for k in list(st.session_state.keys()):
                del st.session_state[k]
            st.rerun()

# ─── Ticker strip ────────────────────────────────────────────────────────────
def render_ticker(coins):
    if not coins: return
    items = []
    for c in coins[:8]:
        chg = pct_change(c)
        chg_cls = "ticker-chg-up" if chg >= 0 else "ticker-chg-dn"
        sign = "+" if chg >= 0 else ""
        items.append(
            f'<div class="ticker-item">'
            f'<span class="ticker-sym">{c["ticker"]}</span>'
            f'<span class="ticker-px">{fmt_price(c["market_price"])}</span>'
            f'<span class="{chg_cls}">{sign}{chg:.2f}%</span>'
            f'</div>'
        )
    st.markdown(f'<div class="ticker-strip">{"".join(items)}</div>', unsafe_allow_html=True)

# ─── Chart renderer ──────────────────────────────────────────────────────────
def render_chart(coin, tf="1H"):
    data = bc.generate_candle_data(coin, tf)
    df = pd.DataFrame(data)
    fig = go.Figure(go.Candlestick(
        x=df["time"], open=df["open"], high=df["high"], low=df["low"], close=df["close"],
        increasing=dict(line=dict(color="#F5F5F7", width=1), fillcolor="#F5F5F7"),
        decreasing=dict(line=dict(color="#2A2A2E", width=1), fillcolor="#0D0D0F"),
    ))
    fig.update_layout(
        height=300, paper_bgcolor="#0D0D0F", plot_bgcolor="#0D0D0F",
        font=dict(color="#555", size=10),
        xaxis=dict(gridcolor="#161618", rangeslider=dict(visible=False), showline=False),
        yaxis=dict(gridcolor="#161618", showline=False, tickfont=dict(size=9)),
        margin=dict(l=8, r=8, t=8, b=8),
        hovermode="x unified",
    )
    st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})

# ─── Coin trade panel ────────────────────────────────────────────────────────
def render_trade_panel(coin):
    chg = pct_change(coin)
    chg_str = f"+{chg:.2f}%" if chg >= 0 else f"{chg:.2f}%"
    chg_col = "#22C55E" if chg >= 0 else "#EF4444"
    mcap = coin["market_price"] * coin["total_supply"]
    progress = min(1.0, coin["credits_raised"] / bc.CURVE_GRADUATION_TARGET)
    held_qty = held(coin["id"])

    st.markdown(f"""
    <div style="display:flex; align-items:center; gap:14px; padding:16px 0 12px; border-bottom:1px solid #1E1E22; margin-bottom:16px;">
        <img src="{coin['image_url']}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;">
        <div>
            <div style="font-size:16px;font-weight:700;color:#E8E8EC;">{coin['name']}</div>
            <div style="font-size:11px;color:#D4AF37;font-weight:700;letter-spacing:1px;">{coin['ticker']}</div>
        </div>
        <div style="margin-left:auto; text-align:right;">
            <div style="font-size:22px;font-weight:800;color:#D4AF37;">{fmt_price(coin['market_price'])}</div>
            <div style="font-size:12px;color:{chg_col};font-weight:600;">{chg_str}</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Timeframe selector + Chart
    tf = st.radio("Timeframe", ["1m", "5m", "1H", "1D", "1W"], index=2,
                  horizontal=True, label_visibility="collapsed", key=f"tf_{coin['id']}")
    render_chart(coin, tf)

    # Stats row
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("MARKET CAP", f"{mcap:,.0f}")
    c2.metric("CREDITS RAISED", f"{coin['credits_raised']:,.1f}")
    c3.metric("YOU HOLD", f"{held_qty:,.0f}")
    c4.metric("BONDED", f"{progress*100:.1f}%")

    if coin["is_graduated"]:
        st.success("This coin has graduated — now trading on open market.")
        return

    # Bonding progress
    st.markdown(f"""
    <div style="margin:12px 0;">
        <div style="display:flex;justify-content:space-between;font-size:10px;color:#555;margin-bottom:4px;">
            <span>BONDING CURVE PROGRESS</span><span>{progress*100:.1f}% of {bc.CURVE_GRADUATION_TARGET:.0f} credits target</span>
        </div>
        <div class="bonding-bar-bg"><div class="bonding-bar-fill" style="width:{progress*100:.1f}%"></div></div>
    </div>
    """, unsafe_allow_html=True)

    st.divider()

    # Buy / Sell tabs
    buy_tab, sell_tab = st.tabs(["BUY", "SELL"])

    with buy_tab:
        st.markdown('<div class="section-title">Quick Amount (Credits)</div>', unsafe_allow_html=True)
        qc = st.columns(4)
        buy_key = f"buy_amt_{coin['id']}"
        if buy_key not in st.session_state:
            st.session_state[buy_key] = 10.0
        for i, v in enumerate([10, 50, 100, 500]):
            if qc[i].button(str(v), key=f"qbuy_{coin['id']}_{v}"):
                st.session_state[buy_key] = float(v)
                st.rerun()
        amt = st.number_input("Credits to spend", min_value=0.0, step=1.0,
                              key=buy_key, label_visibility="visible")
        est_coins = 0.0
        if amt > 0:
            nr = coin["k"] / (coin["virtual_credit_reserve"] + amt)
            est_coins = coin["virtual_coin_reserve"] - nr
        st.markdown(f'<div style="font-size:11px;color:#555;margin:6px 0 12px;">Estimated receive: <span style="color:#D4AF37;font-weight:600;">{est_coins:,.0f} {coin["ticker"]}</span></div>', unsafe_allow_html=True)
        if st.button("BUY", key=f"buy_btn_{coin['id']}"):
            do_buy(coin, amt)

    with sell_tab:
        st.markdown('<div class="section-title">Quick Sell</div>', unsafe_allow_html=True)
        qc2 = st.columns(4)
        sell_key = f"sell_amt_{coin['id']}"
        if sell_key not in st.session_state:
            st.session_state[sell_key] = 0.0
        for i, pct in enumerate([25, 50, 75, 100]):
            if qc2[i].button(f"{pct}%", key=f"qsell_{coin['id']}_{pct}"):
                st.session_state[sell_key] = float(held_qty * pct / 100)
                st.rerun()
        qty = st.number_input(f"Qty of {coin['ticker']} (holding: {held_qty:,.0f})",
                              min_value=0.0, key=sell_key)
        est_credits = 0.0
        if qty > 0 and qty <= held_qty:
            nr2 = coin["k"] / (coin["virtual_coin_reserve"] + qty)
            est_credits = coin["virtual_credit_reserve"] - nr2
        st.markdown(f'<div style="font-size:11px;color:#555;margin:6px 0 12px;">Estimated receive: <span style="color:#D4AF37;font-weight:600;">{est_credits:,.2f} credits</span></div>', unsafe_allow_html=True)
        if st.button("SELL", key=f"sell_btn_{coin['id']}"):
            do_sell(coin, qty)

    st.markdown('<div style="font-size:10px;color:#333;margin-top:16px;">Demo Mode: All trades use virtual credits. Counterparty is an AI market maker on the bonding curve.</div>' if st.session_state.mode == "demo" else "", unsafe_allow_html=True)

# ─── Coin list item ──────────────────────────────────────────────────────────
def render_coin_row(coin, key_prefix, coins):
    chg = pct_change(coin)
    chg_cls = "price-up" if chg >= 0 else "price-down"
    sign = "+" if chg >= 0 else ""
    progress = min(100.0, coin["credits_raised"] / bc.CURVE_GRADUATION_TARGET * 100)
    mcap = coin["market_price"] * coin["total_supply"]
    held_qty = held(coin["id"])

    grad_html = '<span class="graduated-pill">GRADUATED</span>' if coin["is_graduated"] else \
        f'<div class="bonding-bar-bg"><div class="bonding-bar-fill" style="width:{progress:.0f}%"></div></div>'

    st.markdown(f"""
    <div class="coin-row">
        <img class="coin-img" src="{coin['image_url']}" onerror="this.style.background='#1E1E22'">
        <div style="flex:1;min-width:0;">
            <div class="coin-name">{coin['name']}</div>
            <div><span class="coin-ticker">{coin['ticker']}</span> &nbsp;
                 <span class="coin-creator">by {coin['creator_tag']}</span></div>
            {grad_html}
        </div>
        <div style="text-align:right;flex-shrink:0;">
            <div class="coin-price">{fmt_price(coin['market_price'])}</div>
            <div class="{chg_cls}">{sign}{chg:.2f}%</div>
            <div style="font-size:10px;color:#444;margin-top:2px;">MCap {mcap:,.0f}</div>
            {f'<div style="font-size:10px;color:#D4AF37;margin-top:2px;">Hold: {held_qty:,.0f}</div>' if held_qty > 0 else ''}
        </div>
    </div>
    """, unsafe_allow_html=True)

    if st.button("Trade", key=f"{key_prefix}_trade_{coin['id']}", use_container_width=False):
        st.session_state.active_coin = coin
        st.rerun()

# ─── Trade actions ───────────────────────────────────────────────────────────
def do_buy(coin, credits_to_spend):
    if credits_to_spend <= 0:
        st.warning("Enter an amount greater than 0.")
        return
    if DB_MODE:
        try:
            res = db.buy_coin(st.session_state.user_id, coin["id"], credits_to_spend, st.session_state.mode)
            sync_user(db.refresh_user(st.session_state.user_id))
            msg = f"{coin['ticker']} graduated to open Marketplace!" if res["graduated"] else f"Collected {res['coin_amount']:,.0f} {coin['ticker']}"
            st.success(msg)
            st.session_state.active_coin = None
        except ValueError as e:
            st.error(str(e))
        st.rerun()
        return
    bal = balance()
    if bal < credits_to_spend:
        st.error("Insufficient credits.")
        return
    coins_out, _ = bc.buy(coin, credits_to_spend)
    if st.session_state.mode == "demo":
        st.session_state.virtual_balance -= credits_to_spend
    else:
        st.session_state.real_wallet_balance -= credits_to_spend
    st.session_state.holdings[coin["id"]] = held(coin["id"]) + coins_out
    st.session_state.trades.insert(0, {"coin_name": coin["name"], "ticker": coin["ticker"],
        "type": "buy", "coin_amount": coins_out, "credit_amount": credits_to_spend,
        "mode": st.session_state.mode, "timestamp": datetime.utcnow().isoformat()})
    st.success(f"Collected {coins_out:,.0f} {coin['ticker']}")
    st.rerun()

def do_sell(coin, coins_to_sell):
    if DB_MODE:
        try:
            res = db.sell_coin(st.session_state.user_id, coin["id"], coins_to_sell, st.session_state.mode)
            sync_user(db.refresh_user(st.session_state.user_id))
            st.success(f"Sold {res['coin_amount']:,.0f} {coin['ticker']} for {res['credit_amount']:.2f} credits")
            st.session_state.active_coin = None
        except ValueError as e:
            st.error(str(e))
        st.rerun()
        return
    held_qty = held(coin["id"])
    if coins_to_sell <= 0 or coins_to_sell > held_qty:
        st.error(f"Invalid quantity. You hold {held_qty:,.0f}.")
        return
    credits_out, _ = bc.sell(coin, coins_to_sell)
    if st.session_state.mode == "demo":
        st.session_state.virtual_balance += credits_out
    else:
        st.session_state.real_wallet_balance += credits_out
    st.session_state.holdings[coin["id"]] -= coins_to_sell
    st.session_state.trades.insert(0, {"coin_name": coin["name"], "ticker": coin["ticker"],
        "type": "sell", "coin_amount": coins_to_sell, "credit_amount": credits_out,
        "mode": st.session_state.mode, "timestamp": datetime.utcnow().isoformat()})
    st.success(f"Sold {coins_to_sell:,.0f} {coin['ticker']}")
    st.rerun()

# ─── Pages ───────────────────────────────────────────────────────────────────

def page_dashboard(coins):
    bal = balance()
    holdings_val = sum(held(c["id"]) * c["market_price"] for c in coins)
    held_count = sum(1 for c in coins if held(c["id"]) > 0)
    avg_chg = sum(pct_change(c) for c in coins) / max(len(coins), 1)

    st.markdown('<div class="section-title">Overview</div>', unsafe_allow_html=True)
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("CREDITS BALANCE", f"{bal:,.2f}")
    c2.metric("PORTFOLIO VALUE", f"{holdings_val:,.2f}")
    c3.metric("COINS HELD", held_count)
    c4.metric("MARKET TREND", f"{avg_chg:+.2f}%")

    st.markdown('<div class="section-title">Top Coins</div>', unsafe_allow_html=True)
    sorted_coins = sorted(coins, key=lambda c: c["credits_raised"], reverse=True)[:5]
    for c in sorted_coins:
        render_coin_row(c, "dash", coins)


def page_markets(coins):
    st.markdown('<div class="section-title">All Coins</div>', unsafe_allow_html=True)

    col_s, col_sort = st.columns([3, 1])
    with col_s:
        search = st.text_input("", placeholder="Search by name, ticker, or creator...",
                               label_visibility="collapsed", key="mkt_search")
    with col_sort:
        sort_by = st.selectbox("", ["Trending", "Newest", "Market Cap", "Bonding %"],
                               label_visibility="collapsed", key="mkt_sort")

    filtered = [c for c in coins if
                search.lower() in c["name"].lower() or
                search.lower() in c["ticker"].lower() or
                search.lower() in c.get("creator_tag","").lower()] if search else list(coins)

    if sort_by == "Newest":
        filtered.sort(key=lambda c: c["created_at"], reverse=True)
    elif sort_by == "Market Cap":
        filtered.sort(key=lambda c: c["market_price"] * c["total_supply"], reverse=True)
    elif sort_by == "Bonding %":
        filtered.sort(key=lambda c: c["credits_raised"], reverse=True)
    else:
        filtered.sort(key=lambda c: abs(pct_change(c)), reverse=True)

    if not filtered:
        st.info("No coins match your search.")
        return
    for c in filtered:
        render_coin_row(c, "mkt", coins)


def page_launch():
    st.markdown('<div class="section-title">Launch a Coin</div>', unsafe_allow_html=True)
    st.markdown("""
    <div style="background:#111113;border:1px solid #1E1E22;border-radius:10px;padding:16px 20px;margin-bottom:20px;font-size:12px;color:#666;line-height:1.8;">
        Coins launch immediately on a <strong style="color:#D4AF37;">constant-product bonding curve</strong>.
        No manual pricing — the market determines value. When 500 credits are raised, the coin graduates to open trading.
    </div>
    """, unsafe_allow_html=True)

    col1, col2 = st.columns([3, 2])
    with col1:
        name = st.text_input("COIN NAME", placeholder="e.g. Golden Ape Genesis", key="l_name")
        ticker_raw = st.text_input("TICKER SYMBOL", placeholder="e.g. GAPE  (max 8 chars)", key="l_ticker")
        ticker = (ticker_raw or "").upper().strip()[:8]
        creator_tag = st.text_input("CREATOR TAG", value=st.session_state.username or "", key="l_creator")
        description = st.text_area("DESCRIPTION", placeholder="What makes this coin unique?", key="l_desc", height=80)
        image_url = st.text_input("IMAGE URL  (optional)", placeholder="https://...", key="l_img")

        start_price = bc.CURVE_INITIAL_CREDIT_RESERVE / bc.CURVE_INITIAL_COIN_RESERVE
        st.markdown(f"""
        <div style="background:#0D0D0F;border:1px solid #1E1E22;border-radius:8px;padding:14px 16px;margin:12px 0;font-size:11px;color:#666;line-height:2;">
            <div>Total Supply &nbsp; <span style="color:#D4AF37;font-weight:700;">1,000,000,000</span></div>
            <div>Starting Price &nbsp; <span style="color:#D4AF37;font-weight:700;">{start_price:.2e}</span></div>
            <div>Graduation Target &nbsp; <span style="color:#D4AF37;font-weight:700;">{bc.CURVE_GRADUATION_TARGET:.0f} credits raised</span></div>
            <div>Pricing Model &nbsp; <span style="color:#D4AF37;font-weight:700;">Constant-product AMM</span></div>
        </div>
        """, unsafe_allow_html=True)

        can_launch = bool(name and ticker)
        if st.button("LAUNCH COIN", disabled=not can_launch, key="launch_btn"):
            img = image_url or f"https://picsum.photos/seed/{name.replace(' ','')[:10]}/400/400"
            if DB_MODE:
                try:
                    res = db.launch_coin(name, ticker, img, description, creator_tag, st.session_state.mode == "demo")
                    st.success(f"{res['ticker']} is now live on the bonding curve.")
                except Exception as e:
                    st.error(f"Launch failed: {e}")
            else:
                coin = bc.new_coin(name, ticker, img, description, creator_tag, st.session_state.mode == "demo")
                st.session_state.coins.insert(0, coin)
                st.success(f"{coin['ticker']} is now live.")
            st.rerun()

    with col2:
        st.markdown('<div class="section-title">Preview</div>', unsafe_allow_html=True)
        preview_img = image_url if image_url else f"https://picsum.photos/seed/preview/400/400"
        st.markdown(f"""
        <div style="background:#111113;border:1px solid #1E1E22;border-radius:10px;padding:20px;text-align:center;">
            <img src="{preview_img}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:12px;">
            <div style="font-size:15px;font-weight:700;color:#E8E8EC;">{name or "Coin Name"}</div>
            <div style="font-size:12px;color:#D4AF37;font-weight:700;letter-spacing:1px;margin-top:2px;">{ticker or "TICKER"}</div>
            <div style="font-size:11px;color:#555;margin-top:6px;">{description or "Description..."}</div>
            <div style="font-size:10px;color:#333;margin-top:8px;">by {creator_tag or "Creator"}</div>
        </div>
        """, unsafe_allow_html=True)


def page_portfolio(coins):
    st.markdown('<div class="section-title">My Holdings</div>', unsafe_allow_html=True)
    my_coins = [c for c in coins if held(c["id"]) > 0]
    if not my_coins:
        st.markdown("""
        <div style="background:#111113;border:1px solid #1E1E22;border-radius:10px;padding:40px;text-align:center;color:#444;font-size:13px;">
            No coins in portfolio yet. Go to Markets to start collecting.
        </div>
        """, unsafe_allow_html=True)
        if st.button("Go to Markets"):
            goto("markets")
        return

    total_val = sum(held(c["id"]) * c["market_price"] for c in my_coins)
    st.metric("Total Portfolio Value", f"{total_val:,.4f} credits")
    st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)

    rows = []
    for c in my_coins:
        qty = held(c["id"])
        val = qty * c["market_price"]
        chg = pct_change(c)
        rows.append({
            "Coin": c["name"], "Ticker": c["ticker"],
            "Holdings": f"{qty:,.0f}", "Price": fmt_price(c["market_price"]),
            "Value (Credits)": f"{val:,.4f}", "Change": f"{chg:+.2f}%",
        })
    df = pd.DataFrame(rows)
    st.dataframe(df, use_container_width=True, hide_index=True)


def page_wallet():
    bal = balance()
    st.markdown('<div class="section-title">Account & Wallet</div>', unsafe_allow_html=True)

    c1, c2, c3 = st.columns(3)
    c1.metric("CREDIT BALANCE", f"{bal:,.2f}")
    c2.metric("ACCOUNT MODE", st.session_state.mode.upper())
    c3.metric("KYC STATUS", st.session_state.kyc_status.upper())

    st.markdown("<div style='height:4px'></div>", unsafe_allow_html=True)

    # Mode toggle
    st.markdown('<div class="section-title">Trading Mode</div>', unsafe_allow_html=True)
    new_mode = st.radio("", ["demo", "live"], index=0 if st.session_state.mode == "demo" else 1,
                        format_func=lambda m: "Demo Mode (Virtual Credits)" if m == "demo" else "Live Mode (Real Credits)",
                        horizontal=True, label_visibility="collapsed")
    if new_mode != st.session_state.mode:
        if new_mode == "live" and not st.session_state.is_kyc_verified:
            st.warning("Complete KYC verification below to activate Live mode.")
        else:
            st.session_state.mode = new_mode
            st.rerun()

    # KYC
    st.markdown('<div class="section-title">KYC Verification</div>', unsafe_allow_html=True)
    with st.container():
        if st.session_state.is_kyc_verified:
            st.markdown('<div class="kyc-verified">Verified Trader — Live trading is enabled.</div>', unsafe_allow_html=True)
        elif st.session_state.kyc_status == "pending":
            st.markdown('<div class="kyc-pending">Verification pending — review takes 24-48 hours.</div>', unsafe_allow_html=True)
        else:
            st.markdown("""
            <div style="font-size:11px;color:#555;margin-bottom:16px;">
            Submit your documents to unlock Live trading with real credits.
            Real Aadhaar/PAN verification requires a licensed KYC vendor (DigiLocker/Signzy) — currently captured for demo.
            </div>
            """, unsafe_allow_html=True)
            with st.form("kyc_form"):
                st.text_input("AADHAAR NUMBER", placeholder="XXXX XXXX XXXX", key="kyc_aadhaar")
                st.text_input("PAN NUMBER", placeholder="ABCDE1234F", key="kyc_pan")
                st.text_input("BANK ACCOUNT NUMBER", placeholder="Account number", key="kyc_bank")
                sub = st.form_submit_button("SUBMIT FOR VERIFICATION", use_container_width=True)
                if sub:
                    if DB_MODE:
                        db.submit_kyc(st.session_state.user_id,
                                      st.session_state.get("kyc_aadhaar",""),
                                      st.session_state.get("kyc_pan",""),
                                      st.session_state.get("kyc_bank",""))
                    st.session_state.kyc_status = "pending"
                    st.rerun()

    # Trade history
    st.markdown('<div class="section-title">Trade History</div>', unsafe_allow_html=True)
    if DB_MODE:
        trades = db.get_trade_history(st.session_state.user_id)
    else:
        trades = st.session_state.trades

    if trades:
        df = pd.DataFrame(trades)
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"]).dt.strftime("%d %b %Y %H:%M")
        st.dataframe(df, use_container_width=True, hide_index=True)
    else:
        st.markdown('<div style="color:#444;font-size:12px;padding:20px 0;">No trades yet.</div>', unsafe_allow_html=True)

# ─── Main router ─────────────────────────────────────────────────────────────
if not st.session_state.authed:
    page_auth()
    st.stop()

# Reload holdings from DB each run
if DB_MODE and st.session_state.get("user_id"):
    st.session_state.holdings = db.get_holdings(st.session_state.user_id)

coins = load_coins()

# Trade panel overlay (if a coin is selected for trading)
if st.session_state.active_coin:
    render_topnav()
    render_ticker(coins)
    st.markdown("<div style='padding:20px 32px;'>", unsafe_allow_html=True)
    if st.button("Back to " + st.session_state.page.title(), key="back_from_trade"):
        st.session_state.active_coin = None
        st.rerun()
    # Refresh coin data from DB if available
    if DB_MODE:
        fresh = [c for c in coins if c["id"] == st.session_state.active_coin["id"]]
        if fresh:
            st.session_state.active_coin = fresh[0]
    render_trade_panel(st.session_state.active_coin)
    st.markdown("</div>", unsafe_allow_html=True)
    st.stop()

render_topnav()
render_ticker(coins)
st.markdown("<div style='padding:20px 32px;'>", unsafe_allow_html=True)

p = st.session_state.page
if p == "dashboard":
    page_dashboard(coins)
elif p == "markets":
    page_markets(coins)
elif p == "launch":
    page_launch()
elif p == "portfolio":
    page_portfolio(coins)
elif p == "wallet":
    page_wallet()
else:
    page_dashboard(coins)

st.markdown("</div>", unsafe_allow_html=True)
st.markdown("""
<div style="text-align:center;font-size:10px;color:#2A2A2E;padding:24px;border-top:1px solid #161618;margin-top:40px;">
APEX ASSETS &nbsp;|&nbsp; Digital Collectible Marketplace &nbsp;|&nbsp;
Coins are virtual and intended for entertainment purposes only. No external financial value.
</div>
""", unsafe_allow_html=True)
