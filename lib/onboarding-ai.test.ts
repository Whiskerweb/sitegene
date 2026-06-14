import { describe, it, expect } from "vitest";
import { SOCLE_ORDER, newlyFilledSlots, slotToSection } from "./onboarding-ai";

describe("socle ordonné", () => {
  it("identité d'abord (brand, activity, tone) puis services, pricing, area, contact", () => {
    expect(SOCLE_ORDER.slice(0, 3)).toEqual(["brand", "activity", "tone"]);
    expect(SOCLE_ORDER).toContain("services");
    expect(SOCLE_ORDER.indexOf("services")).toBeLessThan(SOCLE_ORDER.indexOf("contact"));
  });
  it("newlyFilledSlots détecte la transition vide→rempli", () => {
    const before = { brand: "X" } as any;
    const after = { brand: "X", services: ["a"] } as any;
    expect(newlyFilledSlots(before, after)).toContain("services");
    expect(newlyFilledSlots(before, after)).not.toContain("brand");
  });
  it("slotToSection mappe services→services, priceRange→pricing, area→about, contact→contact", () => {
    expect(slotToSection("services")).toBe("services");
    expect(slotToSection("priceRange")).toBe("pricing");
    expect(slotToSection("area")).toBe("about");
    expect(slotToSection("contact")).toBe("contact");
    expect(slotToSection("brand")).toBeNull();
  });
});
