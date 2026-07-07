import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mockCards as seedCards, mockDesigns as seedDesigns } from '../api/mockData'

export type UserRole = 'unverified' | 'demo_user' | 'verified_trader'
export type Mode = 'demo' | 'live'

export interface KycInfo {
  aadhaar?: string
  pan?: string
  bank_account?: string
  status: 'none' | 'pending' | 'verified'
}

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  is_kyc_verified: boolean
  virtual_balance: number
  real_wallet_balance: number
  tenant_id: string | null
  created_at: string
  kyc?: KycInfo
}

export interface TradeCard {
  id: string
  name: string
  card_id: string
  image_url: string
  creator_tag: string
  rarity_score: number
  trend_index: number
  minting_supply: number
  minted_count: number
  market_price: number
  previous_price: number
  is_demo_asset: boolean
  tenant_id: string | null
  created_at: string // launch date — chart history is generated from this date to today
}

export interface Trade {
  id: string
  card_id: string
  card_name: string
  type: 'buy' | 'sell'
  quantity: number
  price: number
  total: number
  mode: Mode
  counterparty: string // 'AI Market Maker' (demo) or 'Marketplace' (live)
  timestamp: string
}

export interface DesignTemplate {
  id: string
  name: string
  category: 'Luxury' | 'Minimalist' | 'Business' | 'Personal' | 'Trending'
  image_url: string
  prompt: string
  uses: number
}

interface TradeResult {
  success: boolean
  message: string
}

interface StoreState {
  isAuth: boolean
  user: User | null
  token: string | null
  mode: Mode
  cards: TradeCard[]
  trades: Trade[]
  designs: DesignTemplate[]
  remixDesign: DesignTemplate | null
  loading: boolean

  setAuth: (token: string, user: User) => void
  logout: () => void
  setMode: (mode: Mode) => void
  setCards: (cards: TradeCard[]) => void
  addCard: (card: TradeCard) => void
  updateUser: (data: Partial<User>) => void
  setLoading: (loading: boolean) => void
  buyCard: (cardId: string, quantity: number) => TradeResult
  sellCard: (cardId: string, quantity: number) => TradeResult
  setRemixDesign: (design: DesignTemplate | null) => void
  submitKyc: (data: { aadhaar: string; pan: string; bank_account: string }) => void
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      isAuth: false,
      user: null,
      token: null,
      mode: 'demo',
      cards: seedCards,
      trades: [],
      designs: seedDesigns,
      remixDesign: null,
      loading: false,

      setAuth: (token, user) => set({ isAuth: true, token, user }),
      logout: () => set({ isAuth: false, user: null, token: null, mode: 'demo' }),
      setMode: (mode) => set({ mode }),
      setCards: (cards) => set({ cards }),
      addCard: (card) => set((state) => ({ cards: [card, ...state.cards] })),
      updateUser: (data) =>
        set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),
      setLoading: (loading) => set({ loading }),
      setRemixDesign: (design) => set({ remixDesign: design }),

      buyCard: (cardId, quantity) => {
        const state = get()
        const card = state.cards.find((c) => c.id === cardId)
        const user = state.user
        if (!card || !user) return { success: false, message: 'Card or user not found' }

        if (state.mode === 'live' && !user.is_kyc_verified) {
          return { success: false, message: 'Complete KYC to trade in Live mode' }
        }
        if (card.minted_count >= card.minting_supply) {
          return { success: false, message: 'Sold out — no supply left' }
        }

        const total = parseFloat((card.market_price * quantity).toFixed(2))
        const isDemo = state.mode === 'demo'
        const balance = isDemo ? user.virtual_balance : user.real_wallet_balance
        if (balance < total) {
          return { success: false, message: `Insufficient ${isDemo ? 'virtual credits' : 'Apex Credits'}` }
        }

        // AI Market Maker: in Demo mode, the counterparty is always AI — never a real trader.
        // Price impact is algorithmic, simulating a live order book without real counterparties.
        const impact = isDemo ? 1 + (0.005 + Math.random() * 0.015) : 1.002
        const newPrice = parseFloat((card.market_price * impact).toFixed(2))

        const trade: Trade = {
          id: 'trd_' + Math.random().toString(36).slice(2, 10),
          card_id: card.id,
          card_name: card.name,
          type: 'buy',
          quantity,
          price: card.market_price,
          total,
          mode: state.mode,
          counterparty: isDemo ? 'AI Market Maker' : 'Marketplace',
          timestamp: new Date().toISOString(),
        }

        const updatedUser: User = isDemo
          ? { ...user, virtual_balance: parseFloat((user.virtual_balance - total).toFixed(2)) }
          : { ...user, real_wallet_balance: parseFloat((user.real_wallet_balance - total).toFixed(2)) }

        set({
          cards: state.cards.map((c) =>
            c.id === cardId
              ? { ...c, previous_price: c.market_price, market_price: newPrice, minted_count: c.minted_count + quantity }
              : c
          ),
          user: updatedUser,
          trades: [trade, ...state.trades],
        })

        return { success: true, message: `Collected ${quantity}x ${card.name}` }
      },

      sellCard: (cardId, quantity) => {
        const state = get()
        const card = state.cards.find((c) => c.id === cardId)
        const user = state.user
        if (!card || !user) return { success: false, message: 'Card or user not found' }

        if (state.mode === 'live' && !user.is_kyc_verified) {
          return { success: false, message: 'Complete KYC to trade in Live mode' }
        }

        const total = parseFloat((card.market_price * quantity).toFixed(2))
        const isDemo = state.mode === 'demo'

        const impact = isDemo ? 1 - (0.005 + Math.random() * 0.015) : 0.998
        const newPrice = parseFloat(Math.max(0.01, card.market_price * impact).toFixed(2))

        const trade: Trade = {
          id: 'trd_' + Math.random().toString(36).slice(2, 10),
          card_id: card.id,
          card_name: card.name,
          type: 'sell',
          quantity,
          price: card.market_price,
          total,
          mode: state.mode,
          counterparty: isDemo ? 'AI Market Maker' : 'Marketplace',
          timestamp: new Date().toISOString(),
        }

        const updatedUser: User = isDemo
          ? { ...user, virtual_balance: parseFloat((user.virtual_balance + total).toFixed(2)) }
          : { ...user, real_wallet_balance: parseFloat((user.real_wallet_balance + total).toFixed(2)) }

        set({
          cards: state.cards.map((c) =>
            c.id === cardId
              ? { ...c, previous_price: c.market_price, market_price: newPrice, minted_count: Math.max(0, c.minted_count - quantity) }
              : c
          ),
          user: updatedUser,
          trades: [trade, ...state.trades],
        })

        return { success: true, message: `Traded ${quantity}x ${card.name}` }
      },

      submitKyc: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, kyc: { ...data, status: 'pending' } } : null,
        })),
    }),
    { name: 'apex-storage' }
  )
)
