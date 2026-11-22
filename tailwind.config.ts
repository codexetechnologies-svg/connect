import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0B3B60',
          emerald: '#16A34A',
          emeraldSoft: '#22C55E',
          background: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          amber: '#D97706',
          red: '#DC2626'
        }
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans Variable', 'Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      boxShadow: {
        soft: '0 12px 24px rgba(11, 59, 96, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;
