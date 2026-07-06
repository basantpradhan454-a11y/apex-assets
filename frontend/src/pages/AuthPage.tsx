import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../context/store'
import api from '../api/client'
import Logo from '../components/Common/Logo'
import { Mail, Lock, User, ArrowRight } from 'lucide-react'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setAuth } = useStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = mode === 'signup' ? '/auth/signup' : '/auth/login'
      const payload = mode === 'signup' ? { email, password, username } : { email, password }
      const { data } = await api.post(endpoint, payload)
      setAuth(data.token, data.user)
      navigate('/dashboard')
    } catch (err: any) {
      // Fallback to demo auth for frontend-only mode
      const demoUser = {
        id: 'usr_' + Math.random().toString(36).substr(2, 9),
        username: username || email.split('@')[0] || 'Collector',
        email,
        role: 'demo_user' as const,
        is_kyc_verified: false,
        virtual_balance: 10000,
        real_wallet_balance: 0,
        tenant_id: null,
        created_at: new Date().toISOString(),
      }
      setAuth('demo_token_' + Date.now(), demoUser)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-apex-black flex items-center justify-center px-6 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.06) 0%, transparent 60%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="card-surface p-8">
          <div className="flex gap-2 mb-6 bg-apex-black-card p-1 rounded-lg">
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'signup' ? 'bg-apex-gold text-apex-black' : 'text-apex-white-dim'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'login' ? 'bg-apex-gold text-apex-black' : 'text-apex-white-dim'
              }`}
            >
              Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-xs text-apex-white-dim mb-1.5 block">Username</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-apex-white-dim" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="CollectorName"
                    required
                    className="w-full bg-apex-black-card border border-apex-black-border rounded-lg pl-10 pr-4 py-3 text-sm text-apex-white focus:gold-border focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs text-apex-white-dim mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-apex-white-dim" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-apex-black-card border border-apex-black-border rounded-lg pl-10 pr-4 py-3 text-sm text-apex-white focus:gold-border focus:outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-apex-white-dim mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-apex-white-dim" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-apex-black-card border border-apex-black-border rounded-lg pl-10 pr-4 py-3 text-sm text-apex-white focus:gold-border focus:outline-none transition-all"
                />
              </div>
            </div>

            {error && <p className="text-xs text-apex-red">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold py-3 rounded-lg text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Loading...' : mode === 'signup' ? 'Create Account' : 'Login'}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-xs text-apex-white-dim text-center mt-6">
            New users get <span className="text-apex-gold font-medium">10,000 virtual credits</span> to start trading in Demo Mode.
          </p>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-xs text-apex-white-dim hover:text-apex-gold transition-colors">
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
