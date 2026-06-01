import { describe, it, expect } from "vitest";
import { normalizeContent, findPage, pageMeta } from "./site-content";

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
