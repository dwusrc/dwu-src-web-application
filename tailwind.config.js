const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#359d49',
        secondary: {
          1: '#ddc753',
          2: '#2a6b39',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          ...defaultTheme.fontFamily.sans,
        ],
        mono: [
          'var(--font-mono)',
          ...defaultTheme.fontFamily.mono,
        ],
      },
    },
  },
  plugins: [],
}; 