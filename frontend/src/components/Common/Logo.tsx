interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
}

export default function Logo({ size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-lg', sub: 'text-[10px]' },
    md: { icon: 'w-10 h-10', text: 'text-xl', sub: 'text-xs' },
    lg: { icon: 'w-16 h-16', text: 'text-3xl', sub: 'text-sm' },
  }
  const s = sizes[size]

  return (
    <div className="flex items-center gap-3">
      <div className={`${s.icon} relative flex items-center justify-center`}>
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <defs>
            <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E8C84B" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#A8862B" />
            </linearGradient>
          </defs>
          <path
            d="M20 4 L36 36 L20 28 L4 36 Z"
            fill="url(#gold-grad)"
            stroke="url(#gold-grad)"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <h1 className={`${s.text} font-bold tracking-tight gold-text leading-none`}>
          APEX ASSETS
        </h1>
        <p className={`${s.sub} text-apex-white-dim tracking-[0.3em] uppercase mt-0.5`}>
          Collect · Trade · Own
        </p>
      </div>
    </div>
  )
}
