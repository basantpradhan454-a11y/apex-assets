import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import CoinListItem from '../components/Coins/CoinListItem'
import ChartModal from '../components/Charts/ChartModal'
import { useStore } from '../context/store'

const sortOptions = ['Trending', 'Newest', 'Market Cap: High', 'Market Cap: Low', 'Bonding %']
const statusFilters = ['All', 'Bonding', 'Graduated']

export default function Marketplace() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('Trending')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null)
  const { coins: allCoins } = useStore()

  let coins = allCoins.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.ticker.toLowerCase().includes(search.toLowerCase()) ||
    c.creator_tag.toLowerCase().includes(search.toLowerCase())
  )

  if (statusFilter === 'Bonding') coins = coins.filter((c) => !c.is_graduated)
  if (statusFilter === 'Graduated') coins = coins.filter((c) => c.is_graduated)

  coins = [...coins].sort((a, b) => {
    switch (sortBy) {
      case 'Newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'Market Cap: High': return (b.market_price * b.total_supply) - (a.market_price * a.total_supply)
      case 'Market Cap: Low': return (a.market_price * a.total_supply) - (b.market_price * b.total_supply)
      case 'Bonding %': return b.credits_raised - a.credits_raised
      default: {
        const changeA = a.previous_price > 0 ? (a.market_price - a.previous_price) / a.previous_price : 0
        const changeB = b.previous_price > 0 ? (b.market_price - b.previous_price) / b.previous_price : 0
        return changeB - changeA
      }
    }
  })

  const selectedCoin = coins.find((c) => c.id === selectedCoinId)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold mb-2"><span className="gold-text">Marketplace</span></h1>
        <p className="text-apex-white-dim text-sm">
          Discover coins launched by creators, trading live on the bonding curve — pump.fun style.
        </p>
      </motion.div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-apex-white-dim" />
          <input
            type="text"
            placeholder="Search by name, ticker, or creator..."
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
        {statusFilters.map((r) => (
          <button
            key={r}
            onClick={() => setStatusFilter(r)}
            className={`px-4 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all ${
              statusFilter === r
                ? 'bg-apex-gold text-apex-black'
                : 'bg-apex-black-card text-apex-white-dim border border-apex-black-border hover:text-apex-white'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {coins.map((coin, i) => (
          <motion.div key={coin.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <CoinListItem coin={coin} onClick={() => setSelectedCoinId(coin.id)} />
          </motion.div>
        ))}
      </div>

      {coins.length === 0 && (
        <div className="text-center py-20">
          <p className="text-apex-white-dim">No coins found matching your filters.</p>
        </div>
      )}

      <p className="text-[10px] text-apex-white-dim/60 text-center mt-12">
        Apex Assets is a digital collectible marketplace. Coins are virtual and intended for
        entertainment purposes only, holding no external financial value.
      </p>

      {selectedCoin && <ChartModal coin={selectedCoin} onClose={() => setSelectedCoinId(null)} />}
    </div>
  )
}
