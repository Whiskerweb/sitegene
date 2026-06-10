// lib/foundry/suggest.test.ts
import { describe, it, expect } from "vitest";
import { detectTrade, suggestVibes } from "./suggest";
import { getVibe } from "./vibes";

describe("detectTrade", () => {
  it("détecte les métiers principaux", () => {
    expect(detectTrade("Je suis coach en développement personnel à Lyon")).toBe("coach");
    expect(detectTrade("Plombier chauffagiste, dépannage et rénovation")).toBe("artisan");
    expect(detectTrade("Photographe de mariage en Bretagne")).toBe("photographe");
    expect(detectTrade("Studio de yoga et méditation")).toBe("bien-etre");
    expect(detectTrade("Restaurant bistronomique au centre de Bordeaux")).toBe("restaurant");
    expect(detectTrade("Salon de coiffure et barbier")).toBe("beaute");
    expect(detectTrade("Consultant en stratégie pour PME")).toBe("conseil");
  });
  it("retombe sur 'autre' sans signal", () => {
    expect(detectTrade("Je vends des choses sur internet")).toBe("autre");
    expect(detectTrade("")).toBe("autre");
  });
});

describe("suggestVibes", () => {
  it("renvoie 3 vibes existantes, distinctes, avec une raison", () => {
    for (const brief of ["coach de vie", "électricien à Nantes", "n'importe quoi"]) {
      const s = suggestVibes(brief);
      expect(s).toHaveLength(3);
      expect(new Set(s.map((x) => x.vibeId)).size).toBe(3);
      for (const { vibeId, reason } of s) {
        expect(getVibe(vibeId)).toBeDefined();
        expect(reason.length).toBeGreaterThan(10);
      }
    }
  });
});
