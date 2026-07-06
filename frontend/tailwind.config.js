/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        apex: {
          black: '#0A0A0B',
          'black-light': '#141416',
          'black-card': '#1A1A1E',
          'black-border': '#2A2A2E',
          gold: '#D4AF37',
          'gold-light': '#E8C84B',
          'gold-dark': '#A8862B',
          'gold-dim': '#8B7220',
          white: '#F5F5F7',
          'white-dim': '#A0A0A8',
          green: '#00E676',
          red: '#FF3B3B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Clash Display', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'price-tick': 'priceTick 0.4s ease-out',
        'card-flip': 'cardFlip 0.6s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(212, 175, 55, 0.3)' },
          '50%': { boxShadow: '0 0 24px rgba(212, 175, 55, 0.6)' },
        },
        priceTick: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        cardFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #E8C84B 50%, #A8862B 100%)',
        'matte-gradient': 'linear-gradient(145deg, #0A0A0B 0%, #141416 100%)',
        'card-gradient': 'linear-gradient(145deg, #1A1A1E 0%, #0F0F12 100%)',
      },
    },
  },
  plugins: [],
}
