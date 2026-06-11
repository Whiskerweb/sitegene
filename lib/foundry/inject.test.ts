// lib/foundry/inject.test.ts
import { describe, it, expect } from "vitest";
import { injectContacts } from "./inject";
import type { Recipe } from "./types";
import type { Collected } from "./link-catalog";

function baseRecipe(): Recipe {
  return {
    vibe: "ocean-confiance",
    sections: [
      { component: "hero-split-asym", content: { title: "T", cta: "Me contacter", ctaHref: "#contact" } },
      { component: "contact-block", content: { phone: "", email: "", address: "" } },
      { component: "gallery-mosaic", content: { images: ["x", "y", "z"] } },
      { component: "footer-giant-brand", content: { brand: "B", socials: [] } },
    ],
  };
}

const empty: Collected = { socials: [], contact: {}, photos: [] };

describe("injectContacts", () => {
  it("ne touche à rien si rien n'est collecté", () => {
    const out = injectContacts(baseRecipe(), empty);
    expect(out).toEqual(baseRecipe());
  });

  it("remplit les socials du footer", () => {
    const out = injectContacts(baseRecipe(), {
      ...empty,
      socials: [{ platform: "instagram", href: "https://instagram.com/a" }],
    });
    const footer = out.sections.find((s) => s.component === "footer-giant-brand")!;
    expect(footer.content.socials).toEqual([{ platform: "instagram", href: "https://instagram.com/a" }]);
  });

  it("remplit le contact-block (phone/email/address)", () => {
    const out = injectContacts(baseRecipe(), {
      ...empty,
      contact: { phone: "tel:+33611", email: "mailto:a@b.fr", address: "Lyon" },
    });
    const c = out.sections.find((s) => s.component === "contact-block")!;
    expect(c.content.phone).toBe("tel:+33611");
    expect(c.content.email).toBe("mailto:a@b.fr");
    expect(c.content.address).toBe("Lyon");
  });

  it("branche le lien de réservation sur le ctaHref du hero", () => {
    const out = injectContacts(baseRecipe(), {
      ...empty,
      booking: { label: "Réserver", href: "https://calendly.com/x" },
    });
    const hero = out.sections.find((s) => s.component === "hero-split-asym")!;
    expect(hero.content.ctaHref).toBe("https://calendly.com/x");
  });

  it("remplit les images d'une galerie dans l'ordre, sans dépasser les slots", () => {
    const out = injectContacts(baseRecipe(), {
      ...empty,
      photos: ["p1", "p2"],
    });
    const g = out.sections.find((s) => s.component === "gallery-mosaic")!;
    expect(g.content.images).toEqual(["p1", "p2", "z"]); // 2 remplacées, la 3e conservée
  });

  it("ne mute pas la recette d'entrée", () => {
    const recipe = baseRecipe();
    const snapshot = JSON.stringify(recipe);
    injectContacts(recipe, { ...empty, socials: [{ platform: "x", href: "h" }] });
    expect(JSON.stringify(recipe)).toBe(snapshot);
  });
});
