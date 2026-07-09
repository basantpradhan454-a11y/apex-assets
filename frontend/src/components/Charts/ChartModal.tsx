import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, TrendingDown, Bot, GraduationCap } from 'lucide-react'
import { createChart, type IChartApi } from 'lightweight-charts'
import { useStore, type Coin, CURVE_GRADUATION_TARGET } from '../../context/store'
import { generateCandleData } from '../../api/mockData'

interface Props {
  coin: Coin
  onClose: () => void
}

const timeframes = ['1m', '5m', '1H', '1D', '1W'] as const
type Timeframe = typeof timeframes[number]
const quickBuyAmounts = [10, 50, 100, 500]
const quickSellPercents = [25, 50, 75, 100]

export default function ChartModal({ coin: initialCoin, onClose }: Props) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartApiRef = useRef<IChartApi | null>(null)
  const [timeframe, setTimeframe] = useState<Timeframe>('1H')
  const [tab, setTab] = useState<'buy' | 'sell'>('buy')
  const [buyAmount, setBuyAmount] = useState(10)
  const [sellQty, setSellQty] = useState(0)
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  const { coins, mode, holdings, buyCoin, sellCoin } = useStore()
  const coin = coins.find((c) => c.id === initialCoin.id) || initialCoin
  const held = holdings[coin.id] || 0

  const change = coin.previous_price > 0 ? ((coin.market_price - coin.previous_price) / coin.previous_price) * 100 : 0
  const isUp = change >= 0
  const progress = Math.min(100, (coin.credits_raised / CURVE_GRADUATION_TARGET) * 100)
  const marketCap = coin.market_price * coin.total_supply

  useEffect(() => {
    if (!chartRef.current) return

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 340,
      layout: { background: { color: 'transparent' }, textColor: '#A0A0A8', fontSize: 11 },
      grid: {
        vertLines: { color: 'rgba(42, 42, 46, 0.3)', style: 2 },
        horzLines: { color: 'rgba(42, 42, 46, 0.3)', style: 2 },
      },
      timeScale: { borderColor: 'rgba(42, 42, 46, 0.5)', timeVisible: true, secondsVisible: false },
      rightPriceScale: { borderColor: 'rgba(42, 42, 46, 0.5)' },
      crosshair: {
        vertLine: { color: 'rgba(212, 175, 55, 0.3)', labelBackgroundColor: '#D4AF37' },
        horzLine: { color: 'rgba(212, 175, 55, 0.3)', labelBackgroundColor: '#D4AF37' },
      },
    })

    chartApiRef.current = chart

    const candleData = generateCandleData(coin, timeframe)
    const series = chart.addCandlestickSeries({
      upColor: '#F5F5F7',
      downColor: '#0A0A0B',
      borderUpColor: '#F5F5F7',
      borderDownColor: '#F5F5F7',
      wickUpColor: '#A0A0A8',
      wickDownColor: '#A0A0A8',
      borderWidth: 1,
      wickColor: '#A0A0A8',
    })

    series.setData(candleData)
    chart.timeScale().fitContent()

    const handleResize = () => {
      if (chartRef.current && chartApiRef.current) {
        chartApiRef.current.applyOptions({ width: chartRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [coin.id, coin.market_price, timeframe])

  const handleBuy = () => {
    const result = buyCoin(coin.id, buyAmount)
    setFeedback({ ok: result.success, msg: result.message })
    if (result.success) setTimeout(() => setFeedback(null), 2000)
  }

  const handleSell = () => {
    const qty = sellQty > 0 ? sellQty : held
    const result = sellCoin(coin.id, qty)
    setFeedback({ ok: result.success, msg: result.message })
    if (result.success) {
      setSellQty(0)
      setTimeout(() => setFeedback(null), 2000)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-apex-black/70 backdrop-blur-md" />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-2xl glass-modal rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-thin"
        >
          {/* Header */}
          <div className="p-6 border-b border-apex-black-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={coin.image_url}
                  alt={coin.name}
                  className="w-14 h-14 rounded-full object-cover bg-apex-black-card gold-border"
                  onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0')}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-apex-white">{coin.name}</h2>
                    <span className="text-xs text-apex-white-dim font-mono">${coin.ticker}</span>
                    {coin.is_graduated && (
                      <span className="flex items-center gap-1 text-[10px] text-apex-gold gold-border px-2 py-0.5 rounded-full">
                        <GraduationCap size={10} /> Graduated
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-lg gold-text font-mono font-bold">
                      {coin.market_price < 0.01 ? coin.market_price.toExponential(3) : coin.market_price.toFixed(4)}
                    </span>
                    <span className={`flex items-center gap-1 text-sm font-mono ${isUp ? 'text-apex-green' : 'text-apex-red'}`}>
                      {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {isUp ? '+' : ''}{change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg text-apex-white-dim hover:text-apex-white hover:bg-apex-black-card transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-1 mt-4">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    timeframe === tf ? 'bg-apex-gold text-apex-black' : 'text-apex-white-dim hover:text-apex-white hover:bg-apex-black-card'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-apex-white-dim/60 mt-2">
              Full bonding-curve history shown from launch ({new Date(coin.created_at).toLocaleDateString()}) to today.
            </p>
          </div>

          {/* Chart */}
          <div className="p-4">
            <div ref={chartRef} className="w-full" />
          </div>

          {/* Bonding curve progress */}
          {!coin.is_graduated && (
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-apex-white-dim">Bonding Curve Progress</span>
                <span className="text-apex-gold font-mono">{progress.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-apex-black-card rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-apex-gold/60 to-apex-gold rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[10px] text-apex-white-dim/60 mt-1.5">
                Graduates to the open Marketplace at {CURVE_GRADUATION_TARGET} credits raised (currently {coin.credits_raised.toFixed(1)}).
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="px-6 pb-6 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-apex-black-card rounded-lg">
              <p className="text-xs text-apex-white-dim mb-1">Market Cap</p>
              <p className="text-sm gold-text font-bold">{marketCap.toFixed(0)}</p>
            </div>
            <div className="text-center p-3 bg-apex-black-card rounded-lg">
              <p className="text-xs text-apex-white-dim mb-1">Credits Raised</p>
              <p className="text-sm text-apex-white font-bold">{coin.credits_raised.toFixed(1)}</p>
            </div>
            <div className="text-center p-3 bg-apex-black-card rounded-lg">
              <p className="text-xs text-apex-white-dim mb-1">You Hold</p>
              <p className="text-sm text-apex-white font-bold">{held.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>

          {mode === 'demo' && (
            <div className="px-6 pb-2 flex items-center gap-1.5 text-[10px] text-apex-white-dim/70">
              <Bot size={12} className="text-apex-gold" />
              Demo Mode: your counterparty is an AI Market Maker on the bonding curve, not a real trader.
            </div>
          )}

          {/* Buy / Sell Tabs */}
          {!coin.is_graduated && (
            <div className="px-6 pb-6">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setTab('buy')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    tab === 'buy' ? 'bg-apex-green/15 text-apex-green border border-apex-green/30' : 'bg-apex-black-card text-apex-white-dim border border-apex-black-border'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setTab('sell')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    tab === 'sell' ? 'bg-apex-red/15 text-apex-red border border-apex-red/30' : 'bg-apex-black-card text-apex-white-dim border border-apex-black-border'
                  }`}
                >
                  Sell
                </button>
              </div>

              {tab === 'buy' ? (
                <div>
                  <div className="flex gap-3 mb-3">
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(parseFloat(e.target.value) || 0)}
                      placeholder="Credits to spend"
                      className="flex-1 bg-apex-black-card border border-apex-black-border rounded-lg px-4 py-2.5 text-sm text-apex-white focus:gold-border focus:outline-none"
                    />
                    <button onClick={handleBuy} className="btn-gold px-6 py-2.5 rounded-lg text-sm">
                      Buy {coin.ticker}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {quickBuyAmounts.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setBuyAmount(amt)}
                        className="flex-1 py-1.5 text-xs rounded-md bg-apex-black-card text-apex-white-dim hover:text-apex-white border border-apex-black-border transition-all"
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex gap-3 mb-3">
                    <input
                      type="number"
                      min={0}
                      max={held}
                      value={sellQty}
                      onChange={(e) => setSellQty(parseFloat(e.target.value) || 0)}
                      placeholder={`Qty of ${coin.ticker}`}
                      className="flex-1 bg-apex-black-card border border-apex-black-border rounded-lg px-4 py-2.5 text-sm text-apex-white focus:gold-border focus:outline-none"
                    />
                    <button onClick={handleSell} disabled={held <= 0} className="btn-gold px-6 py-2.5 rounded-lg text-sm disabled:opacity-40">
                      Sell {coin.ticker}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {quickSellPercents.map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setSellQty(Math.floor(held * (pct / 100)))}
                        disabled={held <= 0}
                        className="flex-1 py-1.5 text-xs rounded-md bg-apex-black-card text-apex-white-dim hover:text-apex-white border border-apex-black-border transition-all disabled:opacity-30"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {feedback && (
                <p className={`text-xs mt-3 font-medium ${feedback.ok ? 'text-apex-green' : 'text-apex-red'}`}>{feedback.msg}</p>
              )}
            </div>
          )}

          <div className="px-6 pb-4">
            <p className="text-[10px] text-apex-white-dim/60 text-center">
              Apex Assets is a digital collectible marketplace. Coins are virtual and intended for
              entertainment purposes only, holding no external financial value.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
