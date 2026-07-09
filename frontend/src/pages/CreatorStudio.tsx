import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Rocket, Check } from 'lucide-react'
import { useStore, CURVE_INITIAL_CREDIT_RESERVE, CURVE_INITIAL_COIN_RESERVE } from '../context/store'

export default function CreatorStudio() {
  const { user, mode, launchCoin, remixDesign, setRemixDesign } = useStore()
  const [name, setName] = useState('')
  const [ticker, setTicker] = useState('')
  const [description, setDescription] = useState('')
  const [creatorTag, setCreatorTag] = useState(user?.username || '')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [launching, setLaunching] = useState(false)
  const [launched, setLaunched] = useState(false)
  const [launchedTicker, setLaunchedTicker] = useState('')

  // Load a design picked from the Design Gallery's "Remix" button
  useEffect(() => {
    if (remixDesign) {
      setName(remixDesign.name)
      setImagePreview(remixDesign.image_url)
      setRemixDesign(null)
    }
  }, [remixDesign, setRemixDesign])

  const startPrice = CURVE_INITIAL_CREDIT_RESERVE / CURVE_INITIAL_COIN_RESERVE

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setImagePreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleLaunch = async () => {
    if (!name || !ticker) return
    setLaunching(true)
    setLaunched(false)
    await new Promise((r) => setTimeout(r, 900))

    const coin = launchCoin({
      name,
      ticker,
      image_url: imagePreview || 'https://picsum.photos/seed/' + name + '/400/400',
      description,
      creator_tag: creatorTag || 'Anonymous',
    })

    setLaunchedTicker(coin.ticker)
    setLaunched(true)
    setLaunching(false)
  }

  const resetForm = () => {
    setName('')
    setTicker('')
    setDescription('')
    setImagePreview(null)
    setLaunched(false)
    setLaunchedTicker('')
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Coin <span className="gold-text">Launchpad</span></h1>
        <p className="text-apex-white-dim text-sm">
          Launch a coin instantly — pump.fun style. It goes live on a bonding curve immediately, no manual pricing.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="card-surface p-6 space-y-5">
          <div>
            <label className="text-xs text-apex-white-dim mb-2 block">Coin Image</label>
            <label className="block">
              <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                imagePreview ? 'border-apex-gold/40' : 'border-apex-black-border hover:border-apex-gold/30'
              }`}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-full" />
                ) : (
                  <>
                    <Upload size={28} className="mx-auto mb-3 text-apex-white-dim" />
                    <p className="text-sm text-apex-white-dim">Click to upload coin image or GIF</p>
                    <p className="text-xs text-apex-white-dim/50 mt-1">PNG, JPG, GIF up to 5MB</p>
                  </>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>

          <div>
            <label className="text-xs text-apex-white-dim mb-1.5 block">Coin Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Golden Ape Genesis"
              className="w-full bg-apex-black-card border border-apex-black-border rounded-lg px-4 py-2.5 text-sm text-apex-white focus:gold-border focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-apex-white-dim mb-1.5 block">Ticker</label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase().slice(0, 8))}
              placeholder="e.g. GAPE"
              className="w-full bg-apex-black-card border border-apex-black-border rounded-lg px-4 py-2.5 text-sm text-apex-white font-mono focus:gold-border focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-apex-white-dim mb-1.5 block">Creator Tag</label>
            <input
              type="text"
              value={creatorTag}
              onChange={(e) => setCreatorTag(e.target.value)}
              placeholder="@creator"
              className="w-full bg-apex-black-card border border-apex-black-border rounded-lg px-4 py-2.5 text-sm text-apex-white focus:gold-border focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-apex-white-dim mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this coin about?"
              rows={2}
              className="w-full bg-apex-black-card border border-apex-black-border rounded-lg px-4 py-2.5 text-sm text-apex-white focus:gold-border focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="bg-apex-black-card rounded-lg p-4 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-apex-white-dim">Total Supply</span>
              <span className="text-apex-white font-mono">1,000,000,000</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-apex-white-dim">Starting Price</span>
              <span className="text-apex-white font-mono">{startPrice.toExponential(3)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-apex-white-dim">Pricing Model</span>
              <span className="text-apex-gold">Constant-product bonding curve</span>
            </div>
          </div>

          <button
            onClick={handleLaunch}
            disabled={!name || !ticker || launching}
            className="w-full btn-gold py-3 rounded-lg text-sm inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {launching ? <>Launching...</> : launched ? <><Check size={16} /> Launched</> : <><Rocket size={16} /> {mode === 'demo' ? 'Launch Demo Coin' : 'Launch Coin'}</>}
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm text-apex-white-dim font-medium">Live Preview</h3>
          <div className="card-surface overflow-hidden max-w-sm mx-auto">
            <div className="relative h-56 bg-apex-black-card flex items-center justify-center">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-32 h-32 rounded-full object-cover gold-border" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-apex-black flex items-center justify-center gold-border">
                  <Rocket size={28} className="text-apex-white-dim/30" />
                </div>
              )}
              {mode === 'demo' && (
                <div className="absolute top-2 left-2">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-apex-gold/20 text-apex-gold gold-border">DEMO</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-apex-white">{name || 'Coin Name'}</h3>
                <span className="text-xs text-apex-gold font-mono">${ticker || 'TICKER'}</span>
              </div>
              <p className="text-xs text-apex-white-dim mb-2 line-clamp-2">{description || 'Coin description...'}</p>
              <div className="flex items-center justify-between text-xs text-apex-white-dim">
                <span>Price: {startPrice.toExponential(2)}</span>
                <span>by {creatorTag || 'Unknown'}</span>
              </div>
            </div>
          </div>

          {launched && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-surface p-4 text-center">
              <Check size={24} className="mx-auto mb-2 text-apex-green" />
              <p className="text-sm text-apex-white font-medium">${launchedTicker} launched — live in Dashboard & Marketplace!</p>
              <button onClick={resetForm} className="btn-ghost mt-3 px-4 py-2 rounded-lg text-xs">
                Launch Another Coin
              </button>
            </motion.div>
          )}

          <div className="card-surface p-4">
            <p className="text-[10px] text-apex-white-dim/60 text-center">
              Apex Assets is a digital collectible marketplace. Coins are virtual and intended
              for entertainment purposes only, holding no external financial value.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
