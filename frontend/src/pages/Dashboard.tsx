import { motion } from 'framer-motion'
import { useStore, type Coin } from '../context/store'
import { TrendingUp, TrendingDown, Wallet, Rocket, Star } from 'lucide-react'
import CoinListItem from '../components/Coins/CoinListItem'
import { useState } from 'react'
import ChartModal from '../components/Charts/ChartModal'

export default function Dashboard() {
  const { user, mode, coins, holdings } = useStore()
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null)
  const selectedCoin = coins.find((c) => c.id === selectedCoinId)

  const heldCoins = coins.filter((c) => (holdings[c.id] || 0) > 0)
  const portfolioValue = heldCoins.reduce((sum, c) => sum + (holdings[c.id] || 0) * c.market_price, 0)
  const totalChange = coins.length
    ? coins.reduce((sum, c) => sum + (c.previous_price > 0 ? ((c.market_price - c.previous_price) / c.previous_price) * 100 : 0), 0) / coins.length
    : 0

  const stats = [
    {
      label: mode === 'demo' ? 'Virtual Credits' : 'Wallet Balance',
      value: (mode === 'demo' ? user?.virtual_balance : user?.real_wallet_balance)?.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      icon: Wallet,
      accent: 'gold',
    },
    { label: 'Holdings Value', value: portfolioValue.toFixed(2), icon: Rocket, accent: 'white' },
    {
      label: 'Avg. Market Trend',
      value: `${totalChange > 0 ? '+' : ''}${totalChange.toFixed(2)}%`,
      icon: totalChange >= 0 ? TrendingUp : TrendingDown,
      accent: totalChange >= 0 ? 'green' : 'red',
    },
    { label: 'Coins Held', value: heldCoins.length.toString(), icon: Star, accent: 'gold' },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="gold-text">{user?.username}</span>
          </h1>
          {mode === 'demo' && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-apex-gold/10 text-apex-gold gold-border">DEMO MODE</span>
          )}
        </div>
        <p className="text-apex-white-dim text-sm">
          {mode === 'demo'
            ? 'Trading on the bonding curve against an AI Market Maker. Complete KYC to unlock Live Trading.'
            : 'Live trading active. All transactions are real.'}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card-surface p-5 hover:gold-glow transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg bg-apex-black-card flex items-center justify-center ${stat.accent === 'gold' ? 'gold-border' : ''}`}>
                <stat.icon
                  size={18}
                  className={
                    stat.accent === 'gold' ? 'text-apex-gold' :
                    stat.accent === 'green' ? 'text-apex-green' :
                    stat.accent === 'red' ? 'text-apex-red' : 'text-apex-white'
                  }
                />
              </div>
            </div>
            <p className="text-xs text-apex-white-dim mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${
              stat.accent === 'green' ? 'text-apex-green' :
              stat.accent === 'red' ? 'text-apex-red' :
              stat.accent === 'gold' ? 'gold-text' : 'text-apex-white'
            }`}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      <PriceTicker coins={coins} />

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">Live Coins</h2>
        <span className="text-sm text-apex-white-dim">{coins.length} coins</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {coins.map((coin, i) => (
          <motion.div key={coin.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <CoinListItem coin={coin} onClick={() => setSelectedCoinId(coin.id)} />
          </motion.div>
        ))}
      </div>

      {selectedCoin && <ChartModal coin={selectedCoin} onClose={() => setSelectedCoinId(null)} />}
    </div>
  )
}

function PriceTicker({ coins }: { coins: Coin[] }) {
  return (
    <div className="card-surface overflow-hidden mb-8">
      <div className="flex items-center gap-6 py-3 px-4 overflow-x-auto scrollbar-thin">
        <span className="text-xs text-apex-gold font-medium whitespace-nowrap">LIVE TICKER</span>
        {coins.map((coin) => {
          const change = coin.previous_price > 0 ? ((coin.market_price - coin.previous_price) / coin.previous_price) * 100 : 0
          const isUp = change >= 0
          return (
            <div key={coin.id} className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-sm text-apex-white font-medium">${coin.ticker}</span>
              <span className="text-sm text-apex-gold font-mono">
                {coin.market_price < 0.01 ? coin.market_price.toExponential(2) : coin.market_price.toFixed(4)}
              </span>
              <span className={`text-xs font-mono ${isUp ? 'text-apex-green' : 'text-apex-red'}`}>
                {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
