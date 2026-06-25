// lib/foundry/hero-router.test.ts
import { describe, expect, it } from "vitest";
import { resolveHero, heroOptionsForTrade, isExcludedForTrade, tradeSectionHint } from "./hero-router";
import { getManifest, listManifests } from "./manifests";
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

  it("studio-portfolio-hero est disponible pour les musiciens (alternative)", () => {
    expect(isExcludedForTrade("studio-portfolio-hero", "hero", "musicien")).toBe(false);
    expect(heroOptionsForTrade("musicien", "")).toContain("studio-portfolio-hero");
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

  it("les sections génériques ne sont pas exclues hors métier ciblé", () => {
    // faq-accordion reste dispo partout SAUF pour un musicien (cf. test dédié plus bas).
    expect(isExcludedForTrade("faq-accordion", "faq", "artisan")).toBe(false);
    expect(isExcludedForTrade("gallery-mosaic", "gallery", "artisan")).toBe(false);
    expect(isExcludedForTrade("gallery-mosaic", "gallery", "musicien")).toBe(false);
  });

  it("musicien : avis clients, FAQ, process et forfaits sont exclus du catalogue", () => {
    for (const id of [
      "testimonials-carousel", "reviews-postit-carousel", "testimonials-marquee",
      "liquid-reviews-marquee", "fx-circular-reviews", "fx-stagger-reviews", "fx-shuffle-reviews",
    ]) {
      expect(isExcludedForTrade(id, "reviews", "musicien"), `${id} exclu pour musicien`).toBe(true);
      // …mais disponible pour un métier de prestataire.
      expect(isExcludedForTrade(id, "reviews", "coach"), `${id} dispo pour coach`).toBe(false);
    }
    expect(isExcludedForTrade("faq-accordion", "faq", "musicien")).toBe(true);
    expect(isExcludedForTrade("process-steps", "process", "musicien")).toBe(true);
    expect(isExcludedForTrade("pricing-cards", "pricing", "musicien")).toBe(true);
  });
});

describe("tradeSectionHint", () => {
  it("donne un indice d'usage musicien pour les sections clés", () => {
    expect(tradeSectionHint("social-clip-links", "musicien")).toMatch(/écoute|Spotify/i);
    expect(tradeSectionHint("story-timeline", "musicien")).toMatch(/concert|tournée/i);
    expect(tradeSectionHint("intro-split", "musicien")).toMatch(/bio|groupe/i);
  });
  it("aucun indice pour une section hors-sujet d'un métier", () => {
    // story-timeline / release-grid = sections d'artiste → pas d'affinité prestataire.
    expect(tradeSectionHint("story-timeline", "artisan")).toBe("");
    expect(tradeSectionHint("release-grid", "coach")).toBe("");
    // « autre » reste neutre (aucun hint).
    expect(tradeSectionHint("intro-split", "autre")).toBe("");
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

describe("TRADE_SECTION_PRIORITY étendu aux métiers prestataires", () => {
  const TRADES_P: TradeId[] = ["photographe", "artisan", "coach", "bien-etre", "fitness", "restaurant", "beaute", "conseil"];

  it("chaque métier a des indices, et tous pointent vers un id de composant EXISTANT", () => {
    const known = new Set(listManifests().map((m) => m.id));
    for (const trade of TRADES_P) {
      const hinted = listManifests().filter((m) => tradeSectionHint(m.id, trade) !== "");
      expect(hinted.length, `indices ${trade}`).toBeGreaterThanOrEqual(5);
      // (le filtre sur listManifests garantit déjà que l'id existe ; on vérifie le set par sécurité)
      for (const m of hinted) expect(known.has(m.id), `${m.id} (${trade})`).toBe(true);
    }
  });

  it("les sections signature de chaque métier sont bien taguées", () => {
    expect(tradeSectionHint("gallery-mosaic", "photographe")).toMatch(/portfolio|mosa/i);
    expect(tradeSectionHint("contact-block", "artisan")).toMatch(/devis|zone|urgence/i);
    expect(tradeSectionHint("logo-marquee", "artisan")).toMatch(/certif|RGE|Qualibat/i);
    expect(tradeSectionHint("process-steps", "coach")).toMatch(/séance|déroule|parcours/i);
    expect(tradeSectionHint("location-cards", "restaurant")).toMatch(/adresse|itin/i);
    expect(tradeSectionHint("sticky-stack-projects", "conseil")).toMatch(/référence|étude/i);
  });

  it("une section taguée PRIORITY n'est jamais EXCLUE pour le même métier (cohérence)", () => {
    for (const trade of TRADES_P) {
      for (const m of listManifests()) {
        if (tradeSectionHint(m.id, trade) !== "") {
          expect(isExcludedForTrade(m.id, m.role, trade), `${m.id} priorisé ET exclu pour ${trade}`).toBe(false);
        }
      }
    }
  });
});

describe("TRADE_SECTION_EXCLUDE conservateur", () => {
  it("restaurant & beauté excluent process-steps, mais GARDENT pricing-cards", () => {
    expect(isExcludedForTrade("process-steps", "process", "restaurant")).toBe(true);
    expect(isExcludedForTrade("process-steps", "process", "beaute")).toBe(true);
    expect(isExcludedForTrade("pricing-cards", "pricing", "restaurant")).toBe(false);
    expect(isExcludedForTrade("pricing-cards", "pricing", "beaute")).toBe(false);
  });

  it("pricing-cards reste disponible pour tous les métiers à formules", () => {
    for (const trade of ["coach", "fitness", "conseil", "photographe", "artisan", "bien-etre"] as TradeId[]) {
      expect(isExcludedForTrade("pricing-cards", "pricing", trade), trade).toBe(false);
    }
  });
});
