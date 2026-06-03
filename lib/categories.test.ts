import { describe, it, expect } from "vitest";
import { CATEGORIES, getCategory } from "./categories";
import { isTemplateId } from "./templates";

describe("invariants catégories", () => {
  it("toute catégorie active a au moins un template valide + un defaultTemplateId valide", () => {
    for (const c of CATEGORIES.filter((c) => c.active)) {
      expect(c.templateIds.length, `${c.id} actif mais sans template`).toBeGreaterThan(0);
      for (const t of c.templateIds) expect(isTemplateId(t), `${c.id}: ${t} inconnu`).toBe(true);
      expect(isTemplateId(c.defaultTemplateId)).toBe(true);
      expect(c.templateIds).toContain(c.defaultTemplateId);
    }
  });

  it("artisan / portfolio / saas sont actifs avec leurs templates", () => {
    expect(getCategory("artisan")?.active).toBe(true);
    expect(getCategory("artisan")?.templateIds).toContain("cleaning-services");
    expect(getCategory("portfolio")?.templateIds).toContain("creative-portfolio");
    expect(getCategory("saas")?.templateIds).toContain("health-saas");
  });

  it("photographe inclut les templates mariage", () => {
    const p = getCategory("photographe");
    expect(p?.templateIds).toContain("luxury-wedding");
    expect(p?.templateIds).toContain("wedding-fine-art");
  });
});
