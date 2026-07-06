import type { TradeCard } from '../context/store'
import type { UTCTimestamp } from 'lightweight-charts'

export const mockCards: TradeCard[] = [
  {
    id: 'card_001',
    card_id: 'APEX-001-XK',
    name: 'Golden Ape Genesis',
    image_url: 'https://picsum.photos/seed/ape1/400/400',
    creator_tag: 'ApexOfficial',
    rarity_score: 95,
    trend_index: 87.3,
    minting_supply: 100,
    minted_count: 42,
    market_price: 1250.50,
    previous_price: 1180.00,
    is_demo_asset: true,
    tenant_id: null,
    created_at: '2025-06-15T10:00:00Z',
  },
  {
    id: 'card_002',
    card_id: 'APEX-002-TM',
    name: 'Neon Tiger Wave',
    image_url: 'https://picsum.photos/seed/tiger2/400/400',
    creator_tag: 'PixelKing',
    rarity_score: 78,
    trend_index: 64.2,
    minting_supply: 50,
    minted_count: 31,
    market_price: 680.75,
    previous_price: 720.00,
    is_demo_asset: true,
    tenant_id: null,
    created_at: '2025-06-18T12:00:00Z',
  },
  {
    id: 'card_003',
    card_id: 'APEX-003-RD',
    name: 'Cosmic Rider',
    image_url: 'https://picsum.photos/seed/cosmic3/400/400',
    creator_tag: 'NeonArt',
    rarity_score: 85,
    trend_index: 92.1,
    minting_supply: 10,
    minted_count: 8,
    market_price: 3400.00,
    previous_price: 3200.00,
    is_demo_asset: true,
    tenant_id: null,
    created_at: '2025-06-20T09:00:00Z',
  },
  {
    id: 'card_004',
    card_id: 'APEX-004-PL',
    name: 'Diamond Pegasus',
    image_url: 'https://picsum.photos/seed/pegasus4/400/400',
    creator_tag: 'MythicMint',
    rarity_score: 92,
    trend_index: 78.5,
    minting_supply: 25,
    minted_count: 25,
    market_price: 890.00,
    previous_price: 950.00,
    is_demo_asset: true,
    tenant_id: null,
    created_at: '2025-06-22T14:00:00Z',
  },
  {
    id: 'card_005',
    card_id: 'APEX-005-VL',
    name: 'Volt Lynx',
    image_url: 'https://picsum.photos/seed/lynx5/400/400',
    creator_tag: 'VoltStudio',
    rarity_score: 65,
    trend_index: 55.0,
    minting_supply: 200,
    minted_count: 87,
    market_price: 145.30,
    previous_price: 132.00,
    is_demo_asset: true,
    tenant_id: null,
    created_at: '2025-06-25T11:00:00Z',
  },
  {
    id: 'card_006',
    card_id: 'APEX-006-SB',
    name: 'Shadow Bear',
    image_url: 'https://picsum.photos/seed/bear6/400/400',
    creator_tag: 'DarkMint',
    rarity_score: 88,
    trend_index: 71.8,
    minting_supply: 5,
    minted_count: 3,
    market_price: 5600.00,
    previous_price: 5400.00,
    is_demo_asset: true,
    tenant_id: null,
    created_at: '2025-06-28T16:00:00Z',
  },
]

interface CandlePoint {
  time: UTCTimestamp
  open: number
  high: number
  low: number
  close: number
}

export function generateCandleData(card: TradeCard, timeframe: string): CandlePoint[] {
  const tfMinutes: Record<string, number> = {
    '1m': 1,
    '5m': 5,
    '1H': 60,
    '1D': 1440,
    '1W': 10080,
  }
  const interval = tfMinutes[timeframe] || 60
  const count = timeframe === '1W' ? 12 : timeframe === '1D' ? 30 : timeframe === '1H' ? 48 : timeframe === '5m' ? 60 : 60
  const now = Math.floor(Date.now() / 1000)
  const basePrice = card.previous_price
  const volatility = basePrice * 0.03

  const data: CandlePoint[] = []
  let prevClose = basePrice

  for (let i = count - 1; i >= 0; i--) {
    const time = (now - i * interval * 60) as UTCTimestamp
    const trend = (card.market_price - basePrice) / count
    const noise = (Math.random() - 0.5) * volatility
    const open = prevClose
    const close = Math.max(0.01, open + trend + noise)
    const high = Math.max(open, close) + Math.random() * volatility * 0.5
    const low = Math.min(open, close) - Math.random() * volatility * 0.5

    data.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(Math.max(0.01, low).toFixed(2)),
      close: parseFloat(close.toFixed(2)),
    })
    prevClose = close
  }

  // Ensure last candle matches current price
  if (data.length > 0) {
    data[data.length - 1].close = card.market_price
    data[data.length - 1].high = Math.max(data[data.length - 1].high, card.market_price)
  }

  return data
}
