// lib/foundry/vibes.test.ts
import { describe, it, expect } from "vitest";
import { getVibe, vibeToCssVars, VIBES, VIBE_IDS } from "./vibes";

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

describe("modèle Vibe enrichi", () => {
  // TODO(Task 3) : réactiver quand les 11 DA sont ajoutées à VIBES.
  it.skip("expose les 6 vibes historiques + les 11 nouvelles", () => {
    expect(VIBE_IDS.length).toBe(17);
    for (const id of VIBE_IDS) expect(getVibe(id)).toBeDefined();
  });
  it("chaque vibe a un mode clair ou sombre", () => {
    for (const v of Object.values(VIBES)) {
      expect(v.mode === "light" || v.mode === "dark").toBe(true);
    }
  });
});
