// lib/foundry/collect-import.test.ts
import { describe, expect, it } from "vitest";
import { classifyImportUrl, mergeScrapedIntoCollected, platformFromUrl } from "./collect-import";
import type { Collected } from "./link-catalog";

const empty = (): Collected => ({ socials: [], contact: {}, photos: [] });

describe("platformFromUrl", () => {
  it("reconnaît les plateformes courantes", () => {
    expect(platformFromUrl("https://www.instagram.com/atelier")).toBe("instagram");
    expect(platformFromUrl("https://x.com/atelier")).toBe("x");
    expect(platformFromUrl("https://twitter.com/atelier")).toBe("x");
    expect(platformFromUrl("https://music.apple.com/fr/artist/x")).toBe("apple-music");
    expect(platformFromUrl("https://monatelier.bandcamp.com")).toBe("bandcamp");
  });

  it("site générique → null", () => {
    expect(platformFromUrl("https://monatelier.fr")).toBeNull();
  });
});

describe("classifyImportUrl", () => {
  it("URL sociale → rangée directement (pas de scrape)", () => {
    expect(classifyImportUrl("instagram.com/atelier_lumiere")).toEqual({
      kind: "social",
      platform: "instagram",
      href: "https://instagram.com/atelier_lumiere",
    });
  });

  it("site générique → à scraper, https ajouté", () => {
    expect(classifyImportUrl("monatelier.fr")).toEqual({ kind: "website", url: "https://monatelier.fr" });
  });

  it("saisie invalide → null", () => {
    expect(classifyImportUrl("abc")).toBeNull();
    expect(classifyImportUrl("pas une url")).toBeNull();
  });
});

describe("mergeScrapedIntoCollected", () => {
  it("ajoute liens + contacts + site web source", () => {
    const { collected, summary } = mergeScrapedIntoCollected(
      empty(),
      {
        email: "hello@atelier.fr",
        phone: "+33 6 12 34 56 78",
        instagram: "@atelier",
        socialLinks: ["https://facebook.com/atelier", "https://www.instagram.com/atelier"],
        musicLinks: ["https://open.spotify.com/artist/xyz"],
      },
      "https://monatelier.fr",
    );
    const platforms = collected.socials.map((s) => s.platform);
    expect(platforms).toContain("facebook");
    expect(platforms).toContain("instagram");
    expect(platforms).toContain("spotify");
    expect(platforms).toContain("website");
    expect(platforms.filter((p) => p === "instagram")).toHaveLength(1);
    expect(collected.contact.email).toBe("mailto:hello@atelier.fr");
    expect(collected.contact.phone).toBe("tel:+33612345678");
    expect(summary.links).toBe(4);
    expect(summary.contacts).toBe(2);
  });

  it("n'écrase jamais une saisie existante", () => {
    const current: Collected = {
      socials: [{ platform: "instagram", href: "https://instagram.com/ma_saisie" }],
      contact: { email: "mailto:moi@perso.fr" },
      photos: [],
    };
    const { collected } = mergeScrapedIntoCollected(
      current,
      { instagram: "autre", email: "scrape@site.fr", socialLinks: [], musicLinks: [] },
      "https://site.fr",
    );
    expect(collected.socials.find((s) => s.platform === "instagram")?.href).toBe(
      "https://instagram.com/ma_saisie",
    );
    expect(collected.contact.email).toBe("mailto:moi@perso.fr");
  });
});
