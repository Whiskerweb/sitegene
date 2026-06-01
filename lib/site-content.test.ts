import { describe, it, expect } from "vitest";
import { normalizeContent } from "./site-content";

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
