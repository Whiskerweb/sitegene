import { describe, it, expect } from "vitest";
import { sectionPlanForIntake, SECTION_DEFS } from "./onboarding-sections";

describe("sectionPlanForIntake", () => {
  it("plan standard ordonné", () => {
    const plan = sectionPlanForIntake({ services: ["a"], priceRange: "50€" } as any);
    expect(plan.map((s) => s.key)).toEqual(["services", "pricing", "about", "contact"]);
  });
  it("remplace pricing par approach si wantsPricingPage=false", () => {
    const plan = sectionPlanForIntake({ wantsPricingPage: false } as any);
    const keys = plan.map((s) => s.key);
    expect(keys).toContain("approach");
    expect(keys).not.toContain("pricing");
  });
  it("chaque def a un title et un slot", () => {
    for (const d of SECTION_DEFS) {
      expect(d.title.length).toBeGreaterThan(0);
      expect(d.slot.length).toBeGreaterThan(0);
    }
  });
});
