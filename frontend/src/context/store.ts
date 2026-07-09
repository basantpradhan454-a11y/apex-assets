import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mockCoins as seedCoins, mockDesigns as seedDesigns } from '../api/mockData'

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

// ---- Bonding Curve Constants (pump.fun-style, denominated in Apex Credits) ----
export const CURVE_INITIAL_CREDIT_RESERVE = 30
export const CURVE_INITIAL_COIN_RESERVE = 1_000_000_000
export const CURVE_TOTAL_SUPPLY = 1_000_000_000
export const CURVE_GRADUATION_TARGET = 500 // credits raised before a coin "graduates" to the open Marketplace

export interface Coin {
  id: string
  name: string
  ticker: string
  coin_id: string
  image_url: string
  creator_tag: string
  description: string
  created_at: string // launch date — chart history is generated from this date to today

  // Bonding curve state
  virtual_credit_reserve: number
  virtual_coin_reserve: number
  k: number // constant product invariant
  credits_raised: number
  total_supply: number
  is_graduated: boolean
  is_demo_asset: boolean

  // Derived/display fields (recomputed on every trade)
  market_price: number
  previous_price: number
  market_cap: number
}

export interface Trade {
  id: string
  coin_id: string
  coin_name: string
  ticker: string
  type: 'buy' | 'sell'
  coin_amount: number
  credit_amount: number
  price_per_coin: number
  mode: Mode
  counterparty: string // 'AI Market Maker' (demo) or 'Bonding Curve' (live)
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
  coinsOut?: number
  creditsOut?: number
}

function priceOf(coin: Coin): number {
  return coin.virtual_credit_reserve / coin.virtual_coin_reserve
}

function marketCapOf(coin: Coin): number {
  return priceOf(coin) * coin.total_supply
}

interface StoreState {
  isAuth: boolean
  user: User | null
  token: string | null
  mode: Mode
  coins: Coin[]
  trades: Trade[]
  holdings: Record<string, number> // coin_id -> quantity held
  designs: DesignTemplate[]
  remixDesign: DesignTemplate | null
  loading: boolean

  setAuth: (token: string, user: User) => void
  logout: () => void
  setMode: (mode: Mode) => void
  updateUser: (data: Partial<User>) => void
  setLoading: (loading: boolean) => void

  launchCoin: (data: { name: string; ticker: string; image_url: string; description: string; creator_tag: string }) => Coin
  buyCoin: (coinId: string, creditsToSpend: number) => TradeResult
  sellCoin: (coinId: string, coinsToSell: number) => TradeResult
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
      coins: seedCoins,
      trades: [],
      holdings: {},
      designs: seedDesigns,
      remixDesign: null,
      loading: false,

