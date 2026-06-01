import { describe, it, expect } from "vitest";
import { validateContentV2 } from "./validate-content";

describe("validateContentV2", () => {
  const base = { version: 2, site: { nav: [{ label: "Accueil", to: "/" }] },
    pages: [{ slug: "/", type: "home", content: {} }] };
  it("accepte un v2 valide", () => {
    expect(validateContentV2(base).ok).toBe(true);
  });
  it("refuse l'absence de page '/'", () => {
    const bad = { ...base, pages: [{ slug: "/x", type: "home", content: {} }] };
    expect(validateContentV2(bad).ok).toBe(false);
  });
  it("refuse un nav.to vers une page inexistante", () => {
    const bad = { ...base, site: { nav: [{ label: "X", to: "/inconnu" }] } };
    expect(validateContentV2(bad).ok).toBe(false);
  });
  it("refuse un type de page inconnu", () => {
    const bad = { ...base, pages: [...base.pages, { slug: "/y", type: "wat", content: {} }] };
    expect(validateContentV2(bad).ok).toBe(false);
  });
});
