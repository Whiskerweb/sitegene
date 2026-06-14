import { describe, it, expect } from "vitest";
import { rankVibesForTrade } from "./da-personas";
import { VIBE_IDS } from "./vibes";

describe("rankVibesForTrade", () => {
  it("classe TOUTES les vibes (jamais de perte)", () => {
    const r = rankVibesForTrade("musicien", "rap");
    expect(r.length).toBe(VIBE_IDS.length);
    expect(new Set(r.map((x) => x.vibeId)).size).toBe(VIBE_IDS.length);
  });
  it("met une DA pertinente en tête selon le sous-persona", () => {
    expect(rankVibesForTrade("musicien", "rap")[0].vibeId).toBe("rap-luxe");
    expect(rankVibesForTrade("musicien", "rock")[0].vibeId).toBe("rock-brutalist");
    expect(rankVibesForTrade("musicien", "contemporain")[0].vibeId).toBe("contemporain-editorial");
    expect(rankVibesForTrade("photographe")[0].vibeId).toBe("photographe-galerie");
    expect(rankVibesForTrade("restaurant")[0].vibeId).toBe("restaurant-nocturne");
    expect(rankVibesForTrade("fitness")[0].vibeId).toBe("coach-performance");
  });
  it("marque les 3 premières comme recommandées", () => {
    const r = rankVibesForTrade("photographe");
    expect(r.slice(0, 3).every((x) => x.recommended)).toBe(true);
    expect(r[3].recommended).toBe(false);
    expect(r[0].reason.length).toBeGreaterThan(8);
  });
  it("donne au moins 3 recommandations aux métiers principaux", () => {
    for (const trade of ["fitness","coach","bien-etre","photographe","restaurant","musicien","conseil","artisan","beaute"] as const) {
      const rec = rankVibesForTrade(trade).filter((x) => x.recommended);
      expect(rec.length).toBeGreaterThanOrEqual(3);
    }
  });
});
