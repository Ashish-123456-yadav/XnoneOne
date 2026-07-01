/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        paper: '#f8fafc',
        brand: '#2563eb',
        mint: '#14b8a6',
        coral: '#f97316',
      },
      borderRadius: {
        card: '8px',
      },
    },
  },
  plugins: [],
};
