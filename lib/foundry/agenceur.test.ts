// lib/foundry/agenceur.test.ts
import { describe, it, expect } from "vitest";
import {
  normalizeSectionContent,
  sanitizeUserContent,
  adaptContent,
  repairRecipe,
  fallbackRecipe,
  parseAgenceurJson,
  buildAgenceurMessages,
  generateRecipe,
  repairSubPageSections,
  fallbackSubPageSections,
  deriveSubPageTitle,
  generateSubPage,
  type AgenceurInput,
  type SubPageInput,
} from "./agenceur";
import { getSample } from "./samples";
import { validateRecipe } from "./recipe";
import { getManifest } from "./manifests";

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

describe("sanitizeUserContent (édition manuelle)", () => {
  it("PRÉSERVE l'image et le texte choisis par le client (contrairement à l'agenceur)", () => {
    const out = sanitizeUserContent("hero-split-asym", {
      title: "Mon titre à moi",
      image: "https://cdn.akyra.io/site/abc.jpg",
      avatars: ["https://cdn.akyra.io/a1.jpg", "https://cdn.akyra.io/a2.jpg"],
    });
    expect(out.title).toBe("Mon titre à moi");
    expect(out.image).toBe("https://cdn.akyra.io/site/abc.jpg");
    expect(out.avatars).toEqual(["https://cdn.akyra.io/a1.jpg", "https://cdn.akyra.io/a2.jpg"]);
    // L'agenceur, lui, écraserait l'image par la banque :
    expect(normalizeSectionContent("hero-split-asym", { image: "https://evil/x.jpg" }).image).not.toBe(
      "https://evil/x.jpg",
    );
  });
  it("préserve les images dans les items de liste (avatars d'avis)", () => {
    const out = sanitizeUserContent("reviews-postit-carousel", {
      items: [{ text: "Top !", name: "Léa", avatar: "https://cdn.akyra.io/lea.jpg" }],
    }) as { items: Array<Record<string, unknown>> };
    expect(out.items[0].avatar).toBe("https://cdn.akyra.io/lea.jpg");
    expect(out.items[0].text).toBe("Top !");
  });
  it("retombe sur le sample quand une image est vide, garde la forme rendable", () => {
    const out = sanitizeUserContent("hero-split-asym", { image: "" });
    expect(typeof out.image).toBe("string");
    expect((out.image as string).length).toBeGreaterThan(0);
  });
});

describe("adaptContent (report sémantique au remplacement)", () => {
  it("reporte titre, texte et image entre composants à clés différentes", () => {
    // Source : un hero « plumber-pro » (title, tagline, image, eyebrow).
    const from = {
      eyebrow: "Plombiers certifiés",
      title: "Dépannage plomberie 24/7 à Rennes",
      tagline: "Une intervention rapide et soignée, jour et nuit.",
      cta: "Appeler",
      image: "https://cdn.akyra.io/mon-hero.jpg",
    };
    // Cible : hero-split-asym (badge, title, subtitle, cta, image, image2, avatars).
    const out = adaptContent("hero-split-asym", from);
    expect(out.title).toBe("Dépannage plomberie 24/7 à Rennes"); // heading → heading
    expect(out.subtitle).toBe("Une intervention rapide et soignée, jour et nuit."); // tagline → para
    expect(out.image).toBe("https://cdn.akyra.io/mon-hero.jpg"); // image → image
    // AUCUN texte d'exemple coaching ne doit fuiter dans les champs reportés.
    const coachTitle = getSample("hero-split-asym").title;
    expect(out.title).not.toBe(coachTitle);
  });
  it("titre multi-lignes : un titre simple est réparti, pas de sample étranger", () => {
    // Cible plumber-modern-hero a titleA/titleB/titleC.
    const out = adaptContent("plumber-modern-hero", { title: "Votre toiture refaite proprement" }) as Record<string, string>;
    const joined = [out.titleA, out.titleB, out.titleC].join(" ").trim();
    expect(joined.length).toBeGreaterThan(0);
    // Aucune des lignes ne reprend le sample d'origine "Tous vos besoins".
    expect(out.titleA).not.toBe(getSample("plumber-modern-hero").titleA);
  });
  it("préserve les listes de même clé (avis)", () => {
    const items = [{ text: "Super", name: "Léa", role: "Cliente", avatar: "/x.jpg" }];
    const out = adaptContent("reviews-postit-carousel", { items }) as { items: unknown[] };
    expect(out.items).toHaveLength(1);
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
      "chanteuse de jazz, concerts et album",
      "autre chose",
    ]) {
      const recipe = fallbackRecipe({ ...INPUT, brief });
      const v = validateRecipe(recipe);
      expect(v.ok, v.errors.join(" | ")).toBe(true);
      expect(getManifest(recipe.sections[0].component)?.role).toBe("hero");
      expect(getManifest(recipe.sections.at(-1)!.component)?.role).toBe("footer");
    }
  });
  it("le plan musicien est une vitrine (musique/scène) sans avis ni FAQ", () => {
    const recipe = fallbackRecipe({ ...INPUT, brief: "chanteuse de jazz, concerts et album" });
    const roles = recipe.sections.map((s) => getManifest(s.component)?.role);
    expect(roles).not.toContain("reviews");
    expect(roles).not.toContain("faq");
    expect(roles).not.toContain("pricing");
    expect(recipe.sections.map((s) => s.component)).toContain("social-clip-links");
  });
});

