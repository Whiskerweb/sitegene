// lib/foundry/hero-router.test.ts
import { describe, expect, it } from "vitest";
import { resolveHero, heroOptionsForTrade, isExcludedForTrade } from "./hero-router";
import { getManifest } from "./manifests";
import type { TradeId } from "./da-personas";

const TRADES: TradeId[] = [
  "coach", "bien-etre", "photographe", "artisan", "restaurant",
  "beaute", "conseil", "musicien", "fitness", "autre",
];

describe("resolveHero", () => {
  it("hero par défaut adapté au métier", () => {
    expect(resolveHero("musicien", "")).toBe("jazz-vocalist-hero");
    expect(resolveHero("photographe", "")).toBe("studio-portfolio-hero");
    expect(resolveHero("artisan", "")).toBe("electrician-pro-hero");
    expect(resolveHero("coach", "")).toBe("hero-split-asym");
  });

  it("la DA override le hero du métier", () => {
    expect(resolveHero("musicien", "rock-brutalist")).toBe("creative-portfolio-hero");
    expect(resolveHero("musicien", "rap-luxe")).toBe("bold-stack-hero");
    expect(resolveHero("photographe", "warm-serif")).toBe("luxury-wedding-hero");
  });

  it("vibe inconnue ou custom → défaut du métier", () => {
    expect(resolveHero("musicien", "custom")).toBe("jazz-vocalist-hero");
    expect(resolveHero("photographe", "vibe-inexistante")).toBe("studio-portfolio-hero");
  });

  it("tous les heroes résolus existent dans le catalogue", () => {
    for (const trade of TRADES) {
      const id = resolveHero(trade, "");
      expect(getManifest(id), `hero ${id} (${trade})`).toBeTruthy();
      expect(getManifest(id)?.role).toBe("hero");
    }
  });
});

describe("heroOptionsForTrade", () => {
  it("le recommandé est en tête, sans doublon", () => {
    const options = heroOptionsForTrade("musicien", "rap-luxe");
    expect(options[0]).toBe("bold-stack-hero");
    expect(new Set(options).size).toBe(options.length);
  });
});

describe("isExcludedForTrade", () => {
  it("les heroes hors-contexte sont exclus", () => {
    expect(isExcludedForTrade("jazz-vocalist-hero", "hero", "photographe")).toBe(true);
    expect(isExcludedForTrade("electrician-pro-hero", "hero", "musicien")).toBe(true);
    expect(isExcludedForTrade("jazz-vocalist-hero", "hero", "musicien")).toBe(false);
  });

  it("hero-split-asym (généraliste) reste disponible pour tous", () => {
    for (const trade of TRADES) {
      expect(isExcludedForTrade("hero-split-asym", "hero", trade)).toBe(false);
    }
  });

  it("les sections plumber-only sont réservées aux artisans", () => {
    expect(isExcludedForTrade("plumber-pro-services", "services", "musicien")).toBe(true);
    expect(isExcludedForTrade("plumber-pro-services", "services", "artisan")).toBe(false);
  });

  it("les sections génériques ne sont jamais exclues", () => {
    expect(isExcludedForTrade("faq-accordion", "faq", "musicien")).toBe(false);
    expect(isExcludedForTrade("gallery-mosaic", "gallery", "artisan")).toBe(false);
  });

  it("chaque métier garde au moins un hero et une navbar non exclus", () => {
    for (const trade of TRADES) {
      const heroes = heroOptionsForTrade(trade, "").filter((id) => !isExcludedForTrade(id, "hero", trade));
      expect(heroes.length, `heroes ${trade}`).toBeGreaterThan(0);
      const navbarOk = ["glass-pill-navbar", "app-bar-navbar", "ink-bar-navbar", "wordmark-navbar"]
        .some((id) => !isExcludedForTrade(id, "navbar", trade));
      expect(navbarOk, `navbar ${trade}`).toBe(true);
    }
  });
});
