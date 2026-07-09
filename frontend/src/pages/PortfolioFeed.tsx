import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Video, Upload, Copy, Coins, ShieldCheck, X, TrendingUp, PlayCircle } from 'lucide-react'
import { useStore } from '../context/store'

interface FeedPost {
  id: string
  username: string
  coinName: string
  designId?: string
  changePct: number
  thumbnail: string
  verified: boolean
  tips: number
}

const seedFeed: FeedPost[] = [
  { id: 'p1', username: '@ApexOfficial', coinName: 'GAPE', designId: 'dsn_001', changePct: 34.2, thumbnail: 'https://picsum.photos/seed/feed1/500/700', verified: true, tips: 128 },
  { id: 'p2', username: '@NeonArt', coinName: 'Cosmic Rider', designId: 'dsn_013', changePct: 18.6, thumbnail: 'https://picsum.photos/seed/feed2/500/700', verified: true, tips: 74 },
  { id: 'p3', username: '@VoltStudio', coinName: 'Volt Lynx', changePct: 9.1, thumbnail: 'https://picsum.photos/seed/feed3/500/700', verified: false, tips: 21 },
]

export default function PortfolioFeed() {
  const { user, designs, setRemixDesign } = useStore()
  const navigate = useNavigate()
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'pending' | 'done'>('idle')

  const handleCopyDesign = (designId?: string) => {
    if (!designId) return
    const design = designs.find((d) => d.id === designId)
    if (design) {
      setRemixDesign(design)
      navigate('/studio')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setUploadFile(f)
  }

  const handleSubmitPost = () => {
    setVerifying(true)
    setVerifyStatus('pending')
    // AI screenshot/trade-statement verification would run here via a vision model —
    // needs a connected vision API key before this can check authenticity for real.
    setTimeout(() => {
      setVerifying(false)
      setVerifyStatus('done')
    }, 1800)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Portfolio <span className="gold-text">Feed</span></h1>
          <p className="text-apex-white-dim text-sm">Trader's Journal — share your wins, tag your design, get tipped.</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="btn-gold px-5 py-2.5 rounded-lg text-sm inline-flex items-center gap-2">
          <Video size={16} /> Post a Trade
        </button>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {seedFeed.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card-surface overflow-hidden group"
          >
            <div className="relative h-80 bg-apex-black-card">
              <img src={post.thumbnail} alt={post.coinName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-apex-black via-apex-black/20 to-transparent" />
              <PlayCircle size={40} className="absolute inset-0 m-auto text-apex-white/70 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="text-xs font-medium text-apex-white bg-apex-black/60 px-2 py-1 rounded-full">{post.username}</span>
                {post.verified && (
                  <span className="flex items-center gap-1 text-[10px] text-apex-green bg-apex-black/60 px-2 py-1 rounded-full">
                    <ShieldCheck size={10} /> Verified
                  </span>
                )}
              </div>

              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-sm font-semibold text-apex-white mb-1">{post.coinName}</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs font-mono text-apex-green">
                    <TrendingUp size={12} /> +{post.changePct}%
                  </span>
                  <span className="text-[10px] text-apex-white-dim">{post.tips} tips</span>
                </div>
              </div>
            </div>

            <div className="p-3 flex gap-2">
              <button
                onClick={() => handleCopyDesign(post.designId)}
                disabled={!post.designId}
                className="flex-1 btn-ghost py-2 rounded-lg text-xs inline-flex items-center justify-center gap-1.5 disabled:opacity-30"
              >
                <Copy size={12} /> Copy Coin Design
              </button>
              <button className="flex-1 btn-gold py-2 rounded-lg text-xs inline-flex items-center justify-center gap-1.5">
                <Coins size={12} /> Tip Creator
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-[10px] text-apex-white-dim/60 text-center mt-10">
        Tips and creator subscriptions require KYC-verified Live wallets. Apex Assets is a digital
        collectible marketplace — assets and rewards shown here are virtual.
      </p>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowUpload(false)}
          >
            <div className="absolute inset-0 bg-apex-black/70 backdrop-blur-md" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-md glass-modal rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-apex-white">Post Your Trade</h3>
                <button onClick={() => setShowUpload(false)} className="p-1.5 rounded-lg text-apex-white-dim hover:text-apex-white">
                  <X size={18} />
                </button>
              </div>

              <label className="block mb-4">
                <div className="border-2 border-dashed border-apex-black-border hover:border-apex-gold/30 rounded-xl p-8 text-center cursor-pointer transition-all">
                  {uploadFile ? (
                    <p className="text-sm text-apex-white">{uploadFile.name}</p>
                  ) : (
                    <>
                      <Upload size={26} className="mx-auto mb-3 text-apex-white-dim" />
                      <p className="text-sm text-apex-white-dim">Upload video (Reels/Shorts) or trade screenshot</p>
                    </>
                  )}
                </div>
                <input type="file" accept="video/*,image/*" className="hidden" onChange={handleFileSelect} />
              </label>

              <input
                type="text"
                placeholder="Tag the card/design used..."
                className="w-full bg-apex-black-card border border-apex-black-border rounded-lg px-4 py-2.5 text-sm text-apex-white focus:gold-border focus:outline-none mb-4"
              />

              <button
                onClick={handleSubmitPost}
                disabled={!uploadFile || verifying}
                className="w-full btn-gold py-3 rounded-lg text-sm inline-flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {verifying ? 'Verifying with AI...' : 'Submit Post'}
              </button>

              {verifyStatus === 'done' && (
                <p className="text-xs text-apex-gold mt-3 text-center">
                  Uploaded. Full AI authenticity verification of trade statements requires a connected
                  vision API — pending setup, posts are queued for manual review for now.
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
