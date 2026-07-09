import { motion } from 'framer-motion'
import { useStore } from '../context/store'
import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, Shield, CreditCard, Check, Upload, Bot } from 'lucide-react'
import { useState } from 'react'

export default function Wallet() {
  const { user, mode, trades, submitKyc } = useStore()
  const [showKycForm, setShowKycForm] = useState(false)
  const [aadhaar, setAadhaar] = useState('')
  const [pan, setPan] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [creditsAmount, setCreditsAmount] = useState(500)

  const balance = mode === 'demo' ? user?.virtual_balance : user?.real_wallet_balance
  const kycStatus = user?.kyc?.status || 'none'

  const handleKycSubmit = () => {
    if (!aadhaar || !pan || !bankAccount) return
    submitKyc({ aadhaar, pan, bank_account: bankAccount })
    setShowKycForm(false)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold mb-2"><span className="gold-text">Wallet</span></h1>
        <p className="text-apex-white-dim text-sm">Manage your credits, coin trades, and KYC verification.</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-surface p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-apex-black-card flex items-center justify-center gold-border">
                <WalletIcon size={20} className="text-apex-gold" />
              </div>
              <div>
                <p className="text-xs text-apex-white-dim">{mode === 'demo' ? 'Virtual Credits Balance' : 'Apex Credits Balance'}</p>
                <p className="text-3xl font-bold gold-text">{balance?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
            </div>
            <span className={`px-3 py-1 text-xs rounded-full ${
              mode === 'demo' ? 'bg-apex-gold/10 text-apex-gold gold-border' : 'bg-apex-green/10 text-apex-green border border-apex-green/30'
            }`}>
              {mode === 'demo' ? 'DEMO' : 'LIVE'}
            </span>
          </div>

          {user?.is_kyc_verified && (
            <div className="mt-6 pt-6 border-t border-apex-black-border">
              <p className="text-xs text-apex-white-dim mb-3">Purchase Apex Credits</p>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-apex-white-dim" />
                  <input
                    type="number"
                    value={creditsAmount}
                    onChange={(e) => setCreditsAmount(parseInt(e.target.value) || 0)}
                    className="w-full bg-apex-black-card border border-apex-black-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-apex-white focus:gold-border focus:outline-none"
                  />
                </div>
                <button className="btn-gold px-6 py-2.5 rounded-lg text-sm">Buy Credits</button>
              </div>
              <p className="text-[10px] text-apex-white-dim/50 mt-2">
                Payment processed via Razorpay / PhonePe secure gateway. Requires live gateway keys to go real.
              </p>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card-surface p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={20} className={user?.is_kyc_verified ? 'text-apex-green' : 'text-apex-white-dim'} />
            <h3 className="text-sm font-semibold">KYC Verification</h3>
          </div>

          {user?.is_kyc_verified ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-apex-green/10 flex items-center justify-center mx-auto mb-3">
                <Check size={24} className="text-apex-green" />
              </div>
              <p className="text-sm text-apex-white font-medium">Verified Trader</p>
              <p className="text-xs text-apex-white-dim mt-1">Live trading unlocked</p>
            </div>
          ) : kycStatus === 'pending' ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-apex-gold/10 flex items-center justify-center mx-auto mb-3 animate-glow-pulse">
                <Upload size={20} className="text-apex-gold" />
              </div>
              <p className="text-sm text-apex-white font-medium">KYC Under Review</p>
              <p className="text-xs text-apex-white-dim mt-1">Aadhaar + PAN + Bank submitted. Verification in 24-48 hours.</p>
            </div>
          ) : showKycForm ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Aadhaar Number"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value)}
                className="w-full bg-apex-black-card border border-apex-black-border rounded-lg px-3 py-2 text-xs text-apex-white focus:gold-border focus:outline-none"
              />
              <input
                type="text"
                placeholder="PAN Number"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
                className="w-full bg-apex-black-card border border-apex-black-border rounded-lg px-3 py-2 text-xs text-apex-white focus:gold-border focus:outline-none"
              />
              <input
                type="text"
                placeholder="Bank Account Number"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full bg-apex-black-card border border-apex-black-border rounded-lg px-3 py-2 text-xs text-apex-white focus:gold-border focus:outline-none"
              />
              <button
                onClick={handleKycSubmit}
                disabled={!aadhaar || !pan || !bankAccount}
                className="w-full btn-gold py-2.5 rounded-lg text-xs disabled:opacity-40"
              >
                Submit for Verification
              </button>
              <p className="text-[9px] text-apex-white-dim/50 text-center">
                Real Aadhaar/PAN checks need a licensed KYC vendor (e.g. DigiLocker/Signzy) — this form is captured but not yet auto-verified.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-apex-white-dim mb-4">
                Complete KYC to unlock live coin trading with real credits and payment gateway access.
              </p>
              <button onClick={() => setShowKycForm(true)} className="w-full btn-ghost py-2.5 rounded-lg text-sm inline-flex items-center justify-center gap-2">
                <Upload size={14} /> Start KYC Verification
              </button>
            </div>
          )}
        </motion.div>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="p-6 border-b border-apex-black-border flex items-center justify-between">
          <h3 className="text-sm font-semibold">Transaction History</h3>
          {mode === 'demo' && (
            <span className="flex items-center gap-1 text-[10px] text-apex-white-dim">
              <Bot size={12} className="text-apex-gold" /> Counterparty: AI Market Maker
            </span>
          )}
        </div>
        <div className="divide-y divide-apex-black-border">
          {trades.length === 0 && (
            <div className="p-8 text-center text-sm text-apex-white-dim">No trades yet — buy or sell a coin to see history here.</div>
          )}
          {trades.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-apex-black-card/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tx.type === 'buy' ? 'bg-apex-red/10' : 'bg-apex-green/10'}`}>
                  {tx.type === 'buy' ? <ArrowDownCircle size={16} className="text-apex-red" /> : <ArrowUpCircle size={16} className="text-apex-green" />}
                </div>
                <div>
                  <p className="text-sm text-apex-white font-medium">{tx.coin_name} <span className="text-apex-white-dim">${tx.ticker}</span></p>
                  <p className="text-xs text-apex-white-dim">
                    {tx.type.toUpperCase()} · {tx.coin_amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} {tx.ticker} · {tx.counterparty} · {new Date(tx.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-mono font-medium ${tx.type === 'sell' ? 'text-apex-green' : 'text-apex-red'}`}>
                  {tx.type === 'sell' ? '+' : '-'}{tx.credit_amount.toFixed(2)}
                </p>
                <p className="text-xs text-apex-white-dim">{tx.mode}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-apex-white-dim/60 text-center mt-8">
        Apex Assets is a digital collectible marketplace. Coins are virtual and intended for
        entertainment purposes only, holding no external financial value.
      </p>
    </div>
  )
}
