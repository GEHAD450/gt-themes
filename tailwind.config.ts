import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0a0f',
          card: 'rgba(255,255,255,0.03)',
          elevated: 'rgba(255,255,255,0.05)',
        },
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
      },
      fontFamily: {
        sans: ['var(--font-cairo)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      animation: {
        'fade-up': 'fade-up 0.8s ease forwards',
        'float': 'float 6s ease-in-out infinite',
        'blob': 'blob 20s ease-in-out infinite',
        'gradient': 'gradient 5s ease infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0) rotate(-1deg)' },
          '50%': { transform: 'translateY(-15px) rotate(1deg)' },
        },
        'blob': {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(50px,-50px) scale(1.1)' },
          '66%': { transform: 'translate(-30px,30px) scale(0.95)' },
        },
        'gradient': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { 'box-shadow': '0 0 80px rgba(167,139,250,0.5)' },
          '50%': { 'box-shadow': '0 0 120px rgba(167,139,250,0.8)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
