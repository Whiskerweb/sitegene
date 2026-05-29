/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        poto: {
          red: '#E5412A',
          yellow: '#FFC400',
          orange: '#F15A24',
          purple: '#8B7CF6',
          lavender: '#A99BE8',
          ink: '#111111',
        },
      },
    },
  },
  plugins: [],
}
