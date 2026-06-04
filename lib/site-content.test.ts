import { describe, it, expect } from "vitest";
import {
  contentForTemplate,
  findPage,
  metaForTemplate,
  normalizeContent,
  pageMeta,
} from "./site-content";

describe("normalizeContent", () => {
  it("wrappe un contenu v1 (plat, sans version) en une page home", () => {
    const v1 = { hero: { brand: "Alice" }, navItems: ["Work"], gallery: ["a.jpg"] };
    const out = normalizeContent(v1);
    expect(out.version).toBe(2);
    expect(out.pages).toHaveLength(1);
    expect(out.pages[0].slug).toBe("/");
    expect(out.pages[0].type).toBe("home");
    expect(out.pages[0].content).toMatchObject(v1);
  });

  it("laisse un contenu v2 inchangé (idempotent)", () => {
    const v2 = {
      version: 2,
      site: { brand: "Alice", nav: [], footer: {} },
      pages: [{ slug: "/", type: "home", title: "T", meta: {}, content: {} }],
    };
    expect(normalizeContent(v2)).toEqual(v2);
  });

  it("préserve __css au niveau racine si présent (v1)", () => {
    const out = normalizeContent({ hero: {}, __css: ".x{}" });
    expect(out.__css).toBe(".x{}");
  });
});

describe("findPage", () => {
  const c = normalizeContent({
    version: 2,
    site: { brand: "A" },
    pages: [
      { slug: "/", type: "home", title: "Accueil", content: {} },
      { slug: "/portfolio", type: "portfolio", title: "Portfolio", content: {} },
    ],
  } as any);

  it("trouve la home pour un path vide ou '/'", () => {
    expect(findPage(c, "")!.slug).toBe("/");
    expect(findPage(c, "/")!.slug).toBe("/");
  });
  it("trouve une page par chemin, slash final ignoré", () => {
    expect(findPage(c, "/portfolio")!.slug).toBe("/portfolio");
    expect(findPage(c, "/portfolio/")!.slug).toBe("/portfolio");
  });
  it("retombe sur la home si chemin inconnu", () => {
    expect(findPage(c, "/inconnu")!.slug).toBe("/");
  });

  it("pageMeta renvoie titre/description de la page", () => {
    const m = pageMeta(c, "/portfolio");
    expect(m.title).toBe("Portfolio");
  });
});

describe("contentForTemplate (multi-lignée)", () => {
  const flat = {
    brand: "Neatly",
    meta: { title: "Neatly – Services", description: "Pro cleaning" },
    hero: { title: "Local Cleaning" },
    services: { items: [{ title: "Eco" }] },
  };

  it("lignée SPA → v2 normalisé", () => {
    const out = contentForTemplate(flat, "alice-r") as { version?: number };
    expect(out.version).toBe(2);
  });

  it("lignée HTML → contenu PLAT intact (jamais enveloppé)", () => {
    const out = contentForTemplate(flat, "cleaning-services");
    expect(out).toEqual(flat);
    expect((out as { version?: number }).version).toBeUndefined();
  });

  it("lignée HTML → déballe un v2 mono-page enveloppé par erreur", () => {
    const wrapped = normalizeContent(flat); // {version:2, pages:[{content: flat}]}
    const out = contentForTemplate(wrapped, "cleaning-services");
    expect(out).toMatchObject(flat);
  });

  it("metaForTemplate plat : meta.title puis repli brand", () => {
    expect(metaForTemplate(flat, "cleaning-services", "/").title).toBe("Neatly – Services");
    expect(metaForTemplate({ brand: "X" }, "cleaning-services", "/").title).toBe("X");
  });
});
