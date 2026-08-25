import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        espresso: '#24150F',
        'deep-brown': '#3A2116',
        terracotta: '#963D20',
        'warm-clay': '#A94A28',
        cream: '#F5EDE0',
        ivory: '#FBF7F0',
        gold: '#D7A83D',
        'muted-gold': '#B88B35',
        'glass-white': 'rgba(255, 255, 255, 0.10)',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"DM Serif Display"', 'serif'],
        sans: ['Manrope', '"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
