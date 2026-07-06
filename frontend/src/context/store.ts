import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'unverified' | 'demo_user' | 'verified_trader'
export type Mode = 'demo' | 'live'

interface User {
  id: string
  username: string
  email: string
  role: UserRole
  is_kyc_verified: boolean
  virtual_balance: number
  real_wallet_balance: number
  tenant_id: string | null
  created_at: string
}

interface TradeCard {
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
  created_at: string
}

interface StoreState {
  // Auth
  isAuth: boolean
  user: User | null
  token: string | null
  mode: Mode

  // Data
  cards: TradeCard[]
  loading: boolean

  // Actions
  setAuth: (token: string, user: User) => void
  logout: () => void
  setMode: (mode: Mode) => void
  setCards: (cards: TradeCard[]) => void
  updateUser: (data: Partial<User>) => void
  setLoading: (loading: boolean) => void
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      isAuth: false,
      user: null,
      token: null,
      mode: 'demo',
      cards: [],
      loading: false,

      setAuth: (token, user) => set({ isAuth: true, token, user }),
      logout: () => set({ isAuth: false, user: null, token: null, mode: 'demo', cards: [] }),
      setMode: (mode) => set({ mode }),
      setCards: (cards) => set({ cards }),
      updateUser: (data) => set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),
      setLoading: (loading) => set({ loading }),
    }),
    { name: 'apex-storage' }
  )
)
