import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// `base` rend les URLs d'assets absolues sous /_templates/target/.
export default defineConfig({ base: '/_templates/target/', plugins: [react()] })
