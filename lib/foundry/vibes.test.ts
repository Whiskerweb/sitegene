// lib/foundry/vibes.test.ts
import { describe, it, expect } from "vitest";
import { getVibe, vibeToCssVars, VIBES, VIBE_IDS } from "./vibes";
import type { VibeId } from "./types";
import { contrast } from "./charte";

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
  it("expose les 6 vibes historiques + les 11 nouvelles", () => {
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

const LEGACY: VibeId[] = ["warm-serif","sage-nature","ocean-confiance","corail-studio","mineral-precis","encre-editoriale"];

describe("non-régression vibes historiques", () => {
  it("les 6 anciennes vibes produisent exactement leurs anciennes vars", () => {
    for (const id of LEGACY) {
      const v = getVibe(id)!;
      const css = vibeToCssVars(v);
      expect(css["--c-ink"]).toBe(v.palette.ink);
      expect(css["--c-surface"]).toBe(v.palette.surface);
      expect(css["--c-card"]).toBe(v.palette.card);
      expect(css["--c-accent"]).toBe(v.palette.accent);
      expect(css["--c-accent2"]).toBe(v.palette.accent2);
      expect(css["--c-muted"]).toBe(v.palette.muted);
      expect(css["--font-heading"]).toBe(v.fonts.heading);
      expect(css["--font-body"]).toBe(v.fonts.body);
      expect(css["--r-card"]).toBe(v.radius.card);
    }
  });
});

const NEW_DA: VibeId[] = [
  "mindful-moments","lexicon-creators","auralis-neural","nexus-transfers","neurosync",
  "rock-brutalist","rap-luxe","contemporain-editorial","photographe-galerie",
  "coach-performance","restaurant-nocturne",
];

describe("DA curées (Lot 1)", () => {
  it("les 11 DA existent et sont rendables", () => {
    for (const id of NEW_DA) {
      const v = getVibe(id)!;
      expect(v).toBeDefined();
      expect(v.fontHref).toContain("JetBrains+Mono");
      expect(v.fonts.label).toBeTruthy();
      expect(v.treatments?.hero).toBeTruthy();
    }
  });
  it("contraste texte/fond WCAG AA (≥ 4.5) sur chaque DA, fond ET panneau", () => {
    for (const id of NEW_DA) {
      const v = getVibe(id)!;
      expect(contrast(v.palette.ink, v.palette.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(v.palette.ink, v.palette.card)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
