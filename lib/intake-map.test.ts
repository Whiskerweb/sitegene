import { describe, it, expect } from "vitest";
import { intakeToOverrides, photoSlotUrls } from "./intake-map";

/* ---- Lignée HTML (clone-site) : contenu PLAT, manifest type cleaning-services */
const HTML_CONTENT = {
  brand: "Neatly",
  meta: { title: "Neatly" },
  topbar: { phone: "+1 403", email: "hello@neatly.com" },
  hero: {
    title: "Local Cleaning",
    tagline: "We clean so you don't have to",
    image: "/_templates/cleaning-services/img/hero.jpg",
  },
  services: {
    items: [
      { title: "Eco", image: "/_templates/cleaning-services/img/s1.jpg" },
      { title: "Deep", image: "/_templates/cleaning-services/img/s2.jpg" },
    ],
  },
  testimonials: {
    items: [{ quote: "Great", avatar: "/_templates/cleaning-services/img/a1.jpg" }],
  },
  footer: { email: "hello@neatly.com" },
};

const HTML_MANIFEST = {
  fields: {
    editable: [
      { path: "brand", type: "text", maxLen: 40 },
      { path: "hero.title", type: "text", maxLen: 64 },
      { path: "hero.tagline", type: "text", maxLen: 120 },
      { path: "topbar.email", type: "text", maxLen: 80 },
      { path: "footer.email", type: "text", maxLen: 80 },
      { path: "topbar.phone", type: "text", maxLen: 40 },
      { path: "services.items[].title", type: "text", maxLen: 40 },
    ],
  },
  photos: [
    { slot: "p1", path: "hero.image", role: "hero", required: true },
    { slot: "p2", path: "services.items[].image", role: "image", required: true },
    { slot: "p3", path: "testimonials.items[].avatar", role: "avatar" },
  ],
};

/* ---- Lignée SPA : contenu v2 multi-pages, manifest type alice-r */
const SPA_CONTENT = {
  version: 2,
  site: { brand: "Alice R", footer: { email: "alice@x.com" } },
  pages: [
    {
      slug: "/",
      type: "home",
      content: {
        hero: { brand: "Alice R", subtitle: "Sub" },
        services: [{ name: "Portrait" }, { name: "Weddings" }],
        footer: { email: "alice@x.com" },
      },
    },
  ],
};

const SPA_MANIFEST = {
  fields: {
    editable: [
      { path: "hero.brand", type: "text", maxLen: 24 },
      { path: "hero.subtitle", type: "textarea", maxLen: 140 },
      { path: "services[].name", type: "text", maxLen: 40 },
      { path: "footer.email", type: "text", maxLen: 80 },
    ],
  },
};

const INTAKE = {
  brand: "Studio Camille",
  about: "Lumière naturelle, émotions vraies.",
  contactEmail: "camille@studio.fr",
  eventTypes: ["mariage", "portrait"],
};

describe("intakeToOverrides — lignée HTML (plat)", () => {
  const out = intakeToOverrides(INTAKE, HTML_CONTENT, HTML_MANIFEST);

  it("cible le nom de marque à plat", () => {
    expect(out["brand"]).toBe("Studio Camille");
  });
  it("pose l'accroche sur hero.tagline", () => {
    expect(out["hero.tagline"]).toBe("Lumière naturelle, émotions vraies.");
  });
  it("pose l'email sur tous les emplacements email", () => {
    expect(out["topbar.email"]).toBe("camille@studio.fr");
    expect(out["footer.email"]).toBe("camille@studio.fr");
  });
  it("mappe les spécialités sur services.items[i].title", () => {
    expect(out["services.items[0].title"]).toBe("Mariage");
    expect(out["services.items[1].title"]).toBe("Portrait");
  });
  it("ne pose jamais un chemin inexistant", () => {
    for (const p of Object.keys(out)) expect(p).not.toContain("scrollText");
  });
});

describe("intakeToOverrides — lignée SPA (v2)", () => {
  const out = intakeToOverrides(INTAKE, SPA_CONTENT as never, SPA_MANIFEST);

  it("préfixe les chemins par pages[i].content", () => {
    expect(out["pages[0].content.hero.brand"]).toBe("Studio Camille");
    expect(out["pages[0].content.services[0].name"]).toBe("Mariage");
  });
  it("pose la marque sur le shell site.brand", () => {
    expect(out["site.brand"]).toBe("Studio Camille");
  });
});

describe("photoSlotUrls — slots catégorisés par rôle", () => {
  it("hero d'abord, avatars exclus, ordre stable", () => {
    const slots = photoSlotUrls(HTML_CONTENT, "cleaning-services", HTML_MANIFEST);
    expect(slots[0]).toBe("/_templates/cleaning-services/img/hero.jpg");
    expect(slots).toContain("/_templates/cleaning-services/img/s1.jpg");
    expect(slots).not.toContain("/_templates/cleaning-services/img/a1.jpg");
  });
  it("repli scan brut sans manifest.photos (lignée SPA)", () => {
    const content = {
      pages: [{ content: { img: "/_templates/alice-r/img/p1.jpg" } }],
    };
    expect(photoSlotUrls(content, "alice-r", null)).toEqual([
      "/_templates/alice-r/img/p1.jpg",
    ]);
  });
});
