import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const FILES = [
  "PlumberProHero","PlumberModernHero","PlumberEmergencyHero",
  "PlumberProNavbar","PlumberModernNavbar","PlumberEmergencyNavbar",
  "PlumberProFooter","FooterColumns",
];
// #fff/#000 etc. tolérés UNIQUEMENT dans rgba()/gradient/shadow. On interdit
// les `color:#xxx` / `background:#xxx` solides hors var().
const SOLID = /(background|background-color|color)\s*:\s*#[0-9a-fA-F]{3,6}\b/g;

describe("pas de couleur solide en dur (hero/navbar/footer catalogue)", () => {
  for (const f of FILES) {
    it(f, () => {
      const src = readFileSync(join(process.cwd(), "components/foundry/components", `${f}.tsx`), "utf8");
      const hits = (src.match(SOLID) ?? []).filter((h) => !h.includes("var("));
      expect(hits, `couleurs solides en dur: ${hits.join(", ")}`).toEqual([]);
    });
  }
});
