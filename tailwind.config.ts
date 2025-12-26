import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          blue: 'var(--brand-blue)',
          gold: 'var(--brand-gold)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          elevated: 'var(--surface-elevated)'
        }
      },
      boxShadow: {
        glow: '0 0 24px rgba(255, 215, 0, 0.25)'
      },
      backgroundImage: {
        'gold-blue-gradient': 'radial-gradient(1200px circle at 20% 0%, rgba(255, 215, 0, 0.12), transparent 40%), radial-gradient(800px circle at 80% 100%, rgba(30, 64, 175, 0.15), transparent 40%)'
      },
      keyframes: {
        'subtle-gradient': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        'sparkle': {
          '0%': { opacity: '0.2' },
          '50%': { opacity: '0.5' },
          '100%': { opacity: '0.2' }
        }
      },
      animation: {
        'subtle-gradient': 'subtle-gradient 30s ease infinite',
        'sparkle': 'sparkle 6s ease-in-out infinite'
      }
    }
  },
  plugins: [],
}

export default config