      setAuth: (token, user) => set({ isAuth: true, token, user }),
      logout: () => set({ isAuth: false, user: null, token: null, mode: 'demo' }),
      setMode: (mode) => set({ mode }),
      updateUser: (data) =>
        set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),
      setLoading: (loading) => set({ loading }),
      setRemixDesign: (design) => set({ remixDesign: design }),

      launchCoin: ({ name, ticker, image_url, description, creator_tag }) => {
        const state = get()
        const k = CURVE_INITIAL_CREDIT_RESERVE * CURVE_INITIAL_COIN_RESERVE
        const coin: Coin = {
          id: 'coin_' + Math.random().toString(36).slice(2, 10),
          name,
          ticker: ticker.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'COIN',
          coin_id: 'APEX-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          image_url,
          description,
          creator_tag: creator_tag || 'Anonymous',
          created_at: new Date().toISOString(),
          virtual_credit_reserve: CURVE_INITIAL_CREDIT_RESERVE,
          virtual_coin_reserve: CURVE_INITIAL_COIN_RESERVE,
          k,
          credits_raised: 0,
          total_supply: CURVE_TOTAL_SUPPLY,
          is_graduated: false,
          is_demo_asset: state.mode === 'demo',
          market_price: CURVE_INITIAL_CREDIT_RESERVE / CURVE_INITIAL_COIN_RESERVE,
          previous_price: CURVE_INITIAL_CREDIT_RESERVE / CURVE_INITIAL_COIN_RESERVE,
        }
        set({ coins: [coin, ...state.coins] })
        return coin
      },

      buyCoin: (coinId, creditsToSpend) => {
        const state = get()
        const coin = state.coins.find((c) => c.id === coinId)
        const user = state.user
        if (!coin || !user) return { success: false, message: 'Coin or user not found' }
        if (coin.is_graduated) return { success: false, message: `${coin.ticker} has graduated — trade it on the open Marketplace` }
        if (state.mode === 'live' && !user.is_kyc_verified) {
          return { success: false, message: 'Complete KYC to trade in Live mode' }
        }
        if (creditsToSpend <= 0) return { success: false, message: 'Enter a valid amount' }

        const isDemo = state.mode === 'demo'
        const balance = isDemo ? user.virtual_balance : user.real_wallet_balance
        if (balance < creditsToSpend) {
          return { success: false, message: `Insufficient ${isDemo ? 'virtual credits' : 'Apex Credits'}` }
        }

        // Constant-product bonding curve, same mechanics as pump.fun — AI/algorithmic, no real counterparty in Demo mode
        const newCreditReserve = coin.virtual_credit_reserve + creditsToSpend
        const newCoinReserve = coin.k / newCreditReserve
        const coinsOut = coin.virtual_coin_reserve - newCoinReserve
        const newPrice = newCreditReserve / newCoinReserve
        const newRaised = coin.credits_raised + creditsToSpend
        const graduated = newRaised >= CURVE_GRADUATION_TARGET

        const trade: Trade = {
          id: 'trd_' + Math.random().toString(36).slice(2, 10),
          coin_id: coin.id,
          coin_name: coin.name,
          ticker: coin.ticker,
          type: 'buy',
          coin_amount: coinsOut,
          credit_amount: creditsToSpend,
          price_per_coin: newPrice,
          mode: state.mode,
          counterparty: isDemo ? 'AI Market Maker' : 'Bonding Curve',
          timestamp: new Date().toISOString(),
        }

        const updatedUser: User = isDemo
          ? { ...user, virtual_balance: parseFloat((user.virtual_balance - creditsToSpend).toFixed(4)) }
          : { ...user, real_wallet_balance: parseFloat((user.real_wallet_balance - creditsToSpend).toFixed(4)) }

        set({
          coins: state.coins.map((c) =>
            c.id === coinId
              ? {
                  ...c,
                  previous_price: c.market_price,
                  market_price: newPrice,
                  market_cap: newPrice * c.total_supply,
                  virtual_credit_reserve: newCreditReserve,
                  virtual_coin_reserve: newCoinReserve,
                  credits_raised: newRaised,
                  is_graduated: graduated,
                }
              : c
          ),
          user: updatedUser,
          trades: [trade, ...state.trades],
          holdings: { ...state.holdings, [coinId]: (state.holdings[coinId] || 0) + coinsOut },
        })

        return {
          success: true,
          coinsOut,
          message: graduated
            ? `${coin.ticker} just graduated to the Marketplace! 🎓`
            : `Bought ${coinsOut.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${coin.ticker}`,
        }
      },

      sellCoin: (coinId, coinsToSell) => {
        const state = get()
        const coin = state.coins.find((c) => c.id === coinId)
        const user = state.user
        if (!coin || !user) return { success: false, message: 'Coin or user not found' }
        if (coin.is_graduated) return { success: false, message: `${coin.ticker} has graduated — trade it on the open Marketplace` }
        if (state.mode === 'live' && !user.is_kyc_verified) {
          return { success: false, message: 'Complete KYC to trade in Live mode' }
        }

        const held = state.holdings[coinId] || 0
        if (coinsToSell <= 0 || coinsToSell > held) {
          return { success: false, message: `You only hold ${held.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${coin.ticker}` }
        }

        const isDemo = state.mode === 'demo'
        const newCoinReserve = coin.virtual_coin_reserve + coinsToSell
        const newCreditReserve = coin.k / newCoinReserve
        const creditsOut = coin.virtual_credit_reserve - newCreditReserve
        const newPrice = newCreditReserve / newCoinReserve
        const newRaised = Math.max(0, coin.credits_raised - creditsOut)

        const trade: Trade = {
          id: 'trd_' + Math.random().toString(36).slice(2, 10),
          coin_id: coin.id,
          coin_name: coin.name,
          ticker: coin.ticker,
          type: 'sell',
          coin_amount: coinsToSell,
          credit_amount: creditsOut,
          price_per_coin: newPrice,
          mode: state.mode,
          counterparty: isDemo ? 'AI Market Maker' : 'Bonding Curve',
          timestamp: new Date().toISOString(),
        }

        const updatedUser: User = isDemo
          ? { ...user, virtual_balance: parseFloat((user.virtual_balance + creditsOut).toFixed(4)) }
          : { ...user, real_wallet_balance: parseFloat((user.real_wallet_balance + creditsOut).toFixed(4)) }

        set({
          coins: state.coins.map((c) =>
            c.id === coinId
              ? {
                  ...c,
                  previous_price: c.market_price,
                  market_price: newPrice,
                  market_cap: newPrice * c.total_supply,
                  virtual_credit_reserve: newCreditReserve,
                  virtual_coin_reserve: newCoinReserve,
                  credits_raised: newRaised,
                }
              : c
          ),
          user: updatedUser,
          trades: [trade, ...state.trades],
          holdings: { ...state.holdings, [coinId]: held - coinsToSell },
        })

        return { success: true, creditsOut, message: `Sold ${coinsToSell.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${coin.ticker}` }
      },

      submitKyc: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, kyc: { ...data, status: 'pending' } } : null,
        })),
    }),
    { name: 'apex-storage-v2' }
  )
)

export { priceOf, marketCapOf }
