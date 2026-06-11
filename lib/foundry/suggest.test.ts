// lib/foundry/suggest.test.ts
import { describe, it, expect } from "vitest";
import { detectTrade, suggestVibes } from "./suggest";
import { getVibe } from "./vibes";

describe("detectTrade", () => {
  it("détecte les métiers principaux", () => {
    expect(detectTrade("Je suis coach en développement personnel à Lyon").trade).toBe("coach");
    expect(detectTrade("Plombier chauffagiste, dépannage et rénovation").trade).toBe("artisan");
    expect(detectTrade("Photographe de mariage en Bretagne").trade).toBe("photographe");
    expect(detectTrade("Studio de yoga et méditation").trade).toBe("bien-etre");
    expect(detectTrade("Restaurant bistronomique au centre de Bordeaux").trade).toBe("restaurant");
    expect(detectTrade("Salon de coiffure et barbier").trade).toBe("beaute");
    expect(detectTrade("Consultant en stratégie pour PME").trade).toBe("conseil");
  });
  it("détecte le musicien et son sous-persona", () => {
    expect(detectTrade("Rappeur indépendant, nouveau projet").trade).toBe("musicien");
    expect(detectTrade("Rappeur indépendant, nouveau projet").sub).toBe("rap");
    expect(detectTrade("Groupe de rock garage en tournée").sub).toBe("rock");
    expect(detectTrade("Chanteuse, single intimiste acoustique").sub).toBe("contemporain");
    expect(detectTrade("Salle de sport et coaching sportif").trade).toBe("fitness");
  });
  it("retombe sur 'autre' sans signal", () => {
    expect(detectTrade("Je vends des choses sur internet").trade).toBe("autre");
    expect(detectTrade("").trade).toBe("autre");
  });
});

describe("suggestVibes", () => {
  it("classe toutes les vibes, recommandées en tête, avec raison", () => {
    const s = suggestVibes("Rappeur, nouvel album");
    expect(s.length).toBeGreaterThanOrEqual(6);
    expect(s[0].vibeId).toBe("rap-luxe");
    expect(s[0].recommended).toBe(true);
    for (const x of s) { expect(getVibe(x.vibeId)).toBeDefined(); expect(x.reason.length).toBeGreaterThan(8); }
  });
});
