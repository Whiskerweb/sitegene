import { describe, it, expect } from "vitest";
import {
  buildPhotoMap,
  intakeToOverrides,
  photoSlotUrls,
  PHOTO_PLACEHOLDER_URL,
} from "./intake-map";
import { recommendTemplateForIntake } from "./onboarding-config";

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

describe("buildPhotoMap — jamais une photo de démo sur le site construit", () => {
  const slots = ["demo/h.jpg", "demo/s1.jpg", "demo/s2.jpg", "demo/g1.jpg", "demo/g2.jpg"];

  it("cycle les photos client sur TOUS les slots", () => {
    const map = buildPhotoMap(slots, ["c1.jpg", "c2.jpg"]);
    expect(map).toEqual({
      "demo/h.jpg": "c1.jpg",
      "demo/s1.jpg": "c2.jpg",
      "demo/s2.jpg": "c1.jpg",
      "demo/g1.jpg": "c2.jpg",
      "demo/g2.jpg": "c1.jpg",
    });
  });
  it("assez de photos → mapping 1:1 sans répétition", () => {
    const urls = ["a", "b", "c", "d", "e"];
    const map = buildPhotoMap(slots, urls);
    expect(Object.values(map)).toEqual(urls);
  });
  it("0 photo + placeholder → tous les slots neutralisés", () => {
    const map = buildPhotoMap(slots, [], PHOTO_PLACEHOLDER_URL);
    expect(Object.values(map)).toEqual(slots.map(() => PHOTO_PLACEHOLDER_URL));
  });
  it("0 photo sans placeholder (outreach) → démo conservée", () => {
    expect(buildPhotoMap(slots, [], null)).toEqual({});
    expect(buildPhotoMap(slots, [])).toEqual({});
  });
});

describe("recommendTemplateForIntake — le style que « l'IA » propose", () => {
  it("mariage l'emporte sur les autres spécialités", () => {
    expect(
      recommendTemplateForIntake({ eventTypes: ["portrait", "mariage"] }, "alice-r"),
    ).toBe("luxury-wedding");
  });
  it("portrait → portrait-fineart", () => {
    expect(recommendTemplateForIntake({ eventTypes: ["portrait"] }, "alice-r")).toBe(
      "portrait-fineart",
    );
  });
  it("spécialité inconnue → photographer-freelance", () => {
    expect(recommendTemplateForIntake({ eventTypes: ["autre"] }, "alice-r")).toBe(
      "photographer-freelance",
    );
  });
  it("aucune réponse → repli sur le template phare fourni", () => {
    expect(recommendTemplateForIntake({}, "alice-r")).toBe("alice-r");
  });
});

/* [3.3] Recommandation étendue aux nouvelles catégories. */
describe("recommendTemplateForIntake — musicien & artisan", () => {
  it("musicien : le genre choisit l'univers", () => {
    expect(
      recommendTemplateForIntake({ categoryId: "musicien", genre: "techno mélodique" }, "jazz-vocalist"),
    ).toBe("dj-electro");
    expect(
      recommendTemplateForIntake({ categoryId: "musicien", genre: "rap français" }, "jazz-vocalist"),
    ).toBe("hiphop-producer");
  });

  it("musicien sans genre : repli catégorie", () => {
    expect(recommendTemplateForIntake({ categoryId: "musicien" }, "jazz-vocalist")).toBe(
      "jazz-vocalist",
    );
  });

  it("artisan : le corps de métier choisit le template", () => {
    expect(
      recommendTemplateForIntake(
        { categoryId: "artisan", trade: "Électricien : tableaux, dépannage" },
        "cleaning-services",
      ),
    ).toBe("electrician-pro");
    expect(
      recommendTemplateForIntake({ categoryId: "artisan", trade: "ébéniste" }, "cleaning-services"),
    ).toBe("multi-trade");
  });
});
