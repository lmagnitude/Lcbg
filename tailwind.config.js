/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#e67e22',
          glow: 'rgba(230, 126, 34, 0.3)',
          bg: 'rgba(230, 126, 34, 0.1)',
        },
        card: {
          light: '#ffffff',
          dark: '#16213e',
        },
        bg: {
          light: '#f5f6fa',
          dark: '#1a1a2e',
        },
        track: {
          light: '#ecf0f1',
          dark: '#1f2b47',
        },
        'text-primary': {
          light: '#2c3e50',
          dark: '#e0e0e0',
        },
        'text-secondary': {
          light: '#7f8c8d',
          dark: '#a0a0b0',
        },
      },
      animation: {
        'pulse-badge': 'pulse 1s infinite',
        'victory-pulse': 'victoryPulse 1s ease infinite alternate',
        'reveal-in': 'revealIn 0.4s ease',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        victoryPulse: {
          from: { transform: 'scale(1)' },
          to: { transform: 'scale(1.05)' },
        },
        revealIn: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};