describe("buildAgenceurMessages (catalogue adapté au métier)", () => {
  it("musicien : catalogue sans avis/FAQ, avec indices d'usage et note de structure", () => {
    const [system, user] = buildAgenceurMessages({ ...INPUT, brief: "chanteuse de jazz à Paris, concerts et album", vibeId: "contemporain-editorial" });
    // Sections de prestataire absentes du catalogue.
    expect(system.content).not.toContain("### testimonials-carousel");
    expect(system.content).not.toContain("### faq-accordion");
    // Indice d'usage musicien injecté dans le catalogue.
    expect(system.content).toContain("→ ADAPTÉ À CE MÉTIER");
    // La note de structure musicien guide l'assemblage.
    expect(user.content).toContain("STRUCTURE ATTENDUE (MUSICIEN");
    expect(user.content).toMatch(/PAS d'avis clients/i);
  });
  it("artisan : les avis et la FAQ restent disponibles dans le catalogue", () => {
    const [system] = buildAgenceurMessages({ ...INPUT, brief: "plombier à Rennes" });
    expect(system.content).toContain("### testimonials-carousel");
    expect(system.content).toContain("### faq-accordion");
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

// --- Sous-pages -------------------------------------------------------------------

const PAGE_INPUT: SubPageInput = {
  request: "Une page tarifs avec mes trois formules et les questions fréquentes sur les prix.",
  businessName: "Breizh Plomberie",
  brief: INPUT.brief,
  homeComponents: ["hero-split-asym", "services-rows", "faq-accordion", "contact-block", "footer-columns"],
  existingTitles: ["Nos services"],
};

describe("deriveSubPageTitle", () => {
  it("reconnaît les intentions courantes", () => {
    expect(deriveSubPageTitle("une page avec mes tarifs et formules")).toBe("Tarifs");
    expect(deriveSubPageTitle("pour me contacter et prendre rendez-vous")).toBe("Contact");
    expect(deriveSubPageTitle("présenter mon équipe et notre histoire")).toBe("À propos");
    expect(deriveSubPageTitle("montrer mes réalisations de chantier")).toBe("Réalisations");
  });
  it("sinon, extrait des mots significatifs de la demande", () => {
    const t = deriveSubPageTitle("je veux une page sur l'isolation thermique");
    expect(t.length).toBeGreaterThanOrEqual(2);
    expect(t.length).toBeLessThanOrEqual(30);
    expect(t).not.toMatch(/^je veux/i);
  });
  it("ne renvoie jamais une chaîne vide", () => {
    expect(deriveSubPageTitle("").length).toBeGreaterThanOrEqual(2);
    expect(deriveSubPageTitle("ok").length).toBeGreaterThanOrEqual(2);
  });
});

describe("repairSubPageSections", () => {
  it("écarte navbar, footer ET hero (réservés à l'accueil)", () => {
    const out = repairSubPageSections([
      { component: "hero-split-asym", content: {} },
      { component: "plumber-pro-navbar", content: {} },
      { component: "intro-split", content: {} },
      { component: "pricing-cards", content: {} },
      { component: "footer-columns", content: {} },
    ]);
    const roles = out.map((s) => getManifest(s.component)!.role);
    expect(roles).not.toContain("hero");
    expect(roles).not.toContain("navbar");
    expect(roles).not.toContain("footer");
    expect(out.map((s) => s.component)).toContain("pricing-cards");
  });
  it("complète à 3 sections minimum, un seul composant par rôle", () => {
    const out = repairSubPageSections([{ component: "pricing-cards", content: {} }]);
    expect(out.length).toBeGreaterThanOrEqual(3);
    const roles = out.map((s) => getManifest(s.component)!.role);
    expect(new Set(roles).size).toBe(roles.length);
  });
});

describe("fallbackSubPageSections", () => {
  it("choisit un plan selon l'intention (tarifs → pricing-cards)", () => {
    const out = fallbackSubPageSections(PAGE_INPUT, "Tarifs");
    expect(out.map((s) => s.component)).toContain("pricing-cards");
  });
  it("l'en-tête de page porte le TITRE de la page, pas le texte d'exemple", () => {
    const out = fallbackSubPageSections(PAGE_INPUT, "Tarifs");
    const head = out[0];
    const values = Object.values(head.content).filter((v): v is string => typeof v === "string");
    expect(values.some((v) => v.includes("Tarifs"))).toBe(true);
    const sample = getSample(head.component);
    const sampleHeadings = Object.entries(sample).filter(([k]) => /^title/i.test(k)).map(([, v]) => v);
    for (const sh of sampleHeadings) {
      expect(values).not.toContain(sh);
    }
  });
  it("contact → bloc contact présent", () => {
    const out = fallbackSubPageSections({ ...PAGE_INPUT, request: "comment me joindre" }, "Contact");
    expect(out.map((s) => s.component)).toContain("contact-block");
  });
});

describe("generateSubPage", () => {
  it("source ai : titre IA nettoyé + sections réparées (hero écarté)", async () => {
    const res = await generateSubPage(PAGE_INPUT, async () =>
      JSON.stringify({
        title: " « Tarifs »  ",
        sections: [
          { component: "hero-split-asym", content: {} },
          { component: "intro-split", content: { title: "Nos tarifs plomberie" } },
          { component: "pricing-cards", content: {} },
          { component: "cta-banner", content: {} },
        ],
      }),
    );
    expect(res.source).toBe("ai");
    expect(res.title).toBe("Tarifs");
    expect(res.sections.map((s) => s.component)).not.toContain("hero-split-asym");
    expect(res.sections.map((s) => s.component)).toContain("pricing-cards");
  });
  it("repli : titre dérivé de la demande + plan selon l'intention", async () => {
    const res = await generateSubPage(PAGE_INPUT, async () => {
      throw new Error("réseau");
    });
    expect(res.source).toBe("fallback");
    expect(res.title).toBe("Tarifs");
    expect(res.sections.map((s) => s.component)).toContain("pricing-cards");
    expect(res.sections.length).toBeGreaterThanOrEqual(3);
  });
});
