// lib/foundry/manifests.test.ts
import { describe, it, expect } from "vitest";
import { MANIFESTS, getManifest, listManifests } from "./manifests";
import { SAMPLES, getSample } from "./samples";

/** Socle historique : il doit toujours être présent (recettes en base s'y réfèrent). */
const CORE_IDS = [
  "contact-block", "cta-banner", "faq-accordion", "footer-columns", "hero-split-asym",
  "intro-split", "logo-marquee", "pricing-cards", "process-steps",
  "reviews-postit-carousel", "services-rows", "stats-countup", "testimonials-carousel",
];

describe("manifests", () => {
  it("contient toujours le socle historique", () => {
    const ids = new Set(listManifests().map((m) => m.id));
    for (const id of CORE_IDS) expect(ids.has(id), `socle manquant : ${id}`).toBe(true);
  });

  it("propose plusieurs formes pour la catégorie reviews (au moins common + rare)", () => {
    const rarities = new Set(listManifests().filter((m) => m.role === "reviews").map((m) => m.rarity));
    expect(rarities.has("common")).toBe(true);
    expect(rarities.has("rare")).toBe(true);
  });

  it("chaque manifest est cohérent", () => {
    for (const m of listManifests()) {
      expect(m.description.length, m.id).toBeGreaterThan(10);
      expect(m.whenToUse.length, m.id).toBeGreaterThan(0);
      expect(m.vibes, m.id).toContain("warm-serif");
      expect(m.contentKeys.length, m.id).toBeGreaterThan(0);
      expect(["common", "rare", "epic"], m.id).toContain(m.rarity);
      expect(m.role.length, m.id).toBeGreaterThan(0);
      expect(m.id).toBe(getManifest(m.id)!.id);
    }
  });

  it("chaque manifest a un sample couvrant TOUTES ses contentKeys (et inversement)", () => {
    for (const m of listManifests()) {
      const sample = getSample(m.id);
      expect(Object.keys(sample).length, `sample manquant : ${m.id}`).toBeGreaterThan(0);
      for (const k of m.contentKeys) {
        expect(k in sample, `${m.id} : contentKey '${k}' absente du sample`).toBe(true);
      }
    }
    // Pas de sample orphelin (id sans manifest) — symptôme d'un module mal câblé.
    for (const id of Object.keys(SAMPLES)) {
      expect(getManifest(id), `sample orphelin : ${id}`).toBeDefined();
    }
  });

  it("les ids sont uniques entre socle et library (pas d'écrasement silencieux)", () => {
    const ids = listManifests().map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Object.keys(MANIFESTS).length).toBe(ids.length);
  });
});
