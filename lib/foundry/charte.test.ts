// lib/foundry/charte.test.ts
import { describe, it, expect } from "vitest";
import {
  repairCharte,
  contrast,
  luminance,
  generateChartes,
  fallbackChartes,
  CHARTE_FONTS,
} from "./charte";

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

  it("plafonne la saturation et garantit un bouton accent lisible", () => {
    const v = repairCharte({ ...GOOD, accent: "#00ff00" });
    expect(contrast("#ffffff", v.palette.accent)).toBeGreaterThanOrEqual(2.5);
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

describe("generateChartes", () => {
  const INPUT = { brief: "Plombier chauffagiste à Rennes", businessName: "Breizh Plomberie" };

  it("source ai : 3 chartes réparées depuis la réponse Mistral", async () => {
    const { chartes, source } = await generateChartes(INPUT, async () =>
      JSON.stringify({ chartes: [GOOD, { ...GOOD, name: "Bleu d'eau" }, { ...GOOD, name: "Cuivre net" }] }),
    );
    expect(source).toBe("ai");
    expect(chartes).toHaveLength(3);
    expect(chartes.map((c) => c.vibe.label)).toContain("Bleu d'eau");
    for (const c of chartes) expect(c.vibe.id).toBe("custom");
  });

  it("complète avec les vibes curées si l'IA en rend moins de 3", async () => {
    const { chartes, source } = await generateChartes(INPUT, async () =>
      JSON.stringify({ chartes: [GOOD] }),
    );
    expect(source).toBe("ai");
    expect(chartes).toHaveLength(3);
    expect(chartes[1].vibe.id).not.toBe("custom"); // complété par une curée
  });

  it("repli complet si le chat échoue", async () => {
    const { chartes, source } = await generateChartes(INPUT, async () => {
      throw new Error("réseau");
    });
    expect(source).toBe("fallback");
    expect(chartes).toHaveLength(3);
    expect(chartes.map((c) => c.vibe.id)).toEqual(fallbackChartes(INPUT.brief).map((c) => c.vibe.id));
  });
});
