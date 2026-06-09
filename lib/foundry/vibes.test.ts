// lib/foundry/vibes.test.ts
import { describe, it, expect } from "vitest";
import { getVibe, vibeToCssVars, VIBES } from "./vibes";

describe("vibes", () => {
  it("expose la vibe warm-serif", () => {
    expect(getVibe("warm-serif")?.palette.accent).toBe("#8d6959");
    expect(getVibe("inconnue")).toBeUndefined();
  });
  it("mappe la vibe en variables CSS", () => {
    const vars = vibeToCssVars(VIBES["warm-serif"]);
    expect(vars["--c-surface"]).toBe("#fcfaf7");
    expect(vars["--font-heading"]).toContain("Castoro");
    expect(vars["--r-card"]).toBe("24px");
  });
  it("la couleur de marque surcharge l'accent", () => {
    const vars = vibeToCssVars(VIBES["warm-serif"], { primary: "#123456" });
    expect(vars["--c-accent"]).toBe("#123456");
  });
  it("une couleur de marque vide ne surcharge pas l'accent", () => {
    expect(vibeToCssVars(VIBES["warm-serif"], { primary: "" })["--c-accent"]).toBe("#8d6959");
    expect(vibeToCssVars(VIBES["warm-serif"], { primary: "  " })["--c-accent"]).toBe("#8d6959");
  });
});
