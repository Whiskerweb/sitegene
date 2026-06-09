// lib/foundry/manifests.test.ts
import { describe, it, expect } from "vitest";
import { MANIFESTS, getManifest, listManifests } from "./manifests";

describe("manifests", () => {
  it("contient les composants de la library", () => {
    expect(listManifests().map((m) => m.id).sort()).toEqual(
      ["footer-columns", "hero-split-asym", "reviews-postit-carousel", "services-rows", "testimonials-carousel"]
    );
  });
  it("propose plusieurs formes pour la catégorie reviews (common + rare)", () => {
    const reviews = listManifests().filter((m) => m.role === "reviews");
    expect(reviews.map((m) => m.rarity).sort()).toEqual(["common", "rare"]);
  });
  it("chaque manifest est cohérent", () => {
    for (const m of listManifests()) {
      expect(m.description.length).toBeGreaterThan(10);
      expect(m.whenToUse.length).toBeGreaterThan(0);
      expect(m.vibes).toContain("warm-serif");
      expect(m.contentKeys.length).toBeGreaterThan(0);
      expect(["common", "rare", "epic"]).toContain(m.rarity);
      expect(m.role.length).toBeGreaterThan(0);
      expect(m.id).toBe(getManifest(m.id)!.id);
    }
  });
});
