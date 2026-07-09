import type { Coin, DesignTemplate } from '../context/store'
import { CURVE_INITIAL_CREDIT_RESERVE, CURVE_INITIAL_COIN_RESERVE, CURVE_TOTAL_SUPPLY } from '../context/store'
import type { UTCTimestamp } from 'lightweight-charts'

function buildSeedCoin(opts: {
  id: string; name: string; ticker: string; coin_id: string; image_url: string
  creator_tag: string; description: string; created_at: string; creditsRaised: number
}): Coin {
  // Simulate a coin that already had some buys since launch, per the constant-product bonding curve
  const k = CURVE_INITIAL_CREDIT_RESERVE * CURVE_INITIAL_COIN_RESERVE
  const virtual_credit_reserve = CURVE_INITIAL_CREDIT_RESERVE + opts.creditsRaised
  const virtual_coin_reserve = k / virtual_credit_reserve
  const market_price = virtual_credit_reserve / virtual_coin_reserve
  return {
    id: opts.id,
    name: opts.name,
    ticker: opts.ticker,
    coin_id: opts.coin_id,
    image_url: opts.image_url,
    creator_tag: opts.creator_tag,
    description: opts.description,
    created_at: opts.created_at,
    virtual_credit_reserve,
    virtual_coin_reserve,
    k,
    credits_raised: opts.creditsRaised,
    total_supply: CURVE_TOTAL_SUPPLY,
    is_graduated: opts.creditsRaised >= 500,
    is_demo_asset: true,
    market_price,
    previous_price: market_price * (0.9 + Math.random() * 0.15),
  }
}

export const mockCoins: Coin[] = [
  buildSeedCoin({
    id: 'coin_001', name: 'Golden Ape Genesis', ticker: 'GAPE', coin_id: 'APEX-001-XK',
    image_url: 'https://picsum.photos/seed/ape1/400/400', creator_tag: 'ApexOfficial',
    description: 'The genesis meme coin of Apex Assets.', created_at: '2025-11-02T10:00:00Z', creditsRaised: 410,
  }),
  buildSeedCoin({
    id: 'coin_002', name: 'Neon Tiger Wave', ticker: 'NTIGER', coin_id: 'APEX-002-TM',
    image_url: 'https://picsum.photos/seed/tiger2/400/400', creator_tag: 'PixelKing',
    description: 'Ride the neon wave.', created_at: '2025-12-18T12:00:00Z', creditsRaised: 180,
  }),
  buildSeedCoin({
    id: 'coin_003', name: 'Cosmic Rider', ticker: 'CSMC', coin_id: 'APEX-003-RD',
    image_url: 'https://picsum.photos/seed/cosmic3/400/400', creator_tag: 'NeonArt',
    description: 'To the moon and back.', created_at: '2026-01-20T09:00:00Z', creditsRaised: 495,
  }),
  buildSeedCoin({
    id: 'coin_004', name: 'Diamond Pegasus', ticker: 'DPEG', coin_id: 'APEX-004-PL',
    image_url: 'https://picsum.photos/seed/pegasus4/400/400', creator_tag: 'MythicMint',
    description: 'Mythical, rare, unstoppable.', created_at: '2026-02-22T14:00:00Z', creditsRaised: 60,
  }),
  buildSeedCoin({
    id: 'coin_005', name: 'Volt Lynx', ticker: 'VOLT', coin_id: 'APEX-005-VL',
    image_url: 'https://picsum.photos/seed/lynx5/400/400', creator_tag: 'VoltStudio',
    description: 'Fast. Electric. Untamed.', created_at: '2026-03-25T11:00:00Z', creditsRaised: 22,
  }),
  buildSeedCoin({
    id: 'coin_006', name: 'Shadow Bear', ticker: 'SHDW', coin_id: 'APEX-006-SB',
    image_url: 'https://picsum.photos/seed/bear6/400/400', creator_tag: 'DarkMint',
    description: 'Lurking in the dark pools.', created_at: '2026-04-28T16:00:00Z', creditsRaised: 8,
  }),
]

const categories: DesignTemplate['category'][] = ['Luxury', 'Minimalist', 'Business', 'Personal', 'Trending']

