import { describe, it, expect } from "vitest";
import { mineIntake, mergeMined } from "./intake-mine";

/* [3.1] Extraction de champs depuis un texte libre. */
describe("mineIntake", () => {
  it("extrait email et téléphone", () => {
    const m = mineIntake("Contact : camille@studio.fr ou 06 12 34 56 78");
    expect(m.contactEmail).toBe("camille@studio.fr");
    expect(m.contactPhone).toBe("06 12 34 56 78");
  });

  it("extrait les années d'expérience", () => {
    expect(mineIntake("Plombier, 15 ans d'expérience").experienceYears).toBe("15 ans");
    expect(mineIntake("Photographe depuis 2012").experienceYears).toBe("depuis 2012");
  });

  it("extrait une fourchette de prix", () => {
    expect(mineIntake("Séances à partir de 350 €").priceRange).toBe("à partir de 350 €");
    expect(mineIntake("Forfait 90€").priceRange).toBe("90 €");
  });

  it("extrait la ville", () => {
    expect(mineIntake("Camille, photographe mariage à Lyon.").city).toBe("Lyon");
    expect(mineIntake("Basé à La Rochelle depuis dix ans").city).toBe("La Rochelle");
  });

  it("extrait les spécialités photographe mentionnées", () => {
    const m = mineIntake("Je couvre les mariages, les naissances et le portrait.");
    expect(m.eventTypes).toEqual(
      expect.arrayContaining(["mariage", "grossesse", "portrait"]),
    );
  });

  it("extrait le genre musical", () => {
    expect(mineIntake("DJ électro et techno sur Marseille").genre).toContain("techno");
  });

  it("extrait un pseudo Instagram", () => {
    expect(mineIntake("Retrouvez-moi sur instagram.com/camille.photo").instagram).toBe(
      "camille.photo",
    );
    expect(mineIntake("Mon insta : @leo_dj").instagram).toBe("leo_dj");
  });

  it("texte vide → rien", () => {
    expect(mineIntake("")).toEqual({});
  });
});

describe("mergeMined", () => {
  it("ne remplace jamais une réponse explicite du client", () => {
    const merged = mergeMined(
      { contactEmail: "explicite@client.fr", city: "" },
      { contactEmail: "mine@web.fr", city: "Lyon" },
    );
    expect(merged.contactEmail).toBe("explicite@client.fr");
    expect(merged.city).toBe("Lyon");
  });

  it("remplit les tableaux vides seulement", () => {
    const merged = mergeMined(
      { eventTypes: ["portrait"] },
      { eventTypes: ["mariage"], genre: "jazz" },
    );
    expect(merged.eventTypes).toEqual(["portrait"]);
    expect(merged.genre).toBe("jazz");
  });
});
