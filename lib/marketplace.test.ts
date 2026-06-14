import { describe, it, expect } from "vitest";
import {
  COMPONENT_PRICE_CREDITS,
  EFFECT_PRICE_CREDITS,
  TEMPLATE_PRICE_CREDITS,
  componentPrice,
  genLicenseCode,
  isMarketplaceItemType,
  priceFor,
} from "./marketplace";
import { categoryForTemplate } from "./categories";

describe("marketplace — prix (autorité serveur)", () => {
  it("priceFor résout depuis le type d'item", () => {
    expect(priceFor("template")).toBe(TEMPLATE_PRICE_CREDITS);
    expect(priceFor("effect")).toBe(EFFECT_PRICE_CREDITS);
  });

  it("componentPrice tarife à la rareté (common inclus)", () => {
    expect(componentPrice("common")).toBe(0);
    expect(componentPrice("rare")).toBe(COMPONENT_PRICE_CREDITS.rare);
    expect(componentPrice("epic")).toBeGreaterThan(componentPrice("rare"));
  });

  it("isMarketplaceItemType filtre les types inconnus", () => {
    expect(isMarketplaceItemType("template")).toBe(true);
    expect(isMarketplaceItemType("effect")).toBe(true);
    expect(isMarketplaceItemType("component")).toBe(true);
    expect(isMarketplaceItemType("subscription")).toBe(false);
  });
});

describe("genLicenseCode", () => {
  it("format AKY-FX-XXXXX / AKY-TPL-XXXXX sans caractères ambigus", () => {
    for (let i = 0; i < 50; i++) {
      expect(genLicenseCode("effect")).toMatch(/^AKY-FX-[A-HJ-NP-Z2-9]{5}$/);
      expect(genLicenseCode("template")).toMatch(/^AKY-TPL-[A-HJ-NP-Z2-9]{5}$/);
    }
  });

  it("unicité raisonnable (pas de collision sur 200 tirages)", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(genLicenseCode("effect"));
    expect(seen.size).toBeGreaterThan(190);
  });
});

describe("categoryForTemplate (recommandations Formules)", () => {
  it("retrouve la catégorie d'un template référencé", () => {
    expect(categoryForTemplate("alice-r")?.id).toBe("photographe");
    expect(categoryForTemplate("jazz-vocalist")?.id).toBe("musicien");
  });

  it("undefined pour un template inconnu", () => {
    expect(categoryForTemplate("nope")).toBeUndefined();
  });
});
