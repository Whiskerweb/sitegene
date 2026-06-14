import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Garde DA : un composant du catalogue ne doit JAMAIS coder une couleur CSS
// solide en dur — sinon il n'adapte pas la direction artistique (et peut rendre
// du texte illisible sous une DA sombre/à accent vif). On exige les vars
// sémantiques (var(--c-…)).
//
// Tolérés (couleurs non « de surface » / décoratives) : rgba(), color-mix(),
// dégradés (linear/radial-gradient), box/text-shadow, fallbacks var(--x, #fff),
// attributs SVG (fill="#…"/stroke="#…", stop-color) — non captés ici à dessein.
const DIR = join(process.cwd(), "components/foundry/components");
const SOLID = /(background|background-color|color|border-color)\s*:\s*["']?#[0-9a-fA-F]{3,6}\b/g;

const FILES = readdirSync(DIR).filter((f) => f.endsWith(".tsx")).sort();

describe("pas de couleur CSS solide en dur dans tout le catalogue de composants", () => {
  for (const f of FILES) {
    it(f, () => {
      const src = readFileSync(join(DIR, f), "utf8");
      const hits = (src.match(SOLID) ?? []).filter((h) => !h.includes("var("));
      expect(hits, `${f} — couleurs solides en dur (utiliser var(--c-…)) : ${hits.join(", ")}`).toEqual([]);
    });
  }
});
