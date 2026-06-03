import { describe, it, expect } from "vitest";
import { getPath, setPath, collectImageSlots, buildContent } from "./content-overlay";

describe("content-overlay sur forme plate (templates HTML)", () => {
  it("getPath lit un chemin de liste", () => {
    const c = { hero: { title: "X" }, releases: [{ title: "A" }] };
    expect(getPath(c, "hero.title")).toBe("X");
    expect(getPath(c, "releases[0].title")).toBe("A");
  });

  it("setPath écrit sans présupposer site/pages", () => {
    const c: Record<string, unknown> = { hero: { title: "X" } };
    setPath(c, "hero.title", "Y");
    expect((c.hero as { title: string }).title).toBe("Y");
  });

  it("collectImageSlots détecte les images /_templates/<id>/img/", () => {
    const c = { hero: { image: "/_templates/jazz-vocalist/img/hero.jpg" }, x: "non-image" };
    expect(collectImageSlots(c, "jazz-vocalist")).toEqual(["/_templates/jazz-vocalist/img/hero.jpg"]);
  });

  it("buildContent surcharge textes + remplace images sur forme plate", () => {
    const base = { hero: { title: "Old", image: "/_templates/t/img/a.jpg" } };
    const out = buildContent(base, { "hero.title": "New" }, { "/_templates/t/img/a.jpg": "https://cdn/a.jpg" });
    expect(getPath(out, "hero.title")).toBe("New");
    expect(getPath(out, "hero.image")).toBe("https://cdn/a.jpg");
  });
});
