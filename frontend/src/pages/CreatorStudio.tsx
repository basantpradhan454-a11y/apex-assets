import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Plus, Zap, Check } from 'lucide-react'
import { useStore } from '../context/store'
import api from '../api/client'

export default function CreatorStudio() {
  const { user, mode } = useStore()
  const [name, setName] = useState('')
  const [supply, setSupply] = useState(10)
  const [rarity, setRarity] = useState(50)
  const [creatorTag, setCreatorTag] = useState(user?.username || '')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [minting, setMinting] = useState(false)
  const [minted, setMinted] = useState(false)
  const [mintedCardId, setMintedCardId] = useState('')

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setImagePreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleMint = async () => {
    if (!name) return
    setMinting(true)
    setMinted(false)

    try {
      const { data } = await api.post('/cards/mint', {
        name,
        minting_supply: supply,
        rarity_score: rarity,
        creator_tag: creatorTag,
        is_demo_asset: mode === 'demo',
        image_url: imagePreview,
      })
      setMintedCardId(data.card_id || 'APEX-' + Math.random().toString(36).substr(2, 8).toUpperCase())
      setMinted(true)
    } catch {
      // Frontend-only demo mint
      await new Promise((r) => setTimeout(r, 1500))
      setMintedCardId('APEX-' + Math.random().toString(36).substr(2, 8).toUpperCase())
      setMinted(true)
    } finally {
      setMinting(false)
    }
  }

  const resetForm = () => {
    setName('')
    setSupply(10)
    setRarity(50)
    setImagePreview(null)
    setMinted(false)
    setMintedCardId('')
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">
          Creator <span className="gold-text">Studio</span>
        </h1>
        <p className="text-apex-white-dim text-sm">
          Design and mint your own digital collectible cards.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="card-surface p-6 space-y-5">
          {/* Image Upload */}
          <div>
            <label className="text-xs text-apex-white-dim mb-2 block">Card Artwork</label>
            <label className="block">
              <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                imagePreview ? 'border-apex-gold/40' : 'border-apex-black-border hover:border-apex-gold/30'
              }`}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                ) : (
                  <>
                    <Upload size={28} className="mx-auto mb-3 text-apex-white-dim" />
                    <p className="text-sm text-apex-white-dim">Click to upload image or GIF</p>
                    <p className="text-xs text-apex-white-dim/50 mt-1">PNG, JPG, GIF up to 5MB</p>
                  </>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-apex-white-dim mb-1.5 block">Card Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Card"
              className="w-full bg-apex-black-card border border-apex-black-border rounded-lg px-4 py-2.5 text-sm text-apex-white focus:gold-border focus:outline-none transition-all"
            />
          </div>

          {/* Creator Tag */}
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

          {/* Supply */}
          <div>
            <label className="text-xs text-apex-white-dim mb-2 block">
              Minting Supply: <span className="text-apex-gold font-mono">{supply}</span>
            </label>
            <input
              type="range"
              min="1"
              max="500"
              value={supply}
              onChange={(e) => setSupply(parseInt(e.target.value))}
              className="w-full accent-apex-gold"
            />
            <div className="flex justify-between text-[10px] text-apex-white-dim/50 mt-1">
              <span>1/1 Unique</span>
              <span>Limited Edition</span>
              <span>1/500 Mass</span>
            </div>
          </div>

          {/* Rarity */}
          <div>
            <label className="text-xs text-apex-white-dim mb-2 block">
              Rarity Score: <span className="text-apex-gold font-mono">{rarity}</span>
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={rarity}
              onChange={(e) => setRarity(parseInt(e.target.value))}
              className="w-full accent-apex-gold"
            />
            <div className="flex justify-between text-[10px] text-apex-white-dim/50 mt-1">
              <span>Common</span>
              <span>Epic</span>
              <span>Legendary</span>
            </div>
          </div>

          {/* Mint Button */}
          <button
            onClick={handleMint}
            disabled={!name || minting}
            className="w-full btn-gold py-3 rounded-lg text-sm inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {minting ? (
              <>Minting...</>
            ) : minted ? (
              <><Check size={16} /> Minted Successfully</>
            ) : (
              <><Zap size={16} /> Mint Card</>
            )}
          </button>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <h3 className="text-sm text-apex-white-dim font-medium">Live Preview</h3>
          <div className="card-surface overflow-hidden max-w-sm mx-auto">
            <div className="relative h-64 bg-apex-black-card">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Plus size={32} className="text-apex-white-dim/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-apex-black to-transparent" />
              <div className="absolute top-2 right-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-apex-black/80 ${
                  rarity >= 90 ? 'text-apex-gold' : rarity >= 70 ? 'text-purple-400' : rarity >= 40 ? 'text-blue-400' : 'text-apex-white-dim'
                }`}>
                  {rarity >= 90 ? 'Legendary' : rarity >= 70 ? 'Epic' : rarity >= 40 ? 'Rare' : 'Common'}
                </span>
              </div>
              {mode === 'demo' && (
                <div className="absolute top-2 left-2">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-apex-gold/20 text-apex-gold gold-border">
                    DEMO
                  </span>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-apex-white">{name || 'Card Name'}</h3>
                <span className="text-xs text-apex-gold font-mono">--.--</span>
              </div>
              <div className="flex items-center justify-between text-xs text-apex-white-dim">
                <span>0/{supply} minted</span>
                <span>by {creatorTag || 'Unknown'}</span>
              </div>
            </div>
          </div>

          {minted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-surface p-4 text-center"
            >
              <Check size={24} className="mx-auto mb-2 text-apex-green" />
              <p className="text-sm text-apex-white font-medium">Card minted successfully!</p>
              <p className="text-xs text-apex-gold font-mono mt-1">Card ID: {mintedCardId}</p>
              <button
                onClick={resetForm}
                className="btn-ghost mt-3 px-4 py-2 rounded-lg text-xs"
              >
                Mint Another Card
              </button>
            </motion.div>
          )}

          <div className="card-surface p-4">
            <p className="text-[10px] text-apex-white-dim/60 text-center">
              Apex Assets is a digital collectible marketplace. Assets are virtual and intended
              for entertainment purposes only, holding no external financial value.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
