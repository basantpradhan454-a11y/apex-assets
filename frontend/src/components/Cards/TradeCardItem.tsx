import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Layers } from 'lucide-react'
import type { TradeCard } from '../../context/store'

interface Props {
  card: TradeCard
  onClick?: () => void
}

export default function TradeCardItem({ card, onClick }: Props) {
  const [isFlipped, setIsFlipped] = useState(false)
  const change = ((card.market_price - card.previous_price) / card.previous_price) * 100
  const isUp = change >= 0
  const supplyLeft = card.minting_supply - card.minted_count

  const rarityColors: Record<string, string> = {
    Legendary: 'text-apex-gold',
    Epic: 'text-purple-400',
    Rare: 'text-blue-400',
    Common: 'text-apex-white-dim',
  }
  const rarityLabel =
    card.rarity_score >= 90 ? 'Legendary' :
    card.rarity_score >= 70 ? 'Epic' :
    card.rarity_score >= 40 ? 'Rare' : 'Common'

  return (
    <div
      className="relative cursor-pointer perspective-1000"
      style={{ perspective: '1000px' }}
      onClick={onClick}
    >
      <motion.div
        className="relative w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        onMouseEnter={() => setIsFlipped(true)}
        onMouseLeave={() => setIsFlipped(false)}
      >
        {/* Front */}
        <div
          className="card-surface overflow-hidden group hover:gold-glow transition-shadow duration-300"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Card Image */}
          <div className="relative h-48 bg-apex-black-card overflow-hidden">
            <img
              src={card.image_url}
              alt={card.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-apex-black to-transparent" />

            {/* Rarity Badge */}
            <div className="absolute top-2 right-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-apex-black/80 ${rarityColors[rarityLabel]}`}>
                {rarityLabel}
              </span>
            </div>

            {/* Demo Badge */}
            {card.is_demo_asset && (
              <div className="absolute top-2 left-2">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-apex-gold/20 text-apex-gold gold-border">
                  DEMO
                </span>
              </div>
            )}

            {/* Trend Indicator */}
            <div className={`absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-apex-black/80 ${
              isUp ? 'green-glow' : 'red-glow'
            }`}>
              {isUp ? <TrendingUp size={12} className="text-apex-green" /> : <TrendingDown size={12} className="text-apex-red" />}
              <span className={`text-xs font-mono ${isUp ? 'text-apex-green' : 'text-apex-red'}`}>
                {isUp ? '+' : ''}{change.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Card Info */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-apex-white truncate">{card.name}</h3>
              <span className="text-xs text-apex-gold font-mono">{card.market_price.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-apex-white-dim">
              <span className="flex items-center gap-1">
                <Layers size={10} /> {supplyLeft}/{card.minting_supply}
              </span>
              <span>by {card.creator_tag}</span>
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 card-surface p-4 flex flex-col justify-center items-center text-center"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="space-y-2 w-full">
            <div className="flex justify-between text-xs">
              <span className="text-apex-white-dim">Rarity Score</span>
              <span className="text-apex-gold font-mono">{card.rarity_score}/100</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-apex-white-dim">Trend Index</span>
              <span className="text-apex-gold font-mono">{card.trend_index.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-apex-white-dim">Minted</span>
              <span className="text-apex-white font-mono">{card.minted_count}/{card.minting_supply}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-apex-white-dim">Card ID</span>
              <span className="text-apex-white-dim font-mono text-[10px]">{card.card_id}</span>
            </div>
            <div className="pt-2 border-t border-apex-black-border">
              <p className="text-[10px] text-apex-gold">Click to view chart</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
