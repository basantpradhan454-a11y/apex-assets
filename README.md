# Apex Assets — Digital Collectible Marketplace

A premium "Fintech-meets-Creative" SaaS platform where creators design, mint, and trade digital collectible cards in a closed-loop marketplace.

## 🎨 Design Philosophy

- **Theme:** Matte Black (#0A0A0B) with Brushed Gold (#D4AF37) accents
- **Charts:** Black-and-white candlestick charts (white bullish / black bearish)
- **Effects:** Glass-morphism modals, glow indicators, smooth animations
- **Typography:** Inter (body) + JetBrains Mono (numbers)

## 🏗️ Architecture

```
apex-assets/
├── frontend/          # React + Vite + Tailwind + Framer Motion
│   ├── src/
│   │   ├── components/    # UI components (Cards, Charts, Common)
│   │   ├── pages/         # Dashboard, Marketplace, Studio, Wallet
│   │   ├── context/       # Zustand store
│   │   ├── api/           # API client + mock data
│   │   └── styles/        # Global CSS
│   ├── package.json
│   ├── vercel.json
│   └── tailwind.config.js
│
└── backend/           # FastAPI + PostgreSQL
    ├── main.py             # App entry
    ├── database.py         # Async DB config
    ├── schemas.py          # Pydantic validation
    ├── models/models.py    # SQLAlchemy models
    ├── routers/            # API routes
    │   ├── auth.py         # Signup, Login, KYC
    │   ├── cards.py        # Mint, List, Price History
    │   ├── trades.py       # Buy/Sell with credit deduction
    │   └── wallet.py       # Credits, Payment gateway, Webhooks
    ├── services/payment.py # Razorpay/PhonePe integration
    └── requirements.txt
```

## 🚀 Quick Start

### Frontend
```bash
cd frontend
npm install
cp .env.example .env  # Configure API URL
npm run dev           # http://localhost:3000
```

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Configure DB + payment keys
uvicorn main:app --reload --port 8000
```

### Database
```sql
CREATE DATABASE apex_assets;
CREATE USER apex WITH PASSWORD 'apex';
GRANT ALL PRIVILEGES ON DATABASE apex_assets TO apex;
```

## 📦 Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
npx vercel --prod
```

### Backend → Railway / Render
1. Connect your GitHub repo
2. Set root directory to `backend/`
3. Add environment variables (DATABASE_URL, JWT_SECRET, etc.)
4. Deploy — Railway/Render will detect the Dockerfile

## 🔐 Key Features

| Feature | Status |
|---------|--------|
| User Auth (JWT) | ✅ |
| Demo Mode (Virtual Credits) | ✅ |
| Live Mode (KYC-gated) | ✅ |
| Card Minting | ✅ |
| Candlestick Charts | ✅ |
| Wallet System | ✅ |
| Payment Gateway (Razorpay/PhonePe) | ✅ Mock |
| Multi-tenant Architecture | ✅ Schema Ready |
| Glass-morphism UI | ✅ |
| Card Flip Animations | ✅ |

## ⚖️ Legal

> Apex Assets is a digital collectible marketplace. Assets are virtual and intended for entertainment purposes only, holding no external financial value.

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Lightweight Charts, Zustand
- **Backend:** FastAPI, SQLAlchemy (async), PostgreSQL, JWT, Pydantic
- **Payments:** Razorpay / PhonePe
- **Deploy:** Vercel (Frontend), Railway/Render (Backend)
