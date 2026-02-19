/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: '#819983', // 🌿 Verde Salvia
        sand: '#fef7ef', // 🏜️ Arena Cálida
        deep: '#273b51', // 🌊 Azul Profundo
      },
    },
  },
  plugins: [],
};