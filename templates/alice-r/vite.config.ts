import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// `base` rend les URLs d'assets absolues sous /_templates/alice-r/ (servies par
// la plateforme depuis public/_templates/alice-r/).
export default defineConfig({
  base: '/_templates/alice-r/',
  plugins: [react()],
})
