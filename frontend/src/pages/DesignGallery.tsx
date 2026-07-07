import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Wand2, Flame, Check } from 'lucide-react'
import { useStore, type DesignTemplate } from '../context/store'

const filters: (DesignTemplate['category'] | 'All')[] = ['All', 'Luxury', 'Minimalist', 'Business', 'Personal', 'Trending']

export default function DesignGallery() {
  const { designs, setRemixDesign } = useStore()
  const [filter, setFilter] = useState<DesignTemplate['category'] | 'All'>('All')
  const [selected, setSelected] = useState<DesignTemplate | null>(null)
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  const filtered = filter === 'All' ? designs : designs.filter((d) => d.category === filter)

  const handleRemix = (design: DesignTemplate) => {
    setRemixDesign(design)
    navigate('/studio')
  }

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Design <span className="gold-text">Gallery</span></h1>
        <p className="text-apex-white-dim text-sm">
          Browse {designs.length}+ AI-generated card designs. Click any design to see its exact prompt, or hit Remix to customize it yourself.
        </p>
      </motion.div>

      <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-thin">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all ${
              filter === f ? 'bg-apex-gold text-apex-black' : 'bg-apex-black-card text-apex-white-dim border border-apex-black-border hover:text-apex-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((design, i) => (
          <motion.div
            key={design.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => setSelected(design)}
            className="card-surface overflow-hidden cursor-pointer group hover:gold-glow transition-all duration-300"
          >
            <div className="relative h-56 bg-apex-black-card overflow-hidden">
              <img
                src={design.image_url}
                alt={design.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-apex-black to-transparent" />
              {design.category === 'Trending' && (
                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-apex-black/80 text-apex-gold text-[10px] font-medium">
                  <Flame size={10} /> Trending
                </div>
              )}
              <div className="absolute bottom-2 right-2 text-[10px] text-apex-white-dim bg-apex-black/70 px-2 py-0.5 rounded-full">
                {design.uses} remixes
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-apex-white truncate">{design.name}</p>
              <p className="text-xs text-apex-white-dim">{design.category}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Prompt Transparency Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <div className="absolute inset-0 bg-apex-black/70 backdrop-blur-md" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-lg glass-modal rounded-2xl overflow-hidden"
            >
              <div className="relative h-64">
                <img src={selected.image_url} alt={selected.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-apex-black via-transparent to-transparent" />
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-apex-black/60 text-apex-white hover:bg-apex-black transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-apex-white">{selected.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full gold-border text-apex-gold">{selected.category}</span>
                </div>

                <p className="text-xs text-apex-white-dim mb-2">AI Prompt Used</p>
                <div className="bg-apex-black-card border border-apex-black-border rounded-lg p-4 mb-4">
                  <p className="text-xs text-apex-white-dim font-mono leading-relaxed">{selected.prompt}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => copyPrompt(selected.prompt)}
                    className="flex-1 btn-ghost py-2.5 rounded-lg text-sm inline-flex items-center justify-center gap-2"
                  >
                    {copied ? <Check size={14} className="text-apex-green" /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy Prompt'}
                  </button>
                  <button
                    onClick={() => handleRemix(selected)}
                    className="flex-1 btn-gold py-2.5 rounded-lg text-sm inline-flex items-center justify-center gap-2"
                  >
                    <Wand2 size={14} /> Remix This Design
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
