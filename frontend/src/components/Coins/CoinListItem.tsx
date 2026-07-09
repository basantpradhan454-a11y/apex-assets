import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, GraduationCap } from 'lucide-react'
import type { Coin } from '../../context/store'
import { CURVE_GRADUATION_TARGET } from '../../context/store'

interface Props {
  coin: Coin
  onClick?: () => void
}

export default function CoinListItem({ coin, onClick }: Props) {
  const change = coin.previous_price > 0 ? ((coin.market_price - coin.previous_price) / coin.previous_price) * 100 : 0
  const isUp = change >= 0
  const progress = Math.min(100, (coin.credits_raised / CURVE_GRADUATION_TARGET) * 100)

  return (
    <motion.div
      onClick={onClick}
      className="card-surface overflow-hidden group hover:gold-glow transition-shadow duration-300 cursor-pointer"
      whileHover={{ y: -3 }}
    >
      <div className="relative h-44 bg-apex-black-card overflow-hidden">
        <img
          src={coin.image_url}
          alt={coin.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-apex-black to-transparent" />

        <div className="absolute top-2 left-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-apex-black/80 text-apex-gold">${coin.ticker}</span>
        </div>

        {coin.is_graduated ? (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-apex-black/80">
            <GraduationCap size={11} className="text-apex-gold" />
            <span className="text-[10px] text-apex-gold font-medium">Graduated</span>
          </div>
        ) : coin.is_demo_asset && (
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-apex-gold/20 text-apex-gold gold-border">DEMO</span>
          </div>
        )}

        <div className={`absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-apex-black/80 ${isUp ? 'green-glow' : 'red-glow'}`}>
          {isUp ? <TrendingUp size={12} className="text-apex-green" /> : <TrendingDown size={12} className="text-apex-red" />}
          <span className={`text-xs font-mono ${isUp ? 'text-apex-green' : 'text-apex-red'}`}>
            {isUp ? '+' : ''}{change.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-apex-white truncate">{coin.name}</h3>
        </div>
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="text-apex-gold font-mono">{coin.market_price < 0.01 ? coin.market_price.toExponential(2) : coin.market_price.toFixed(4)}</span>
          <span className="text-apex-white-dim">MCap {coin.market_cap ? coin.market_cap.toFixed(0) : (coin.market_price * coin.total_supply).toFixed(0)}</span>
        </div>

        {!coin.is_graduated && (
          <div>
            <div className="w-full h-1.5 bg-apex-black-card rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-apex-gold/60 to-apex-gold rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-apex-white-dim">{progress.toFixed(0)}% bonded</span>
              <span className="text-[9px] text-apex-white-dim">by {coin.creator_tag}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
