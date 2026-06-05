import { describe, it, expect } from "vitest";
import { detectCategory } from "./category-detect";

/* [2.1] Détection du corps de métier depuis un texte libre. */
describe("detectCategory", () => {
  it("détecte un musicien nommé explicitement (haut niveau de confiance)", () => {
    const r = detectCategory("Léo, DJ et producteur de musique à Marseille.");
    expect(r.categoryId).toBe("musicien");
    expect(r.confidence).toBe("high");
  });

  it("détecte le métier même en milieu de paragraphe [2.3]", () => {
    const r = detectCategory(
      "Bonjour, je vis à Nantes depuis 10 ans et je cherche à montrer mon travail. Je suis électricien et j'interviens sur tout le département.",
    );
    expect(r.categoryId).toBe("artisan");
    expect(r.confidence).toBe("high");
  });

  it("est insensible aux accents et à la casse", () => {
    const r = detectCategory("ÉLECTRICIEN à Lyon, dépannage rapide");
    expect(r.categoryId).toBe("artisan");
    expect(r.confidence).toBe("high");
  });

  it("détecte un photographe de mariage", () => {
    const r = detectCategory("Camille, photographe mariage à Lyon. Lumière naturelle.");
    expect(r.categoryId).toBe("photographe");
    expect(r.confidence).toBe("high");
  });

  it("un DJ pour mariages reste musicien (le signal fort l'emporte)", () => {
    const r = detectCategory("DJ pour mariages et soirées d'entreprise");
    expect(r.categoryId).toBe("musicien");
    expect(r.confidence).toBe("high");
  });

  it("détecte un développeur (portfolio)", () => {
    const r = detectCategory("Développeur web freelance, React et Node, basé à Paris");
    expect(r.categoryId).toBe("portfolio");
    expect(r.confidence).toBe("high");
  });

  it("signal faible isolé → confiance basse (confirmation requise) [2.2]", () => {
    const r = detectCategory("Je fais des photos de temps en temps");
    expect(r.categoryId).toBe("photographe");
    expect(r.confidence).toBe("low");
  });

  it("aucun signal → none (demander le métier)", () => {
    const r = detectCategory("Bonjour, je voudrais un joli site s'il vous plaît");
    expect(r.categoryId).toBeNull();
    expect(r.confidence).toBe("none");
  });

  it("texte vide → none", () => {
    expect(detectCategory("").confidence).toBe("none");
    expect(detectCategory("  ").confidence).toBe("none");
  });

  it("« déjà » ne déclenche pas « dj » (mot entier)", () => {
    const r = detectCategory("J'ai déjà un logo et des couleurs");
    expect(r.scores.musicien).toBe(0);
  });

  it("signaux contradictoires équilibrés → confiance basse, jamais de routage silencieux", () => {
    const r = detectCategory("photographe et chanteuse");
    expect(r.confidence).toBe("low");
  });

  it("détecte un artisan via son entreprise (plomberie)", () => {
    const r = detectCategory("Atelier Martin, plomberie et chauffage à Rennes, devis sous 48 h");
    expect(r.categoryId).toBe("artisan");
    expect(r.confidence).toBe("high");
  });
});
