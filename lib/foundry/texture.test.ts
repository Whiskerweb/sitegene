import { describe, it, expect } from "vitest";
import { textureBackground, textureLayerStyle } from "./texture";
import { getVibe } from "./vibes";

describe("texture", () => {
  it("aucune texture → pas de calque", () => {
    expect(textureBackground("none")).toBe("");
    expect(textureBackground(undefined)).toBe("");
    expect(textureLayerStyle("none")).toBeNull();
  });
  it("chaque texture déclarée produit un background non vide", () => {
    for (const t of ["grain", "grid", "glow", "gradient-mesh"] as const) {
      expect(textureBackground(t).length).toBeGreaterThan(0);
      const s = textureLayerStyle(t);
      expect(s).not.toBeNull();
      expect(s!.opacity).toBeGreaterThan(0);
    }
  });
  it("les textures dérivent des vars de la DA (accent/border)", () => {
    expect(textureBackground("glow")).toContain("var(--c-accent)");
    expect(textureBackground("grid")).toContain("var(--c-border)");
  });
  it("les DA curées référencent des textures valides", () => {
    for (const id of ["rock-brutalist", "auralis-neural", "coach-performance", "restaurant-nocturne"] as const) {
      const t = getVibe(id)!.texture;
      // doit être une texture connue (background non vide)
      expect(textureBackground(t).length).toBeGreaterThan(0);
    }
  });
});
