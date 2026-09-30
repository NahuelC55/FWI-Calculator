/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fire: {
          low: '#10b981',       // Emerald Green
          moderate: '#0ea5e9',  // Sky Blue
          high: '#eab308',      // Amber Yellow
          veryhigh: '#f97316',  // Orange
          extreme: '#ef4444',   // Red
        },
        dark: {
          bg: '#0b0f17',
          card: '#141c2b',
          border: '#233148',
          hover: '#1b263b',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
