import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, TrendingDown } from 'lucide-react'
import { createChart, type IChartApi, type UTCTimestamp } from 'lightweight-charts'
import type { TradeCard } from '../../context/store'
import { generateCandleData } from '../../api/mockData'

interface Props {
  card: TradeCard
  onClose: () => void
}

const timeframes = ['1m', '5m', '1H', '1D', '1W'] as const
type Timeframe = typeof timeframes[number]

export default function ChartModal({ card, onClose }: Props) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartApiRef = useRef<IChartApi | null>(null)
  const [timeframe, setTimeframe] = useState<Timeframe>('1H')
  const [showTradePanel, setShowTradePanel] = useState(false)

  const change = ((card.market_price - card.previous_price) / card.previous_price) * 100
  const isUp = change >= 0

  useEffect(() => {
    if (!chartRef.current) return

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 360,
      layout: {
        background: { color: 'transparent' },
        textColor: '#A0A0A8',
        fontSize: 11,
      },
      grid: {
        vertLines: {
          color: 'rgba(42, 42, 46, 0.3)',
          style: 2, // dashed
        },
        horzLines: {
          color: 'rgba(42, 42, 46, 0.3)',
          style: 2,
        },
      },
      timeScale: {
        borderColor: 'rgba(42, 42, 46, 0.5)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(42, 42, 46, 0.5)',
      },
      crosshair: {
        vertLine: { color: 'rgba(212, 175, 55, 0.3)', labelBackgroundColor: '#D4AF37' },
        horzLine: { color: 'rgba(212, 175, 55, 0.3)', labelBackgroundColor: '#D4AF37' },
      },
    })

    chartApiRef.current = chart

    const candleData = generateCandleData(card, timeframe)
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
  }, [card, timeframe])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop blur */}
        <div className="absolute inset-0 bg-apex-black/70 backdrop-blur-md" />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-2xl glass-modal rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-apex-black-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={card.image_url}
                  alt={card.name}
                  className="w-14 h-14 rounded-lg object-cover bg-apex-black-card"
                  onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0')}
                />
                <div>
                  <h2 className="text-xl font-bold text-apex-white">{card.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-lg gold-text font-mono font-bold">
                      {card.market_price.toFixed(2)}
                    </span>
                    <span
                      className={`flex items-center gap-1 text-sm font-mono ${
                        isUp ? 'text-apex-green' : 'text-apex-red'
                      }`}
                    >
                      {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {isUp ? '+' : ''}{change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-apex-white-dim hover:text-apex-white hover:bg-apex-black-card transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Timeframe Toggles */}
            <div className="flex gap-1 mt-4">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    timeframe === tf
                      ? 'bg-apex-gold text-apex-black'
                      : 'text-apex-white-dim hover:text-apex-white hover:bg-apex-black-card'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="p-4">
            <div ref={chartRef} className="w-full" />
          </div>

          {/* Card Details */}
          <div className="px-6 pb-6 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-apex-black-card rounded-lg">
              <p className="text-xs text-apex-white-dim mb-1">Rarity</p>
              <p className="text-sm gold-text font-bold">{card.rarity_score}/100</p>
            </div>
            <div className="text-center p-3 bg-apex-black-card rounded-lg">
              <p className="text-xs text-apex-white-dim mb-1">Supply</p>
              <p className="text-sm text-apex-white font-bold">{card.minted_count}/{card.minting_supply}</p>
            </div>
            <div className="text-center p-3 bg-apex-black-card rounded-lg">
              <p className="text-xs text-apex-white-dim mb-1">Trend Index</p>
              <p className="text-sm text-apex-white font-bold">{card.trend_index.toFixed(1)}</p>
            </div>
          </div>

          {/* Trade Buttons */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => setShowTradePanel(true)}
              className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all bg-apex-green/10 text-apex-green border border-apex-green/30 hover:bg-apex-green/20"
            >
              Buy / Collect
            </button>
            <button
              onClick={() => setShowTradePanel(true)}
              className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all bg-apex-red/10 text-apex-red border border-apex-red/30 hover:bg-apex-red/20"
            >
              Sell / Trade
            </button>
          </div>

          {/* Trade Panel */}
          <AnimatePresence>
            {showTradePanel && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden border-t border-apex-black-border"
              >
                <div className="p-6">
                  <div className="flex gap-3 mb-4">
                    <input
                      type="number"
                      placeholder="Amount in credits"
                      className="flex-1 bg-apex-black-card border border-apex-black-border rounded-lg px-4 py-2.5 text-sm text-apex-white focus:gold-border focus:outline-none"
                    />
                    <button className="btn-gold px-6 py-2.5 rounded-lg text-sm">
                      Confirm
                    </button>
                  </div>
                  <p className="text-xs text-apex-white-dim">
                    Trading in Demo Mode with virtual credits. Complete KYC for live trading.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Disclaimer */}
          <div className="px-6 pb-4">
            <p className="text-[10px] text-apex-white-dim/60 text-center">
              Apex Assets is a digital collectible marketplace. Assets are virtual and intended
              for entertainment purposes only, holding no external financial value.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
