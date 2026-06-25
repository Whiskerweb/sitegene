import { describe, it, expect } from "vitest";
import { FALLBACK, FALLBACK_BY_TRADE, pickFallbackTopics } from "./criteria";

describe("fallbacks de critères exportés", () => {
  it("FALLBACK générique : ≥ 5 sujets valides", () => {
    expect(FALLBACK.length).toBeGreaterThanOrEqual(5);
    for (const t of FALLBACK) {
      expect(t.tip).toBeTruthy();
      expect(t.keywords.length).toBeGreaterThan(0);
    }
  });

  it("chaque métier connu a un jeu de sujets dédié", () => {
    for (const tr of ["musicien", "fitness", "coach", "bien-etre", "photographe", "artisan", "restaurant", "beaute", "conseil"] as const) {
      const set = FALLBACK_BY_TRADE[tr];
      expect(set, tr).toBeTruthy();
      expect(set!.length, tr).toBeGreaterThanOrEqual(4);
    }
  });

  it("un musicien n'est jamais interrogé sur sa « clientèle / zone »", () => {
    const tips = FALLBACK_BY_TRADE.musicien!.map((t) => t.tip.toLowerCase()).join(" ");
    expect(tips).not.toMatch(/client|zone d'intervention/);
  });

  it("pickFallbackTopics : métier connu → son set, sinon générique", () => {
    expect(pickFallbackTopics("artisan")).toBe(FALLBACK_BY_TRADE.artisan);
    expect(pickFallbackTopics("musicien")).toBe(FALLBACK_BY_TRADE.musicien);
    expect(pickFallbackTopics("autre")).toBe(FALLBACK);
  });
});
