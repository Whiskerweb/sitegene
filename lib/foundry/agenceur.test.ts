// lib/foundry/agenceur.test.ts
import { describe, it, expect } from "vitest";
import {
  normalizeSectionContent,
  repairRecipe,
  fallbackRecipe,
  parseAgenceurJson,
  generateRecipe,
  type AgenceurInput,
} from "./agenceur";
import { validateRecipe } from "./recipe";
import { getManifest } from "./manifests";
import { getSample } from "./samples";

const INPUT: AgenceurInput = {
  brief: "Je suis plombier chauffagiste à Rennes, dépannage et rénovation.",
  businessName: "Breizh Plomberie",
  vibeId: "ocean-confiance",
  accent: "#2456e6",
};

describe("normalizeSectionContent", () => {
  it("remplit les clés manquantes depuis le sample", () => {
    const out = normalizeSectionContent("faq-accordion", { title: "Vos questions de plomberie" });
    expect(out.title).toBe("Vos questions de plomberie");
    expect(out.eyebrow).toBe(getSample("faq-accordion").eyebrow);
    expect(Array.isArray(out.items)).toBe(true);
  });
  it("force les images sur la banque locale (l'IA n'invente pas d'URL)", () => {
    const out = normalizeSectionContent("hero-split-asym", {
      image: "https://evil.example/x.jpg",
      avatars: ["https://evil.example/a.jpg"],
    });
    expect(out.image).toBe(getSample("hero-split-asym").image);
    expect(out.avatars).toEqual(getSample("hero-split-asym").avatars);
  });
  it("répare les items d'objets (clés manquantes, avatar du sample, featured conservé)", () => {
    const out = normalizeSectionContent("pricing-cards", {
      plans: [
        { name: "Dépannage", price: "90 €", featured: true },
        { name: "Contrat entretien" },
      ],
    }) as { plans: Array<Record<string, unknown>> };
    expect(out.plans).toHaveLength(2);
    expect(out.plans[0].name).toBe("Dépannage");
    expect(out.plans[0].featured).toBe(true);
    expect(Array.isArray(out.plans[0].features)).toBe(true); // complété depuis le sample
    expect(typeof out.plans[1].price).toBe("string");
  });
  it("écarte les types invalides et tronque les textes trop longs", () => {
    const out = normalizeSectionContent("cta-banner", { title: "x".repeat(2000), cta: 42 });
    expect((out.title as string).length).toBeLessThanOrEqual(600);
    expect(out.cta).toBe(getSample("cta-banner").cta);
  });
});

describe("repairRecipe", () => {
  it("écarte l'inconnu, déduplique les rôles, garantit hero en tête et footer en queue", () => {
    const recipe = repairRecipe(
      [
        { component: "fake-component", content: {} },
        { component: "faq-accordion", content: {} },
        { component: "testimonials-carousel", content: {} },
        { component: "reviews-postit-carousel", content: {} }, // même rôle reviews → écarté
        { component: "hero-split-asym", content: {} },
      ],
      INPUT,
    );
    const ids = recipe.sections.map((s) => s.component);
    expect(ids[0]).toBe("hero-split-asym");
    expect(ids[ids.length - 1]).toBe("footer-columns"); // injecté
    expect(ids).not.toContain("fake-component");
    expect(ids).toContain("testimonials-carousel");
    expect(ids).not.toContain("reviews-postit-carousel");
    expect(validateRecipe(recipe).ok).toBe(true);
  });
  it("complète une page trop maigre et applique vibe + accent + nom", () => {
    const recipe = repairRecipe([], INPUT);
    expect(recipe.sections.length).toBeGreaterThanOrEqual(5);
    expect(recipe.vibe).toBe("ocean-confiance");
    expect(recipe.brand?.primary).toBe("#2456e6");
    const footer = recipe.sections.find((s) => s.component === "footer-columns");
    expect(footer?.content.brand).toBe("Breizh Plomberie");
    expect(validateRecipe(recipe).ok).toBe(true);
  });
  it("retombe sur warm-serif si la vibe est inconnue et ignore un accent invalide", () => {
    const recipe = repairRecipe([], { ...INPUT, vibeId: "noire-inconnue", accent: "rouge" });
    expect(recipe.vibe).toBe("warm-serif");
    expect(recipe.brand).toBeUndefined();
  });
});

describe("fallbackRecipe", () => {
  it("produit une recette valide pour chaque métier détectable", () => {
    for (const brief of [
      "coach en développement personnel",
      "plombier à Brest",
      "photographe de mariage",
      "studio de yoga",
      "restaurant à Lyon",
      "salon de coiffure",
      "consultant en stratégie",
      "autre chose",
    ]) {
      const recipe = fallbackRecipe({ ...INPUT, brief });
      const v = validateRecipe(recipe);
      expect(v.ok, v.errors.join(" | ")).toBe(true);
      expect(getManifest(recipe.sections[0].component)?.role).toBe("hero");
      expect(getManifest(recipe.sections.at(-1)!.component)?.role).toBe("footer");
    }
  });
});

describe("parseAgenceurJson", () => {
  it("parse le JSON direct et le JSON noyé dans du texte", () => {
    expect(parseAgenceurJson('{"sections":[]}')).toEqual({ sections: [] });
    expect(parseAgenceurJson('Voici :\n```json\n{"sections":[]}\n```')).toEqual({ sections: [] });
    expect(parseAgenceurJson("pas de json")).toBeNull();
  });
});

describe("generateRecipe", () => {
  it("source ai quand le chat renvoie une recette exploitable", async () => {
    const { recipe, source } = await generateRecipe(INPUT, async () =>
      JSON.stringify({
        sections: [
          { component: "hero-split-asym", content: { title: "Votre plombier à Rennes" } },
          { component: "services-rows", content: {} },
          { component: "faq-accordion", content: {} },
          { component: "contact-block", content: {} },
          { component: "footer-columns", content: {} },
        ],
      }),
    );
    expect(source).toBe("ai");
    expect(recipe.sections[0].content.title).toBe("Votre plombier à Rennes");
    expect(validateRecipe(recipe).ok).toBe(true);
  });
  it("retombe sur le fallback si le chat jette ou répond du bruit", async () => {
    const boom = await generateRecipe(INPUT, async () => {
      throw new Error("réseau");
    });
    expect(boom.source).toBe("fallback");
    expect(validateRecipe(boom.recipe).ok).toBe(true);

    const noise = await generateRecipe(INPUT, async () => "je ne sais pas");
    expect(noise.source).toBe("fallback");
    expect(validateRecipe(noise.recipe).ok).toBe(true);
  });
});
