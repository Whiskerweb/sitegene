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

describe("vibeToCssVars", () => {
  const warm = getVibe("warm-serif")!;
  it("conserve les anciennes vars à l'identique (non-régression)", () => {
    const v = vibeToCssVars(warm);
    expect(v["--c-ink"]).toBe(warm.palette.ink);
    expect(v["--c-surface"]).toBe(warm.palette.surface);
    expect(v["--c-card"]).toBe(warm.palette.card);
    expect(v["--c-accent"]).toBe(warm.palette.accent);
    expect(v["--c-accent2"]).toBe(warm.palette.accent2);
    expect(v["--c-muted"]).toBe(warm.palette.muted);
    expect(v["--font-heading"]).toBe(warm.fonts.heading);
    expect(v["--font-body"]).toBe(warm.fonts.body);
  });
  it("émet les nouvelles vars sémantiques", () => {
    const v = vibeToCssVars(warm);
    expect(v["--c-primary"]).toBe(warm.palette.accent);
    expect(v["--c-bg"]).toBe(warm.palette.surface);
    expect(v["--c-text"]).toBe(warm.palette.ink);
    expect(v["--c-text-2"]).toBe(warm.palette.muted);
    expect(v["--c-border"]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(v["--font-label"]).toBeTruthy();
    expect(v["--space-section"]).toBeTruthy();
    expect(v["--r-control"]).toBeTruthy();
  });
  it("brand.primary surcharge --c-accent ET --c-primary", () => {
    const v = vibeToCssVars(warm, { primary: "#123456" });
    expect(v["--c-accent"]).toBe("#123456");
    expect(v["--c-primary"]).toBe("#123456");
  });
});
