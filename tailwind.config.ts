import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#2D2D7B',
        accent: '#6C63FF',
        'accent-light': '#E8E7FF',
        success: '#0D9E75',
        'success-light': '#E0F5EF',
        slip: '#B87D0E',
        'slip-light': '#FEF3DC',
        skip: '#9CA3AF',
        surface: '#F4F4FF',
        muted: '#666666',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      borderRadius: {
        card: '20px',
        btn: '12px',
        sm: '8px',
        pill: '100px',
      },
      boxShadow: {
        card: '0 2px 20px rgba(45,45,123,0.08), 0 0 0 1px rgba(45,45,123,0.06)',
        hover: '0 8px 40px rgba(45,45,123,0.15), 0 0 0 1px rgba(45,45,123,0.1)',
        'card-slip': '0 2px 20px rgba(184,125,14,0.08), 0 0 0 1px rgba(184,125,14,0.08)',
      },
      minHeight: {
        tap: '44px',
      },
      minWidth: {
        tap: '44px',
      },
      animation: {
        'pulse-star': 'pulse-star 3s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'pulse-star': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.4)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
