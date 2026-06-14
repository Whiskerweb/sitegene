// lib/foundry/link-catalog.test.ts
import { describe, it, expect } from "vitest";
import { PLATFORMS, normPlatform, toHref, linkFieldsForTrade } from "./link-catalog";

describe("normPlatform", () => {
  it("normalise les variantes saisies vers une clé connue", () => {
    expect(normPlatform("Insta")).toBe("instagram");
    expect(normPlatform("X")).toBe("x");
    expect(normPlatform("Spotify ")).toBe("spotify");
    expect(normPlatform("WhatsApp")).toBe("whatsapp");
    expect(normPlatform("Apple Music")).toBe("apple-music");
    expect(normPlatform("Google Maps")).toBe("maps");
    expect(normPlatform("planity")).toBe("booking");
    expect(normPlatform("Calendly")).toBe("booking");
    expect(normPlatform("un truc inconnu")).toBe("link");
  });
});

describe("PLATFORMS", () => {
  it("chaque plateforme connue a un label, un kind et une clé d'icône", () => {
    for (const key of ["instagram", "spotify", "whatsapp", "maps", "apple-music", "linkedin"]) {
      expect(PLATFORMS[key]).toBeDefined();
      expect(PLATFORMS[key].label.length).toBeGreaterThan(0);
      expect(PLATFORMS[key].kind).toBeDefined();
    }
  });
});

describe("toHref", () => {
  it("construit un href selon le kind/clé", () => {
    expect(toHref("phone", "06 12 34 56 78")).toBe("tel:+33612345678");
    expect(toHref("whatsapp", "06 12 34 56 78")).toBe("https://wa.me/33612345678");
    expect(toHref("email", "a@b.fr")).toBe("mailto:a@b.fr");
    expect(toHref("instagram", "https://instagram.com/x")).toBe("https://instagram.com/x");
    expect(toHref("instagram", "monpseudo")).toBe("https://instagram.com/monpseudo");
    expect(toHref("link", "exemple.fr")).toBe("https://exemple.fr");
    expect(toHref("phone", "")).toBe("");
    expect(toHref("phone", "+33 (0)6 12 34 56 78")).toBe("tel:+33612345678");
    expect(toHref("instagram", "@monpseudo")).toBe("https://instagram.com/monpseudo");
  });
});

import type { TradeId } from "./da-personas";

describe("linkFieldsForTrade", () => {
  it("musicien → met en avant le streaming", () => {
    const keys = linkFieldsForTrade("musicien").map((f) => f.platform);
    expect(keys).toContain("spotify");
    expect(keys).toContain("instagram");
    expect(keys).toContain("youtube");
  });
  it("artisan → met en avant téléphone et devis", () => {
    const keys = linkFieldsForTrade("artisan").map((f) => f.platform);
    expect(keys).toContain("phone");
    expect(keys).toContain("whatsapp");
  });
  it("métier inconnu → liste générique non vide", () => {
    const keys = linkFieldsForTrade("autre" as TradeId).map((f) => f.platform);
    expect(keys).toContain("instagram");
    expect(keys.length).toBeGreaterThan(0);
  });
  it("chaque champ référence une plateforme connue", () => {
    const all: TradeId[] = ["musicien", "photographe", "coach", "bien-etre", "artisan", "restaurant", "beaute", "conseil", "fitness", "autre"];
    for (const t of all) {
      for (const f of linkFieldsForTrade(t)) {
        expect(PLATFORMS[f.platform], `${t}/${f.platform}`).toBeDefined();
      }
    }
  });
});
