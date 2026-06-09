// lib/foundry/recipe.test.ts
import { describe, it, expect } from "vitest";
import { validateRecipe } from "./recipe";
import type { Recipe } from "./types";

const base: Recipe = {
  vibe: "warm-serif",
  sections: [
    { component: "footer-columns", content: { brand: "X", tagline: "t", columns: [], copyright: "c" } },
  ],
};

describe("validateRecipe", () => {
  it("valide une recette correcte", () => {
    const v = validateRecipe(base);
    expect(v.ok).toBe(true);
    expect(v.resolved).toHaveLength(1);
    expect(v.resolved[0].manifest.id).toBe("footer-columns");
  });
  it("rejette une vibe inconnue", () => {
    const v = validateRecipe({ ...base, vibe: "nope" as Recipe["vibe"] });
    expect(v.ok).toBe(false);
    expect(v.errors.join(" ")).toContain("vibe");
  });
  it("rejette un composant inconnu", () => {
    const v = validateRecipe({ ...base, sections: [{ component: "ghost", content: {} }] });
    expect(v.ok).toBe(false);
    expect(v.errors.join(" ")).toContain("composant inconnu");
  });
  it("rejette un contenu manquant", () => {
    const v = validateRecipe({ ...base, sections: [{ component: "footer-columns", content: { brand: "X" } }] });
    expect(v.ok).toBe(false);
    expect(v.errors.join(" ")).toContain("contenu manquant");
  });
  it("rejette une clé de skin non autorisée", () => {
    const v = validateRecipe({ ...base, sections: [{ component: "footer-columns", content: { brand: "X", tagline: "t", columns: [], copyright: "c" }, skin: { accent: "#000" } }] });
    expect(v.ok).toBe(false);
    expect(v.errors.join(" ")).toContain("non autorisé");
  });
  it("accepte une clé de skin autorisée", () => {
    const v = validateRecipe({ ...base, sections: [{ component: "footer-columns", content: { brand: "X", tagline: "t", columns: [], copyright: "c" }, skin: { surface: "#fff" } }] });
    expect(v.ok).toBe(true);
    expect(v.resolved).toHaveLength(1);
  });
  it("exclut de resolved une section invalide (resolved sûr même si ok=false)", () => {
    const v = validateRecipe({ ...base, sections: [{ component: "footer-columns", content: { brand: "X" } }] });
    expect(v.ok).toBe(false);
    expect(v.resolved).toHaveLength(0);
  });
});
