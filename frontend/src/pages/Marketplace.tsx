import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import TradeCardItem from '../components/Cards/TradeCardItem'
import ChartModal from '../components/Charts/ChartModal'
import { useStore } from '../context/store'

const sortOptions = ['Trending', 'Newest', 'Price: High', 'Price: Low', 'Rarest']
const rarityFilters = ['All', 'Legendary', 'Epic', 'Rare', 'Common']

export default function Marketplace() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('Trending')
  const [rarityFilter, setRarityFilter] = useState('All')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const { cards: allCards } = useStore()

  let cards = allCards.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.creator_tag.toLowerCase().includes(search.toLowerCase())
  )

  if (rarityFilter !== 'All') {
    cards = cards.filter((c) => {
      const r =
        c.rarity_score >= 90 ? 'Legendary' :
        c.rarity_score >= 70 ? 'Epic' :
        c.rarity_score >= 40 ? 'Rare' : 'Common'
      return r === rarityFilter
    })
  }

  cards = [...cards].sort((a, b) => {
    switch (sortBy) {
      case 'Newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'Price: High': return b.market_price - a.market_price
      case 'Price: Low': return a.market_price - b.market_price
      case 'Rarest': return b.rarity_score - a.rarity_score
      default:
        return b.trend_index - a.trend_index
    }
  })

  const selectedCard = cards.find((c) => c.id === selectedCardId)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold mb-2"><span className="gold-text">Marketplace</span></h1>
        <p className="text-apex-white-dim text-sm">
          Discover, collect, and trade unique digital cards from creators worldwide.
        </p>
      </motion.div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-apex-white-dim" />
          <input
            type="text"
            placeholder="Search cards or creators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-apex-black-card border border-apex-black-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-apex-white focus:gold-border focus:outline-none transition-all"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-apex-black-card border border-apex-black-border rounded-lg px-4 py-2.5 text-sm text-apex-white focus:gold-border focus:outline-none cursor-pointer"
        >
          {sortOptions.map((opt) => (
            <option key={opt} value={opt} className="bg-apex-black-card">{opt}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-thin">
        {rarityFilters.map((r) => (
          <button
            key={r}
            onClick={() => setRarityFilter(r)}
            className={`px-4 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all ${
              rarityFilter === r
                ? 'bg-apex-gold text-apex-black'
                : 'bg-apex-black-card text-apex-white-dim border border-apex-black-border hover:text-apex-white'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {cards.map((card, i) => (
          <motion.div key={card.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <TradeCardItem card={card} onClick={() => setSelectedCardId(card.id)} />
          </motion.div>
        ))}
      </div>

      {cards.length === 0 && (
        <div className="text-center py-20">
          <p className="text-apex-white-dim">No cards found matching your filters.</p>
        </div>
      )}

      <p className="text-[10px] text-apex-white-dim/60 text-center mt-12">
        Apex Assets is a digital collectible marketplace. Assets are virtual and intended for
        entertainment purposes only, holding no external financial value.
      </p>

      {selectedCard && <ChartModal card={selectedCard} onClose={() => setSelectedCardId(null)} />}
    </div>
  )
}
