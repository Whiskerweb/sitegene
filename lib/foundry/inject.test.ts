// lib/foundry/inject.test.ts
import { describe, it, expect } from "vitest";
import { injectContacts, emailDisplay, phoneDisplay } from "./inject";
import type { Recipe } from "./types";
import type { Collected } from "./link-catalog";

function baseRecipe(): Recipe {
  return {
    vibe: "ocean-confiance",
    sections: [
      { component: "hero-split-asym", content: { title: "T", cta: "Me contacter", ctaHref: "#contact" } },
      { component: "contact-block", content: { phone: "", email: "", address: "", ctaHref: "#top" } },
      { component: "gallery-mosaic", content: { images: ["x", "y", "z"] } },
      { component: "cta-banner", content: { title: "Allez-y", cta: "Contact", ctaHref: "#contact" } },
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

  it("PURGE les socials d'exemple quand le client n'en a fourni aucun", () => {
    const recipe = baseRecipe();
    recipe.sections[4].content.socials = [
      { platform: "instagram", href: "https://instagram.com/exemple" },
      { platform: "facebook", href: "https://facebook.com/exemple" },
    ];
    const out = injectContacts(recipe, empty);
    expect(out.sections[4].content.socials).toEqual([]);
  });

  it("remplit le contact-block en valeurs AFFICHABLES (mailto/tel retirés)", () => {
    const out = injectContacts(baseRecipe(), {
      ...empty,
      contact: { phone: "tel:+33612345678", email: "mailto:a@b.fr", address: "Lyon" },
    });
    const c = out.sections.find((s) => s.component === "contact-block")!;
    expect(c.content.phone).toBe("06 12 34 56 78");
    expect(c.content.email).toBe("a@b.fr");
    expect(c.content.address).toBe("Lyon");
  });

  it("vide les coordonnées NON fournies (jamais de faux e-mail d'exemple)", () => {
    const recipe = baseRecipe();
    recipe.sections[1].content.email = "bonjour@exemple.fr";
    recipe.sections[1].content.phone = "+33 1 23 45 67 89";
    const out = injectContacts(recipe, { ...empty, contact: { address: "Paris" } });
    const c = out.sections.find((s) => s.component === "contact-block")!;
    expect(c.content.email).toBe("");
    expect(c.content.phone).toBe("");
    expect(c.content.address).toBe("Paris");
  });

  it("remplace les coordonnées d'exemple des colonnes du footer (ou les retire)", () => {
    const recipe = baseRecipe();
    recipe.sections[4].content.columns = [
      { title: "Contact", links: ["bonjour@exemple.fr", "+33 1 23 45 67 89", "Accueil"] },
    ];
    const out = injectContacts(recipe, { ...empty, contact: { email: "mailto:vrai@site.fr" } });
    const cols = out.sections[4].content.columns as Array<{ links: unknown[] }>;
    expect(cols[0].links).toEqual(["vrai@site.fr", "Accueil"]); // email remplacé, faux tél retiré
  });

  it("branche le lien de réservation sur le ctaHref du hero ET des sections cta", () => {
    const out = injectContacts(baseRecipe(), {
      ...empty,
      booking: { label: "Réserver", href: "https://calendly.com/x" },
    });
    expect(out.sections.find((s) => s.component === "hero-split-asym")!.content.ctaHref).toBe("https://calendly.com/x");
    expect(out.sections.find((s) => s.component === "cta-banner")!.content.ctaHref).toBe("https://calendly.com/x");
    expect(out.sections.find((s) => s.component === "contact-block")!.content.ctaHref).toBe("https://calendly.com/x");
  });

  it("fiche technique : la section CTA devient le téléchargement (prime sur la réservation)", () => {
    const out = injectContacts(baseRecipe(), {
      ...empty,
      booking: { label: "Réserver", href: "https://calendly.com/x" },
      techRider: { href: "https://storage/site-photos/abc/rider.pdf" },
    });
    const cta = out.sections.find((s) => s.component === "cta-banner")!;
    expect(cta.content.ctaHref).toBe("https://storage/site-photos/abc/rider.pdf");
    expect(cta.content.cta).toBe("Télécharger la fiche technique");
    // le hero garde la réservation
    expect(out.sections.find((s) => s.component === "hero-split-asym")!.content.ctaHref).toBe("https://calendly.com/x");
  });

  it("remplit les images d'une galerie dans l'ordre, sans dépasser les slots", () => {
    const out = injectContacts(baseRecipe(), { ...empty, photos: ["p1", "p2"] });
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

describe("affichage des coordonnées", () => {
  it("emailDisplay / phoneDisplay", () => {
    expect(emailDisplay("mailto:a@b.fr")).toBe("a@b.fr");
    expect(emailDisplay(undefined)).toBe("");
    expect(phoneDisplay("tel:+33612345678")).toBe("06 12 34 56 78");
    expect(phoneDisplay("tel:+4915112345678")).toBe("+4915112345678");
    expect(phoneDisplay(undefined)).toBe("");
  });
});
