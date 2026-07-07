import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../../context/store'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Store,
  Palette,
  Wallet,
  LogOut,
  Image,
  Video,
} from 'lucide-react'
import Logo from './Logo'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/marketplace', label: 'Marketplace', icon: Store },
  { path: '/studio', label: 'Creator Studio', icon: Palette },
  { path: '/gallery', label: 'Design Gallery', icon: Image },
  { path: '/feed', label: 'Portfolio Feed', icon: Video },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
]

export default function Layout() {
  const { user, logout, mode, setMode } = useStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-apex-black flex">
      {/* Sidebar */}
      <aside className="w-64 fixed left-0 top-0 h-full glass border-r border-apex-black-border flex flex-col z-50">
        <div className="p-6 border-b border-apex-black-border">
          <Logo size="md" />
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-apex-black-card text-apex-gold gold-border'
                    : 'text-apex-white-dim hover:text-apex-white hover:bg-apex-black-card/50'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Mode Toggle */}
        <div className="p-4 border-t border-apex-black-border">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-xs text-apex-white-dim font-medium">Trading Mode</span>
            <div className="flex bg-apex-black-card rounded-lg p-0.5 border border-apex-black-border">
              <button
                onClick={() => setMode('demo')}
                className={`px-3 py-1 text-xs rounded-md transition-all ${
                  mode === 'demo' ? 'bg-apex-gold text-apex-black font-semibold' : 'text-apex-white-dim'
                }`}
              >
                Demo
              </button>
              <button
                onClick={() => setMode('live')}
                disabled={!user?.is_kyc_verified}
                className={`px-3 py-1 text-xs rounded-md transition-all ${
                  mode === 'live' ? 'bg-apex-gold text-apex-black font-semibold' : 'text-apex-white-dim'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                Live
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center justify-between px-2 py-2">
            <div>
              <p className="text-sm font-medium text-apex-white">{user?.username}</p>
              <p className="text-xs text-apex-white-dim">
                {user?.is_kyc_verified ? 'Verified Trader' : 'Demo User'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-apex-white-dim hover:text-apex-red transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        {mode === 'demo' && <div className="demo-watermark">DEMO</div>}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}
