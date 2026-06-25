// lib/foundry/resalib.test.ts
import { describe, it, expect } from "vitest";
import {
  isResalibUrl,
  isResalibImageHost,
  parseResalibHtml,
  mergeResalibIntoCollected,
  resalibBriefAddition,
} from "./resalib";
import type { Collected } from "./link-catalog";

const empty: Collected = { socials: [], contact: {}, photos: [] };

const HTML = `<!doctype html><html><head>
<meta property="og:title" content="Sophie Guerriero Naturopathe Sophrologue - Sophrologue à Saint-Christol-lès-Alès | Resalib" />
<meta property="og:description" content="J'accompagne en profondeur les personnes souffrant d'émotions trop intenses." />
<meta property="og:image" content="https://www.resalib.fr/media/cache/profil/abc.jpg" />
</head><body>
<p>855 chemin des pensions, 30380 Saint-Christol-lès-Alès</p>
<img src="https://images.resalib.fr/photos/p2.jpg">
<img src="https://evil.example.com/track.gif">
</body></html>`;

describe("isResalibUrl", () => {
  it("accepte un profil resalib.fr", () => {
    expect(isResalibUrl("https://www.resalib.fr/praticien/40739-sophie-guerriero")).toBe(true);
    expect(isResalibUrl("resalib.fr/praticien/123-x")).toBe(true);
  });
  it("refuse hors profil ou autre domaine", () => {
    expect(isResalibUrl("https://www.resalib.fr/recherche/naturopathie/honfleur")).toBe(false);
    expect(isResalibUrl("https://doctolib.fr/praticien/123")).toBe(false);
    expect(isResalibUrl("")).toBe(false);
  });
});

describe("isResalibImageHost", () => {
  it("autorise les hôtes Resalib, refuse les autres", () => {
    expect(isResalibImageHost("https://www.resalib.fr/media/x.jpg")).toBe(true);
    expect(isResalibImageHost("https://images.resalib.fr/p.jpg")).toBe(true);
    expect(isResalibImageHost("https://evil.example.com/x.jpg")).toBe(false);
  });
});

describe("parseResalibHtml", () => {
  const p = parseResalibHtml(HTML);
  it("extrait le nom nettoyé (sans ville ni suffixe Resalib)", () => {
    expect(p.name).toBe("Sophie Guerriero Naturopathe Sophrologue");
  });
  it("extrait la bio (og:description)", () => {
    expect(p.bio).toContain("émotions trop intenses");
  });
  it("extrait l'adresse", () => {
    expect(p.address).toContain("30380 Saint-Christol-lès-Alès");
  });
  it("ne garde que les images d'hôtes Resalib", () => {
    expect(p.imageUrls).toContain("https://www.resalib.fr/media/cache/profil/abc.jpg");
    expect(p.imageUrls).toContain("https://images.resalib.fr/photos/p2.jpg");
    expect(p.imageUrls.some((u) => u.includes("evil.example.com"))).toBe(false);
  });
});

describe("mergeResalibIntoCollected", () => {
  it("pose le lien Resalib comme « Prendre rendez-vous »", () => {
    const out = mergeResalibIntoCollected(empty, {}, "https://www.resalib.fr/praticien/1-x");
    expect(out.booking).toEqual({ label: "Prendre rendez-vous", href: "https://www.resalib.fr/praticien/1-x" });
  });
  it("n'écrase pas un booking déjà saisi", () => {
    const cur: Collected = { ...empty, booking: { label: "Calendly", href: "https://calendly.com/x" } };
    const out = mergeResalibIntoCollected(cur, {}, "https://www.resalib.fr/praticien/1-x");
    expect(out.booking?.href).toBe("https://calendly.com/x");
  });
  it("ajoute avis (+hasReviews), adresse et photos", () => {
    const out = mergeResalibIntoCollected(
      empty,
      { address: "30380 Alès", reviews: [{ text: "Super", name: "M.", rating: 5 }] },
      "https://www.resalib.fr/praticien/1-x",
      ["https://cdn/a.jpg", "https://cdn/b.jpg"],
    );
    expect(out.hasReviews).toBe(true);
    expect(out.reviews).toHaveLength(1);
    expect(out.contact.address).toBe("30380 Alès");
    expect(out.photos).toEqual(["https://cdn/a.jpg", "https://cdn/b.jpg"]);
  });
  it("n'écrase pas une adresse déjà saisie", () => {
    const cur: Collected = { ...empty, contact: { address: "Paris" } };
    const out = mergeResalibIntoCollected(cur, { address: "Lyon" }, "https://www.resalib.fr/praticien/1-x");
    expect(out.contact.address).toBe("Paris");
  });
});

describe("resalibBriefAddition", () => {
  it("compose une présentation riche depuis tous les champs", () => {
    const txt = resalibBriefAddition({
      title: "Psychologue Clinicienne",
      bio: "Je suis sophrologue.",
      specialties: ["stress", "sommeil"],
      audiences: ["Enfant", "Adulte"],
      modalities: ["Cabinet", "À distance"],
      credentials: ["Master 2 Psychologie — Rennes II"],
      experience: "depuis 2011",
      pricing: "50€",
      payments: ["Espèces", "CB"],
      address: "Alès",
    });
    expect(txt).toContain("Psychologue Clinicienne");
    expect(txt).toContain("Je suis sophrologue.");
    expect(txt).toContain("Spécialités : stress, sommeil.");
    expect(txt).toContain("Public accompagné : Enfant, Adulte.");
    expect(txt).toContain("Modalités : Cabinet, À distance.");
    expect(txt).toContain("Diplômes & formations : Master 2 Psychologie — Rennes II.");
    expect(txt).toContain("En activité depuis 2011.");
    expect(txt).toContain("Tarif : 50€.");
    expect(txt).toContain("Moyens de paiement : Espèces, CB.");
    expect(txt).toContain("Adresse : Alès.");
  });

  it("omet proprement les champs absents", () => {
    expect(resalibBriefAddition({ bio: "Bonjour." })).toBe("Bonjour.");
    expect(resalibBriefAddition({})).toBe("");
  });
});
