import { describe, it, expect } from "vitest";
import { briefFromSourceContent } from "./source-brief";

describe("briefFromSourceContent", () => {
  it("extrait les textes éditoriaux d'un contenu PLAT", () => {
    const brief = briefFromSourceContent({
      brand: "Medielec",
      hero: { title: "Électricité fiable", tagline: "Dépannage rapide 24/7" },
      services: { items: [{ title: "Mise aux normes", desc: "Conforme NF C 15-100" }] },
      contactPage: { email: "contact@medielec.fr", phone: "+33612345678" },
    });
    expect(brief).toContain("Medielec");
    expect(brief).toContain("Électricité fiable");
    expect(brief).toContain("Dépannage rapide 24/7");
    expect(brief).toContain("Mise aux normes");
    expect(brief).toContain("Conforme NF C 15-100");
  });

  it("ignore les clés techniques, URLs et assets", () => {
    const brief = briefFromSourceContent({
      brand: "Acme",
      __css: ".x{color:red}",
      __effects: [{ id: "fx" }],
      hero: {
        title: "Bienvenue",
        image: "https://cdn.supabase.co/photo.jpg",
      },
      logo: "/_templates/x/logo.png",
    });
    expect(brief).toContain("Acme");
    expect(brief).toContain("Bienvenue");
    expect(brief).not.toContain("color:red");
    expect(brief).not.toContain("photo.jpg");
    expect(brief).not.toContain("_templates");
  });

  it("déplie le contenu des pages pour la lignée v2", () => {
    const brief = briefFromSourceContent({
      version: 2,
      pages: [
        { slug: "/", content: { hero: { brand: "Studio Lux", title: "Photographe" } } },
        { slug: "/contact", content: { contact: { email: "hello@lux.com" } } },
      ],
    });
    expect(brief).toContain("Studio Lux");
    expect(brief).toContain("Photographe");
    expect(brief).toContain("hello@lux.com");
  });

  it("retourne une chaîne vide pour un contenu sans texte significatif", () => {
    const brief = briefFromSourceContent({ __css: "x", image: "/a.jpg", version: 2 });
    expect(brief).toBe("");
  });
});
