# Potozon — Experience Photography

Hero éditorial coloré pour photographe (catégorie `photographers`).
React + TS + Vite + Tailwind + Framer Motion + Lucide. Police Plus Jakarta Sans.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Structure

- `src/components/` — `Navbar`, `Hero` (titre + stickers), `Gallery` (cartes teintées + « OurGallery »)
- `src/data/content.ts` — nav, textes, cartes (couleur DA + rotation)
- `public/img/` — photos bundlées (loremflickr, libres), teintées via `mix-blend-luminosity`

Spec : `../../../docs/superpowers/specs/2026-05-29-photographers-category-design.md`
