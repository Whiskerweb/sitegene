/**
 * [6] E2E logique des 4 profils types — photographe mariage, DJ, électricien,
 * développeuse — sur les VRAIES données de templates (public/_templates).
 *
 * Vérifie la chaîne complète côté logique : détection du métier → questions de
 * la catégorie → recommandation de template → mapping du contenu (marque,
 * photos cyclées, placeholders) → directives de masquage (jamais de contenu
 * inventé sur le site final).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { detectCategory } from "./category-detect";
import { mineIntake } from "./intake-mine";
import {
  questionsFor,
  recommendTemplateForIntake,
  type Intake,
} from "./onboarding-config";
import { getCategory } from "./categories";
import { isTemplateId, TEMPLATE_IDS } from "./templates";
import {
  intakeToOverrides,
  photoSlotUrls,
  buildPhotoMap,
  PHOTO_PLACEHOLDER_URL,
  type TemplateManifest,
} from "./intake-map";
import { flagsForIntake, dropSectionsForFlags, dropItemPathsForContent } from "./section-flags";

const tplDir = (tid: string) => join(process.cwd(), "public", "_templates", tid);
const loadContent = (tid: string) =>
  JSON.parse(readFileSync(join(tplDir(tid), "default-content.json"), "utf8")) as Record<
    string,
    unknown
  >;
const loadManifest = (tid: string) =>
  JSON.parse(readFileSync(join(tplDir(tid), "manifest.json"), "utf8")) as TemplateManifest;

type Profile = {
  name: string;
  brief: string;
  categoryId: string;
  intake: Intake;
  expectedTemplate?: string;
};

const PROFILES: Profile[] = [
  {
    name: "photographe mariage",
    brief: "Camille, photographe mariage à Lyon. Lumière naturelle, émotions vraies.",
    categoryId: "photographe",
    expectedTemplate: "luxury-wedding",
    intake: {
      brand: "Camille Studio",
      eventTypes: ["mariage", "portrait"],
      photoUrls: ["https://storage/x/1.jpg", "https://storage/x/2.jpg", "https://storage/x/3.jpg"],
      contactEmail: "camille@studio.fr",
    },
  },
  {
    name: "musicien (DJ)",
    brief: "Léo, DJ et producteur électro à Marseille. Sets live, clubs et festivals.",
    categoryId: "musicien",
    intake: {
      categoryId: "musicien",
      brand: "Léo M.",
      genre: "électro, techno",
      photoUrls: ["https://storage/y/live.jpg"],
      contactEmail: "booking@leom.fr",
    },
  },
  {
    name: "artisan électricien",
    brief: "Électricien à Nantes : dépannage, tableaux, mise aux normes. Devis gratuit.",
    categoryId: "artisan",
    intake: {
      categoryId: "artisan",
      brand: "Élec Nantes",
      trade: "Électricien : dépannage, tableaux, mise aux normes",
      area: "Nantes et alentours",
      photoUrls: [], // aucune photo → placeholders + galerie masquée
      contactPhone: "06 12 34 56 78",
      contactEmail: "contact@elecnantes.fr",
    },
  },
  {
    name: "développeuse (portfolio)",
    brief: "Alex, développeuse front-end freelance à Paris. React, TypeScript, design systems.",
    categoryId: "portfolio",
    intake: {
      categoryId: "portfolio",
      brand: "Alex Morel",
      jobTitle: "Développeuse front-end",
      skills: "React, TypeScript, design systems",
      photoUrls: ["https://storage/z/p1.png", "https://storage/z/p2.png"],
      contactEmail: "alex@morel.dev",
    },
  },
];

describe.each(PROFILES)("profil « $name »", (profile) => {
  const cat = getCategory(profile.categoryId)!;

  it("le métier est détecté depuis le brief, avec confiance haute", () => {
    const det = detectCategory(profile.brief);
    expect(det.categoryId).toBe(profile.categoryId);
    expect(det.confidence).toBe("high");
  });

  it("la catégorie a son propre jeu de questions (jamais le parcours photographe par défaut)", () => {
    const qs = questionsFor(profile.categoryId);
    expect(qs.length).toBeGreaterThanOrEqual(5);
    expect(qs[0].key).toBe("brand");
    if (profile.categoryId === "musicien") {
      expect(qs.some((q) => q.key === "genre")).toBe(true);
      expect(qs.some((q) => q.key === "musicLinks")).toBe(true);
    }
    if (profile.categoryId === "artisan") {
      expect(qs.some((q) => q.key === "trade")).toBe(true);
      expect(qs.some((q) => q.key === "area")).toBe(true);
    }
    if (profile.categoryId === "portfolio") {
      expect(qs.some((q) => q.key === "skills")).toBe(true);
      expect(qs.some((q) => q.key === "projects")).toBe(true);
    }
  });

  it("le brief mine des champs (la question correspondante ne sera pas reposée)", () => {
    const mined = mineIntake(profile.brief);
    expect(mined.city).toBeTruthy();
  });

  const tid = (() => {
    const raw = recommendTemplateForIntake(
      { ...profile.intake, brief: profile.brief },
      cat.defaultTemplateId,
    );
    return isTemplateId(raw) ? raw : cat.defaultTemplateId;
  })();

  it(`recommande un template existant et cohérent (${tid})`, () => {
    expect((TEMPLATE_IDS as readonly string[]).includes(tid)).toBe(true);
    if (profile.expectedTemplate) expect(tid).toBe(profile.expectedTemplate);
    if (profile.categoryId === "musicien") expect(tid).toBe("dj-electro");
    if (profile.categoryId === "artisan") expect(tid).toBe("electrician-pro");
  });

  const content = loadContent(tid);
  const manifest = loadManifest(tid);

  it("la marque du client est appliquée au contenu réel du template", () => {
    const overrides = intakeToOverrides(profile.intake, content, manifest);
    const values = Object.values(overrides);
    expect(values).toContain(profile.intake.brand);
  });

  it("photos : cyclées sur TOUS les slots, ou placeholders — jamais une photo de démo", () => {
    const slots = photoSlotUrls(content, tid, manifest);
    expect(slots.length).toBeGreaterThan(0);
    const map = buildPhotoMap(slots, profile.intake.photoUrls ?? [], PHOTO_PLACEHOLDER_URL);
    for (const slot of slots) {
      expect(map[slot]).toBeTruthy();
      // la valeur est une photo client OU le placeholder neutre, jamais la démo
      const v = map[slot];
      const isClient = (profile.intake.photoUrls ?? []).includes(v);
      expect(isClient || v === PHOTO_PLACEHOLDER_URL).toBe(true);
    }
  });

  it("masquage : aucun bloc inventé (témoignages, logos, stats, blog, équipe) ne survit", () => {
    const flags = flagsForIntake(profile.intake);
    const keys = Object.keys(content).filter((k) => !k.startsWith("__"));
    const drop = dropSectionsForFlags(keys, flags);
    for (const k of keys) {
      if (/^(testimonials?|logos?|stats?|blog|team)$/i.test(k)) {
        expect(drop).toContain(k);
      }
    }
    // sans photo → la galerie est masquée aussi
    if ((profile.intake.photoUrls ?? []).length === 0) {
      for (const k of keys) {
        if (/^(gallery|galerie|portfolio|works)$/i.test(k)) expect(drop).toContain(k);
      }
    }
  });

  it("spécialités cochées → les items en trop sont masqués", () => {
    const flags = flagsForIntake(profile.intake);
    const items = dropItemPathsForContent(content, flags.specialtyCount);
    if (flags.specialtyCount > 0) {
      // si le template a plus d'items de services que de spécialités, ils tombent
      for (const p of items) {
        expect(p).toMatch(/^(services|prestations|specialties)/i);
      }
    } else {
      expect(items).toEqual([]);
    }
  });

  it("le contenu du template ne contient ni Lorem ipsum ni placeholder anglais évident", () => {
    const text = JSON.stringify(content).toLowerCase();
    expect(text).not.toContain("lorem ipsum");
    expect(text).not.toContain("your name here");
    expect(text).not.toContain("description ici");
  });
});
