# Alice R — Photography

Hero photographe sur fond sombre grainé, avec un **arc de photos en éventail** autour
du texte central. React + TS + Vite + Tailwind + Framer Motion + Lucide. Police Hanken Grotesk.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Structure

- `src/App.tsx` — nav, texte central « Create Timeless Photos », CTA, features, galerie mobile
- `src/components/PhotoArc.tsx` — éventail de 13 photos positionnées (desktop)
- `src/data/content.ts` — positions de l'arc, textes, features
- `src/index.css` — fond dégradé sombre + grain SVG + traînée arc-en-ciel
- `public/img/` — 13 portraits bundlés (loremflickr, libres)

Spec : `../../../docs/superpowers/specs/2026-05-29-photographers-category-design.md`
