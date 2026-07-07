import type { TradeCard, DesignTemplate } from '../context/store'
import type { UTCTimestamp } from 'lightweight-charts'

export const mockCards: TradeCard[] = [
  {
    id: 'card_001', card_id: 'APEX-001-XK', name: 'Golden Ape Genesis',
    image_url: 'https://picsum.photos/seed/ape1/400/400', creator_tag: 'ApexOfficial',
    rarity_score: 95, trend_index: 87.3, minting_supply: 100, minted_count: 42,
    market_price: 1250.50, previous_price: 1180.00, is_demo_asset: true, tenant_id: null,
    created_at: '2025-11-02T10:00:00Z',
  },
  {
    id: 'card_002', card_id: 'APEX-002-TM', name: 'Neon Tiger Wave',
    image_url: 'https://picsum.photos/seed/tiger2/400/400', creator_tag: 'PixelKing',
    rarity_score: 78, trend_index: 64.2, minting_supply: 50, minted_count: 31,
    market_price: 680.75, previous_price: 720.00, is_demo_asset: true, tenant_id: null,
    created_at: '2025-12-18T12:00:00Z',
  },
  {
    id: 'card_003', card_id: 'APEX-003-RD', name: 'Cosmic Rider',
    image_url: 'https://picsum.photos/seed/cosmic3/400/400', creator_tag: 'NeonArt',
    rarity_score: 85, trend_index: 92.1, minting_supply: 10, minted_count: 8,
    market_price: 3400.00, previous_price: 3200.00, is_demo_asset: true, tenant_id: null,
    created_at: '2026-01-20T09:00:00Z',
  },
  {
    id: 'card_004', card_id: 'APEX-004-PL', name: 'Diamond Pegasus',
    image_url: 'https://picsum.photos/seed/pegasus4/400/400', creator_tag: 'MythicMint',
    rarity_score: 92, trend_index: 78.5, minting_supply: 25, minted_count: 25,
    market_price: 890.00, previous_price: 950.00, is_demo_asset: true, tenant_id: null,
    created_at: '2026-02-22T14:00:00Z',
  },
  {
    id: 'card_005', card_id: 'APEX-005-VL', name: 'Volt Lynx',
    image_url: 'https://picsum.photos/seed/lynx5/400/400', creator_tag: 'VoltStudio',
    rarity_score: 65, trend_index: 55.0, minting_supply: 200, minted_count: 87,
    market_price: 145.30, previous_price: 132.00, is_demo_asset: true, tenant_id: null,
    created_at: '2026-03-25T11:00:00Z',
  },
  {
    id: 'card_006', card_id: 'APEX-006-SB', name: 'Shadow Bear',
    image_url: 'https://picsum.photos/seed/bear6/400/400', creator_tag: 'DarkMint',
    rarity_score: 88, trend_index: 71.8, minting_supply: 5, minted_count: 3,
    market_price: 5600.00, previous_price: 5400.00, is_demo_asset: true, tenant_id: null,
    created_at: '2026-04-28T16:00:00Z',
  },
]

const categories: DesignTemplate['category'][] = ['Luxury', 'Minimalist', 'Business', 'Personal', 'Trending']

