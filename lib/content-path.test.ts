import { describe, it, expect } from "vitest";
import { getAtPath, setAtPath, pageIndexForPath } from "./content-path";

const v2 = {
  version: 2, site: {},
  pages: [
    { slug: "/", type: "home", content: { hero: { title: ["A", "B"] } } },
    { slug: "/portfolio", type: "portfolio", content: { galleries: [{ category: "X" }] } },
  ],
};

describe("content-path (page-aware)", () => {
  it("pageIndexForPath mappe un chemin d'URL vers l'index de page", () => {
    expect(pageIndexForPath(v2, "/")).toBe(0);
    expect(pageIndexForPath(v2, "/portfolio")).toBe(1);
    expect(pageIndexForPath(v2, "/inconnu")).toBe(0);
  });
  it("getAtPath lit dans le content de la page indiquée", () => {
    expect(getAtPath(v2, 0, "hero.title[1]")).toBe("B");
    expect(getAtPath(v2, 1, "galleries[0].category")).toBe("X");
  });
  it("setAtPath écrit dans pages[idx].content sans muter l'original", () => {
    const next = setAtPath(v2, 0, "hero.title[0]", "Z");
    expect(getAtPath(next, 0, "hero.title[0]")).toBe("Z");
    expect(getAtPath(v2, 0, "hero.title[0]")).toBe("A");
  });
});
