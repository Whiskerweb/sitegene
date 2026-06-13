// lib/foundry/charte.test.ts
import { describe, it, expect } from "vitest";
import {
  repairCharte,
  contrast,
  luminance,
  selectChartes,
  fallbackChartes,
  vibeToSpec,
  CHARTE_FONTS,
} from "./charte";
import { VIBE_IDS } from "./vibes";
import { rankVibesForTrade, type TradeId } from "./da-personas";

const GOOD = {
  name: "Terre d'atelier",
  mood: ["chaleureux", "brut", "précis"],
  ink: "#2a211b",
  surface: "#faf6f0",
  card: "#f1eae0",
  accent: "#a05c2c",
  accent2: "#d9a36a",
  muted: "#7a716a",
  headingFont: "Fraunces",
  bodyFont: "Outfit",
  corners: "soft",
  reason: "L'argile et le bois parlent du métier.",
};

describe("repairCharte", () => {
  it("accepte une charte propre telle quelle (à la casse près)", () => {
    const v = repairCharte(GOOD);
    expect(v.id).toBe("custom");
    expect(v.label).toBe("Terre d'atelier");
    expect(v.palette.accent).toBe("#a05c2c");
    expect(v.fonts.heading).toContain("Fraunces");
    expect(v.fontHref).toContain("Fraunces");
    expect(v.fontHref).toContain("Outfit");
    expect(v.radius.card).toBe("16px");
  });

  it("répare les surfaces sombres, le noir pur et les contrastes faibles", () => {
    const v = repairCharte({ ...GOOD, surface: "#222222", ink: "#000000", muted: "#cccccc" });
    expect(luminance(v.palette.surface)).toBeGreaterThanOrEqual(0.8);
    expect(v.palette.ink).not.toBe("#000000");
    expect(contrast(v.palette.ink, v.palette.surface)).toBeGreaterThanOrEqual(6.5);
    expect(contrast(v.palette.muted, v.palette.surface)).toBeGreaterThanOrEqual(3);
  });

  it("mode light : saturation extrême tempérée ; mode dark : accent vif PRÉSERVÉ", () => {
    const light = repairCharte({ ...GOOD, accent: "#00ff00" });
    expect(light.palette.accent).not.toBe("#00ff00"); // tempéré (goût, mode clair)
    // En sombre, un accent acide est un parti pris légitime (rock, fitness…) :
    // il ne doit être ni désaturé ni assombri (le texte = --c-on-accent).
    const dark = repairCharte({ mode: "dark", surface: "#0a0a0a", card: "#161616", ink: "#f5f5f2", accent: "#e7ff1a", accent2: "#cccccc", muted: "#9a9a9a" });
    expect(dark.palette.accent).toBe("#e7ff1a");
  });

  it("remplace les fonts hors liste blanche et survit au n'importe quoi", () => {
    const v = repairCharte({ headingFont: "Comic Sans MS", bodyFont: "Inter", corners: "blob" });
    expect(v.fonts.heading).toContain("Fraunces");
    expect(v.fonts.body).toContain("Outfit");
    const garbage = repairCharte("pas un objet");
    expect(garbage.palette.surface).toMatch(/^#[0-9a-f]{6}$/);
    expect(garbage.mood).toHaveLength(3);
  });

  it("la liste blanche ne contient ni Inter en display ni serif générique", () => {
    const headings = CHARTE_FONTS.filter((f) => f.roles.includes("heading")).map((f) => f.family);
    expect(headings).not.toContain("Inter");
    expect(headings).not.toContain("Georgia");
    expect(headings).not.toContain("Times New Roman");
  });
});

describe("repairCharte dark mode", () => {
  it("preserve une surface sombre quand mode='dark'", () => {
    const vibe = repairCharte({ mode: "dark", surface: "#0a0a0a", card: "#1a1a1a", ink: "#ffffff", accent: "#E7FF1A", accent2: "#f4f4f4", muted: "#888888" });
    expect(luminance(vibe.palette.surface)).toBeLessThan(0.12);
  });

  it("ink reste clair en mode dark", () => {
    const vibe = repairCharte({ mode: "dark", surface: "#0b0b0b", card: "#181818", ink: "#f4f1ea", accent: "#D4AF37", accent2: "#c9c9c9", muted: "#9a9a9a" });
    expect(luminance(vibe.palette.ink)).toBeGreaterThan(0.5);
    expect(contrast(vibe.palette.ink, vibe.palette.surface)).toBeGreaterThan(7);
  });

  it("retourne mode='light' pour une charte normale (sans mode)", () => {
    const vibe = repairCharte({ surface: "#fafaf8", card: "#f0ede8", ink: "#191714", accent: "#3d5a80", accent2: "#8ba8c4", muted: "#6e6f72" });
    expect(vibe.mode).toBe("light");
  });

  it("le mode survit à l'aller-retour vibe → spec → repairCharte (tunnel + Atelier)", () => {
    const dark = repairCharte({ mode: "dark", surface: "#0a0a0a", card: "#1a1a1a", ink: "#ffffff", accent: "#E7FF1A", accent2: "#f4f4f4", muted: "#888888" });
    const spec = vibeToSpec(dark);
    expect(spec.mode).toBe("dark");
    const again = repairCharte(spec);
    expect(again.mode).toBe("dark");
    expect(luminance(again.palette.surface)).toBeLessThan(0.12);
  });
});

describe("selectChartes", () => {
  const INPUT = { brief: "Coach en développement personnel à Brest", businessName: "Élan Coaching" };
  const BANK = new Set<string>(VIBE_IDS as string[]);

  it("source ai : pioche EXACTEMENT les ids choisis par Mistral (jamais 'custom')", async () => {
    const { chartes, source } = await selectChartes(INPUT, async () =>
      JSON.stringify({
        selection: [
          { id: "brume-marine", reason: "Bleus apaisants." },
          { id: "terre-eglantier", reason: "Chaleur bienveillante." },
          { id: "serre-lumineuse", reason: "Croissance." },
        ],
      }),
    );
    expect(source).toBe("ai");
    expect(chartes).toHaveLength(3);
    expect(chartes.map((c) => c.vibe.id)).toEqual(["brume-marine", "terre-eglantier", "serre-lumineuse"]);
    for (const c of chartes) expect(c.vibe.id).not.toBe("custom");
  });

  it("ignore les ids inconnus et complète par le classement métier", async () => {
    const { chartes, source } = await selectChartes(INPUT, async () =>
      JSON.stringify({ selection: [{ id: "brume-marine", reason: "ok" }, { id: "n-existe-pas", reason: "x" }] }),
    );
    expect(source).toBe("ai");
    expect(chartes).toHaveLength(3);
    expect(chartes.map((c) => c.vibe.id)).not.toContain("n-existe-pas");
    for (const c of chartes) expect(BANK.has(c.vibe.id)).toBe(true);
  });

  it("respecte exclude : ni l'IA ni le repli ne re-proposent une charte déjà vue", async () => {
    const exclude = ["mindful-moments", "warm-serif", "sage-nature"];
    const { chartes } = await selectChartes(
      { ...INPUT, exclude },
      // l'IA tente de resservir une exclue + une nouvelle
      async () => JSON.stringify({ selection: [{ id: "mindful-moments", reason: "x" }, { id: "brume-marine", reason: "y" }] }),
    );
    expect(chartes).toHaveLength(3);
    for (const c of chartes) expect(exclude).not.toContain(c.vibe.id);
    expect(chartes.map((c) => c.vibe.id)).toContain("brume-marine");
  });

  it("repli classement métier si le chat échoue — uniquement des ids de la banque", async () => {
    const { chartes, source } = await selectChartes(INPUT, async () => {
      throw new Error("réseau");
    });
    expect(source).toBe("fallback");
    expect(chartes).toHaveLength(3);
    expect(chartes.map((c) => c.vibe.id)).toEqual(fallbackChartes(INPUT.brief).map((c) => c.vibe.id));
    for (const c of chartes) expect(BANK.has(c.vibe.id)).toBe(true);
  });
});

describe("banque de chartes : profondeur par métier", () => {
  const TRADES: TradeId[] = [
    "coach", "bien-etre", "photographe", "artisan", "restaurant",
    "beaute", "conseil", "musicien", "fitness",
  ];

  it("chaque métier a ≥6 chartes pertinentes (weight > 0) pour la rotation", () => {
    for (const trade of TRADES) {
      const relevant = rankVibesForTrade(trade).filter((r) => r.weight > 0);
      expect(relevant.length, `métier ${trade}`).toBeGreaterThanOrEqual(6);
    }
  });
});
