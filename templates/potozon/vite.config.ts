import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// `base` rend les URLs d'assets absolues sous /_templates/potozon/.
export default defineConfig({
  base: '/_templates/potozon/',
  plugins: [react()],
})
