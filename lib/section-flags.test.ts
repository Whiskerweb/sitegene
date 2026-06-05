import { describe, it, expect } from "vitest";
import {
  flagsForIntake,
  dropSectionsForFlags,
  dropItemPathsForContent,
  truncateSpaServices,
} from "./section-flags";

/* [5.2/5.3] Masquage conditionnel des blocs sans données client. */
describe("flagsForIntake", () => {
  it("galerie autorisée seulement avec des photos", () => {
    expect(flagsForIntake({}).hasGallery).toBe(false);
    expect(flagsForIntake({ photoUrls: ["a.jpg"] }).hasGallery).toBe(true);
  });

  it("témoignages/clients jamais autorisés (non collectés = inventés)", () => {
    const f = flagsForIntake({ photoUrls: ["a.jpg"] });
    expect(f.hasTestimonials).toBe(false);
    expect(f.hasClients).toBe(false);
  });

  it("specialtyCount = spécialités explicitement cochées", () => {
    expect(flagsForIntake({ eventTypes: ["mariage", "portrait"] }).specialtyCount).toBe(2);
    expect(flagsForIntake({}).specialtyCount).toBe(0);
  });
});

describe("dropSectionsForFlags", () => {
  const flags = flagsForIntake({ photoUrls: ["a.jpg"] });

  it("masque témoignages, logos, stats, blog, équipe — garde hero/services/contact", () => {
    const drop = dropSectionsForFlags(
      ["hero", "logos", "services", "testimonial", "stats", "blog", "team", "faq", "contact"],
      flags,
    );
    expect(drop).toEqual(
      expect.arrayContaining(["logos", "testimonial", "stats", "blog", "team"]),
    );
    expect(drop).not.toContain("hero");
    expect(drop).not.toContain("services");
    expect(drop).not.toContain("contact");
    expect(drop).not.toContain("faq");
  });

  it("masque la galerie sans photos, la garde avec", () => {
    expect(dropSectionsForFlags(["gallery"], flagsForIntake({}))).toContain("gallery");
    expect(dropSectionsForFlags(["gallery"], flags)).not.toContain("gallery");
  });
});

describe("dropItemPathsForContent — items en trop", () => {
  const content = {
    services: { items: [{ title: "A" }, { title: "B" }, { title: "C" }, { title: "D" }] },
  };

  it("2 spécialités cochées → items 2 et 3 masqués", () => {
    expect(dropItemPathsForContent(content, 2)).toEqual([
      "services.items[2]",
      "services.items[3]",
    ]);
  });

  it("aucun choix explicite → rien de masqué (l'IA personnalise tout)", () => {
    expect(dropItemPathsForContent(content, 0)).toEqual([]);
  });

  it("tableau racine (sans .items) géré aussi", () => {
    expect(dropItemPathsForContent({ services: [1, 2, 3] }, 1)).toEqual([
      "services[1]",
      "services[2]",
    ]);
  });
});

describe("truncateSpaServices — lignée SPA (contenu v2)", () => {
  it("tronque les prestations de chaque page au nombre coché", () => {
    const content = {
      pages: [{ content: { services: [{ name: "A" }, { name: "B" }, { name: "C" }] } }],
    };
    truncateSpaServices(content, 2);
    expect(
      (content.pages[0].content as { services: unknown[] }).services,
    ).toHaveLength(2);
  });
});
