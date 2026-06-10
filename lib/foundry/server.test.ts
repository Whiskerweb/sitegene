// lib/foundry/server.test.ts — fonctions PURES du modèle multi-pages
// (liens navbar, navbar par défaut, composition de sous-page, slugs).
import { describe, it, expect } from "vitest";
import type { Recipe } from "./types";
import {
  addNavLink,
  removeNavLinks,
  renameNavLink,
  ensureNavbar,
  resolveNavHref,
  withResolvedNav,
  composePageRecipe,
  uniquePageSlug,
  slugify,
  DEFAULT_NAVBAR_ID,
  type FoundryPage,
} from "./server";
import { sanitizeUserContent } from "./agenceur";
import { getManifest } from "./manifests";

const HOME: Recipe = {
  vibe: "ocean-confiance",
  sections: [
    { component: "plumber-emergency-navbar", content: { brand: "Breizh", links: ["Accueil"], cta: "Appeler" } },
    { component: "hero-split-asym", content: {} },
    { component: "services-rows", content: {} },
    { component: "footer-columns", content: {} },
  ],
};

const NO_NAV_HOME: Recipe = { ...HOME, sections: HOME.sections.slice(1) };

describe("liens navbar (add/rename/remove)", () => {
  it("addNavLink ajoute {label,target} sans doublon de cible", () => {
    const r1 = addNavLink(HOME, "Tarifs", "tarifs");
    const links = r1.sections[0].content.links as unknown[];
    expect(links).toContainEqual({ label: "Tarifs", target: "tarifs" });
    const r2 = addNavLink(r1, "Tarifs bis", "tarifs");
    expect((r2.sections[0].content.links as unknown[]).length).toBe(links.length);
  });
  it("renameNavLink met à jour le lien EN PLACE (position conservée)", () => {
    const r1 = addNavLink(addNavLink(HOME, "Tarifs", "tarifs"), "Contact", "contact");
    const r2 = renameNavLink(r1, "tarifs", "Nos prix", "nos-prix");
    const links = r2.sections[0].content.links as Array<{ label?: string; target?: string }>;
    const idx = links.findIndex((l) => l.target === "nos-prix");
    expect(idx).toBe(1); // toujours juste après « Accueil »
    expect(links[idx].label).toBe("Nos prix");
    expect(links.some((l) => l.target === "tarifs")).toBe(false);
  });
  it("removeNavLinks retire les liens de la cible", () => {
    const r1 = addNavLink(HOME, "Tarifs", "tarifs");
    const r2 = removeNavLinks(r1, "tarifs");
    const links = r2.sections[0].content.links as Array<{ target?: string }>;
    expect(links.some((l) => l.target === "tarifs")).toBe(false);
  });
});

describe("préservation des liens objets par la normalisation (undo/édition)", () => {
  it("sanitizeUserContent garde les {label,target} ET les chaînes", () => {
    const content = {
      brand: "Breizh",
      links: ["Accueil", { label: "Tarifs", target: "tarifs" }],
      cta: "Appeler",
    };
    const out = sanitizeUserContent("plumber-emergency-navbar", content);
    expect(out.links).toEqual(["Accueil", { label: "Tarifs", target: "tarifs" }]);
  });
});

describe("ensureNavbar", () => {
  it("ne touche pas une recette qui a déjà une navbar", () => {
    const { recipe, added } = ensureNavbar(HOME, "Breizh");
    expect(added).toBe(false);
    expect(recipe).toBe(HOME);
  });
  it("injecte la navbar par défaut en tête, au nom du client, avec lien Accueil", () => {
    const { recipe, added } = ensureNavbar(NO_NAV_HOME, "Breizh Plomberie");
    expect(added).toBe(true);
    const nav = recipe.sections[0];
    expect(nav.component).toBe(DEFAULT_NAVBAR_ID);
    expect(getManifest(nav.component)?.role).toBe("navbar");
    expect(nav.content.brand).toBe("Breizh Plomberie");
    expect(nav.content.links).toEqual([{ label: "Accueil", target: "home" }]);
  });
});

describe("résolution des liens + composition de sous-page", () => {
  it("resolveNavHref : home, page, URL absolue", () => {
    expect(resolveNavHref("home", "monsite")).toBe("/a/monsite");
    expect(resolveNavHref("tarifs", "monsite")).toBe("/a/monsite/tarifs");
    expect(resolveNavHref("https://x.fr", "monsite")).toBe("https://x.fr");
    expect(resolveNavHref(undefined, "monsite")).toBe("/a/monsite");
  });
  it("withResolvedNav transforme les liens en {label,href}", () => {
    const r = withResolvedNav(addNavLink(HOME, "Tarifs", "tarifs"), "monsite");
    const links = r.sections[0].content.links as Array<{ label: string; href: string }>;
    expect(links).toContainEqual({ label: "Tarifs", href: "/a/monsite/tarifs" });
    expect(links).toContainEqual({ label: "Accueil", href: "/a/monsite" });
  });
  it("composePageRecipe : navbar accueil + sections page + footer accueil", () => {
    const page: FoundryPage = {
      id: "p_1",
      slug: "tarifs",
      title: "Tarifs",
      purpose: "mes prix",
      sections: [
        { component: "intro-split", content: {} },
        { component: "pricing-cards", content: {} },
      ],
    };
    const r = composePageRecipe(HOME, page);
    const ids = r.sections.map((s) => s.component);
    expect(ids[0]).toBe("plumber-emergency-navbar");
    expect(ids[ids.length - 1]).toBe("footer-columns");
    expect(ids).toContain("pricing-cards");
    expect(ids).not.toContain("hero-split-asym");
  });
});

describe("slugs de pages", () => {
  it("slugify : accents et ponctuation aplatis", () => {
    expect(slugify("À propos !")).toBe("a-propos");
    expect(slugify("Questions fréquentes")).toBe("questions-frequentes");
  });
  it("uniquePageSlug dédoublonne", () => {
    const pages = [{ id: "1", slug: "tarifs", title: "Tarifs", purpose: "", sections: [] }];
    expect(uniquePageSlug("Tarifs", pages)).not.toBe("tarifs");
  });
});
