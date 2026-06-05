import { describe, it, expect } from "vitest";
import { extractSiteData } from "./scrape-site";

/* [3.4] Extraction des données d'un site existant. */
const HTML = `<!doctype html>
<html><head>
  <title>Camille Studio &amp; Co — Photographe</title>
  <meta name="description" content="Photographe mariage à Lyon, lumière naturelle.">
  <meta property="og:title" content="Camille Studio">
</head><body>
  <a href="mailto:camille@studio.fr">Écrivez-moi</a>
  <a href="tel:+33612345678">Appeler</a>
  <a href="https://www.instagram.com/camille.photo/">Instagram</a>
  <a href="https://www.instagram.com/camille.photo/?hl=fr">Insta encore</a>
  <a href="https://open.spotify.com/artist/abc">Spotify</a>
  <a href="https://github.com/camille">GitHub</a>
  <a href="https://example.com/page">Lien interne</a>
  <script>const x = "fake@script.js";</script>
</body></html>`;

describe("extractSiteData", () => {
  const d = extractSiteData(HTML);

  it("extrait titre (og prioritaire) et description", () => {
    expect(d.title).toBe("Camille Studio");
    expect(d.description).toContain("Photographe mariage à Lyon");
  });

  it("extrait email (mailto) et téléphone (tel:)", () => {
    expect(d.email).toBe("camille@studio.fr");
    expect(d.phone).toContain("33612345678");
  });

  it("extrait les liens sociaux dédupliqués + le handle Instagram", () => {
    expect(d.instagram).toBe("camille.photo");
    expect(d.socialLinks).toContain("https://www.instagram.com/camille.photo");
    expect(d.socialLinks).toContain("https://github.com/camille");
    expect(d.socialLinks.filter((l) => l.includes("instagram"))).toHaveLength(1);
    expect(d.socialLinks).not.toContain("https://example.com/page");
  });

  it("sépare les liens d'écoute (Spotify…)", () => {
    expect(d.musicLinks).toContain("https://open.spotify.com/artist/abc");
  });

  it("HTML vide → objet vide propre", () => {
    const e = extractSiteData("<html></html>");
    expect(e.title).toBeUndefined();
    expect(e.socialLinks).toEqual([]);
  });
});
