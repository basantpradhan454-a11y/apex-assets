import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Sparkles, TrendingUp, Layers } from 'lucide-react'
import Logo from '../components/Common/Logo'

const features = [
  {
    icon: Layers,
    title: 'Mint & Create',
    desc: 'Design your own digital collectible cards with custom artwork, rarity, and supply.',
  },
  {
    icon: TrendingUp,
    title: 'Trade in Real-Time',
    desc: 'Buy, sell, and trade collectibles with live price charts and rolling tickers.',
  },
  {
    icon: Shield,
    title: 'Secure & Compliant',
    desc: 'KYC-verified trading with bank-grade security and payment gateway integration.',
  },
  {
    icon: Sparkles,
    title: 'Creator-First',
    desc: 'Multi-tenant architecture lets brands build their own branded storefronts.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-apex-black overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-apex-black-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <Link
            to="/auth"
            className="btn-gold px-6 py-2.5 rounded-lg text-sm inline-flex items-center gap-2"
          >
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        <div className="absolute inset-0 bg-matte-gradient" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(212,175,55,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(212,175,55,0.05) 0%, transparent 50%)',
          }}
        />

        <div className="relative z-10 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-1.5 rounded-full gold-border text-apex-gold text-xs font-medium mb-6 tracking-wider">
              DIGITAL COLLECTIBLE MARKETPLACE
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="gold-text">Collect.</span>{' '}
              <span className="text-apex-white">Trade.</span>{' '}
              <span className="gold-text">Own.</span>
            </h1>
            <p className="text-lg text-apex-white-dim max-w-2xl mx-auto mb-10">
              Apex Assets is a premium digital collectible marketplace where creators
              mint, trade, and showcase unique cards in a high-end trading environment.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/auth"
                className="btn-gold px-8 py-3.5 rounded-lg text-base inline-flex items-center gap-2"
              >
                Start Collecting <ArrowRight size={18} />
              </Link>
              <Link
                to="/auth"
                className="btn-ghost px-8 py-3.5 rounded-lg text-base"
              >
                Explore Marketplace
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24 px-6 bg-apex-black-light">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-16"
          >
            Built for <span className="gold-text">Creators & Collectors</span>
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-surface p-6 hover:gold-glow transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-apex-black-card flex items-center justify-center mb-4 gold-border">
                  <f.icon size={22} className="text-apex-gold" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-apex-white-dim">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <footer className="py-8 px-6 border-t border-apex-black-border text-center">
        <p className="text-xs text-apex-white-dim max-w-3xl mx-auto">
          Apex Assets is a digital collectible marketplace. Assets are virtual and
          intended for entertainment purposes only, holding no external financial value.
        </p>
      </footer>
    </div>
  )
}
