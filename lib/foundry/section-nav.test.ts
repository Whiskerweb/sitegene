// lib/foundry/section-nav.test.ts
import { describe, it, expect } from "vitest";
import { buildSectionNav, sectionAnchorId, navbarCtaHref } from "./section-nav";
import type { Recipe } from "./types";

function recipe(components: string[]): Recipe {
  return { vibe: "ocean-confiance", sections: components.map((component) => ({ component, content: {} })) };
}

describe("sectionAnchorId", () => {
  it("ancre les sections de contenu, pas la navbar/hero/footer", () => {
    expect(sectionAnchorId("contact-block")).toBe("contact");
    expect(sectionAnchorId("faq-accordion")).toBe("faq");
    expect(sectionAnchorId("gallery-mosaic")).toBe("galerie");
    expect(sectionAnchorId("hero-split-asym")).toBeNull();
    expect(sectionAnchorId("footer-giant-brand")).toBeNull();
  });

  it("libellés métier fins par composant (musicien)", () => {
    expect(sectionAnchorId("release-grid")).toBe("musique");
    expect(sectionAnchorId("tour-dates")).toBe("concerts");
  });
});

describe("buildSectionNav", () => {
  it("dérive des liens #ancre pour les sections présentes, dans l'ordre", () => {
    const nav = buildSectionNav(recipe(["hero-drop", "artist-statement", "tour-dates", "release-grid", "gallery-mosaic", "footer-giant-brand"]));
    expect(nav).toEqual([
      { label: "À propos", href: "#apropos" },
      { label: "Concerts", href: "#concerts" },
      { label: "Musique", href: "#musique" },
      { label: "Galerie", href: "#galerie" },
    ]);
  });

  it("dédoublonne par ancre et exclut la CTA (pilule) du menu", () => {
    const nav = buildSectionNav(recipe(["intro-split", "services-rows", "booking-cta", "contact-block"]));
    // intro-split=about→apropos, services→services, booking-cta=cta (exclu), contact→contact
    expect(nav.map((l) => l.href)).toEqual(["#apropos", "#services", "#contact"]);
  });

  it("plafonne le nombre de liens", () => {
    const nav = buildSectionNav(recipe(["intro-split", "services-rows", "gallery-mosaic", "testimonials-carousel", "pricing-cards", "faq-accordion", "contact-block"]), 5);
    expect(nav).toHaveLength(5);
  });

  it("aucune section ancrable → menu vide", () => {
    expect(buildSectionNav(recipe(["hero-split-asym", "footer-giant-brand"]))).toEqual([]);
  });
});

describe("navbarCtaHref", () => {
  it("pointe vers la section de réservation puis le contact", () => {
    expect(navbarCtaHref(recipe(["hero-drop", "booking-cta", "footer-giant-brand"]))).toBe("#reserver");
    expect(navbarCtaHref(recipe(["hero-split-asym", "contact-block"]))).toBe("#contact");
    expect(navbarCtaHref(recipe(["hero-split-asym", "footer-giant-brand"]))).toBeNull();
  });
});
