/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        surface: '#111111',
        elevated: '#1a1a1a',
        border: '#222222',
        accent: '#00c896',
        purple: '#7c3aed',
      }
    },
  },
  plugins: [],
}