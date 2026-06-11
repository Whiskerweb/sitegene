import { describe, it, expect } from "vitest";
import { heroTreatmentOf } from "./treatment";
import { getVibe } from "./vibes";

describe("heroTreatmentOf", () => {
  it("retourne le traitement déclaré par la DA", () => {
    expect(heroTreatmentOf(getVibe("rock-brutalist")!)).toBe("type-giant");
    expect(heroTreatmentOf(getVibe("photographe-galerie")!)).toBe("fullscreen-photo");
  });
  it("retombe sur 'default' si non déclaré", () => {
    expect(heroTreatmentOf(getVibe("warm-serif")!)).toBe("default");
  });
});
