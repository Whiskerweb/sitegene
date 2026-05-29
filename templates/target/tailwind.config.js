/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {
    fontFamily: { geist: ['Geist','sans-serif'], inter: ['Inter','sans-serif'] },
    colors: { tg: {
      bg: '#f1f1ef',
      ink: '#111113',
      mut: '#6b6b72',
      line: 'rgba(17,17,19,0.12)',
      accent: '#ff5a1f',
      dark: '#0a0a0b',
      card: '#ffffff',
    } },
  } },
  plugins: [],
}
