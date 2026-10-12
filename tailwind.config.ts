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
        evergreen: 'var(--evergreen)',
        grey: 'var(--grey)',
        'alabaster-grey': 'var(--alabaster-grey)',
        'emerald-depths': 'var(--emerald-depths)',
        'deep-crimson': 'var(--deep-crimson)',
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
        glow: '0 0 24px color-mix(in srgb, var(--alabaster-grey) 25%, transparent)'
      },
      backgroundImage: {
        'gold-blue-gradient': 'radial-gradient(1200px circle at 20% 0%, color-mix(in srgb, var(--emerald-depths) 45%, transparent), transparent 40%), radial-gradient(800px circle at 80% 100%, color-mix(in srgb, var(--deep-crimson) 28%, transparent), transparent 40%)'
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