const promptBank: Record<DesignTemplate['category'], string[]> = {
  Luxury: [
    'Ultra-luxury trading card, brushed gold foil border, matte black background, 3D embossed logo, cinematic lighting, hyper-detailed, 8k render',
    'Opulent collectible card design, liquid gold texture, obsidian black backdrop, diamond dust particles, studio lighting, macro detail',
    'Premium black card with gold filigree engraving, velvet backdrop, soft rim light, luxury watch brand aesthetic, ultra sharp',
    'Regal gold-embossed trading card, dark marble background, subtle glow, high-end jewelry photography style',
  ],
  Minimalist: [
    'Minimalist trading card, single geometric shape, flat matte black surface, one thin gold line accent, negative space, clean composition',
    'Ultra clean card design, monochrome palette, tiny gold dot logo, lots of breathing room, Scandinavian design influence',
    'Simple abstract card face, muted tones, thin outline border, no clutter, modern editorial layout',
    'Flat design collectible card, subtle grain texture, one accent color, generous whitespace, Swiss grid layout',
  ],
  Business: [
    'Corporate trading card design, sharp geometric pattern, navy-black gradient, gold corner accents, professional fintech aesthetic',
    'Executive-style collectible card, clean typography space, subtle circuit-board texture, dark theme, enterprise branding feel',
    'Boardroom-inspired card face, structured grid lines, gold ticker graphic, confident and formal composition',
    'Professional dashboard-style card art, abstract data visualization pattern, dark navy and gold palette',
  ],
  Personal: [
    'Personal avatar trading card, warm portrait lighting, soft bokeh background, gold name plate, intimate framing',
    'Custom personal brand card, hand-drawn line art style, subtle gold texture overlay, friendly approachable tone',
    'Personalized collectible card, watercolor texture blended with matte black, gold initials monogram',
    'Casual lifestyle card design, candid photo composition, warm gold vignette, personal storytelling feel',
  ],
  Trending: [
    'Viral meme-style trading card, bold high-contrast colors, glowing neon gold outline, energetic pose, social-media-ready crop',
    'Trending internet culture card design, glitch art overlay, holographic gold foil effect, dynamic diagonal composition',
    'Hype-drop collectible card, explosive particle effects, gold lightning accents, streetwear aesthetic',
    'Trending gaming-inspired card face, cyberpunk neon gold glow, dramatic low angle, high energy motion blur',
  ],
}

function buildDesigns(): DesignTemplate[] {
  const designs: DesignTemplate[] = []
  let counter = 1
  categories.forEach((cat) => {
    promptBank[cat].forEach((prompt, idx) => {
      designs.push({
        id: `dsn_${String(counter).padStart(3, '0')}`,
        name: `${cat} Edition ${idx + 1}`,
        category: cat,
        image_url: `https://picsum.photos/seed/design${counter}/400/520`,
        prompt,
        uses: Math.floor(Math.random() * 900) + 50,
      })
      counter++
    })
  })
  return designs
}

export const mockDesigns: DesignTemplate[] = buildDesigns()

interface CandlePoint {
  time: UTCTimestamp
  open: number
  high: number
  low: number
  close: number
}

// Seeded PRNG so chart data is stable across re-renders for the same card/timeframe
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

function seededRandom(seed: number) {
  let s = seed
  return function () {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Generates candlestick history from the card's LAUNCH DATE (created_at) through today,
 * so every timeframe shows the full lifetime of the asset — not just a recent window.
 * Data is deterministic per card+timeframe (seeded RNG) so it doesn't reshuffle on re-render.
 */
export function generateCandleData(card: TradeCard, timeframe: string): CandlePoint[] {
  const tfMinutes: Record<string, number> = { '1m': 1, '5m': 5, '1H': 60, '1D': 1440, '1W': 10080 }
  const interval = tfMinutes[timeframe] || 60

  const launchMs = new Date(card.created_at).getTime()
  const nowMs = Date.now()
  const spanMinutes = Math.max(interval, (nowMs - launchMs) / 60000)

  // Full history, capped for render performance (aggregates into fewer, larger candles if needed)
  let count = Math.floor(spanMinutes / interval)
  count = Math.min(Math.max(count, 20), 500)

  const rand = seededRandom(hashString(card.id + timeframe))
  const startPrice = Math.max(1, card.market_price * (0.3 + rand() * 0.4))
  const totalGrowth = card.market_price - startPrice
  const volatility = Math.max(0.5, card.market_price * 0.025)
  const stepMs = (nowMs - launchMs) / count

  const data: CandlePoint[] = []
  let prevClose = startPrice

  for (let i = 0; i < count; i++) {
    const time = Math.floor((launchMs + i * stepMs) / 1000) as UTCTimestamp
    const progress = i / count
    const trendTarget = startPrice + totalGrowth * progress
    const noise = (rand() - 0.5) * volatility
    const open = prevClose
    const close = Math.max(0.01, trendTarget + noise)
    const high = Math.max(open, close) + rand() * volatility * 0.5
    const low = Math.max(0.01, Math.min(open, close) - rand() * volatility * 0.5)

    data.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
    })
    prevClose = close
  }

  if (data.length > 0) {
    data[data.length - 1].close = card.market_price
    data[data.length - 1].high = Math.max(data[data.length - 1].high, card.market_price)
  }

  return data
}