const promptBank: Record<DesignTemplate['category'], string[]> = {
  Luxury: [
    'Ultra-luxury meme coin logo, brushed gold foil coin icon, matte black background, 3D embossed emblem, cinematic lighting, hyper-detailed, 8k render',
    'Opulent coin design, liquid gold texture, obsidian black backdrop, diamond dust particles, studio lighting, macro detail',
    'Premium black coin with gold filigree engraving, velvet backdrop, soft rim light, luxury watch brand aesthetic, ultra sharp',
    'Regal gold-embossed coin icon, dark marble background, subtle glow, high-end jewelry photography style',
  ],
  Minimalist: [
    'Minimalist coin logo, single geometric shape, flat matte black surface, one thin gold line accent, negative space, clean composition',
    'Ultra clean coin design, monochrome palette, tiny gold dot logo, lots of breathing room, Scandinavian design influence',
    'Simple abstract coin face, muted tones, thin outline border, no clutter, modern editorial layout',
    'Flat design coin icon, subtle grain texture, one accent color, generous whitespace, Swiss grid layout',
  ],
  Business: [
    'Corporate coin logo design, sharp geometric pattern, navy-black gradient, gold corner accents, professional fintech aesthetic',
    'Executive-style coin icon, clean typography space, subtle circuit-board texture, dark theme, enterprise branding feel',
    'Boardroom-inspired coin face, structured grid lines, gold ticker graphic, confident and formal composition',
    'Professional dashboard-style coin art, abstract data visualization pattern, dark navy and gold palette',
  ],
  Personal: [
    'Personal avatar coin design, warm portrait lighting, soft bokeh background, gold name plate, intimate framing',
    'Custom personal brand coin, hand-drawn line art style, subtle gold texture overlay, friendly approachable tone',
    'Personalized coin icon, watercolor texture blended with matte black, gold initials monogram',
    'Casual lifestyle coin design, candid photo composition, warm gold vignette, personal storytelling feel',
  ],
  Trending: [
    'Viral meme coin logo, bold high-contrast colors, glowing neon gold outline, energetic pose, social-media-ready crop',
    'Trending internet culture coin design, glitch art overlay, holographic gold foil effect, dynamic diagonal composition',
    'Hype-drop coin icon, explosive particle effects, gold lightning accents, streetwear aesthetic',
    'Trending gaming-inspired coin face, cyberpunk neon gold glow, dramatic low angle, high energy motion blur',
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
 * Generates the bonding-curve price history from the coin's LAUNCH DATE (created_at) through today.
 * Since price on a bonding curve only moves up on buys / down on sells, the simulated path is
 * monotonically-biased upward (like a real pump.fun curve), ending exactly at the coin's current price.
 */
export function generateCandleData(coin: Coin, timeframe: string): CandlePoint[] {
  const tfMinutes: Record<string, number> = { '1m': 1, '5m': 5, '1H': 60, '1D': 1440, '1W': 10080 }
  const interval = tfMinutes[timeframe] || 60

  const launchMs = new Date(coin.created_at).getTime()
  const nowMs = Date.now()
  const spanMinutes = Math.max(interval, (nowMs - launchMs) / 60000)

  let count = Math.floor(spanMinutes / interval)
  count = Math.min(Math.max(count, 20), 500)

  const rand = seededRandom(hashString(coin.id + timeframe))
  const startPrice = CURVE_INITIAL_CREDIT_RESERVE / CURVE_INITIAL_COIN_RESERVE
  const totalGrowth = coin.market_price - startPrice
  const volatility = Math.max(coin.market_price * 0.0001, coin.market_price * 0.03)
  const stepMs = (nowMs - launchMs) / count

  const data: CandlePoint[] = []
  let prevClose = startPrice

  for (let i = 0; i < count; i++) {
    const time = Math.floor((launchMs + i * stepMs) / 1000) as UTCTimestamp
    // Bonding curve growth is convex (accelerates as buys stack) — bias progress with an easing curve
    const progress = Math.pow(i / count, 1.4)
    const trendTarget = startPrice + totalGrowth * progress
    const noise = (rand() - 0.45) * volatility // slight upward bias, matching curve mechanics
    const open = prevClose
    const close = Math.max(startPrice * 0.5, trendTarget + noise)
    const high = Math.max(open, close) + rand() * volatility * 0.5
    const low = Math.max(startPrice * 0.4, Math.min(open, close) - rand() * volatility * 0.5)

    data.push({
      time,
      open,
      high,
      low,
      close,
    })
    prevClose = close
  }

  if (data.length > 0) {
    data[data.length - 1].close = coin.market_price
    data[data.length - 1].high = Math.max(data[data.length - 1].high, coin.market_price)
  }

  return data
}
