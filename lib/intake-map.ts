/**
 * Mapping déterministe intake → surcharges texte, piloté par le MANIFEST du
 * template — fonctionne pour les DEUX lignées :
 *  - SPA  : chemins préfixés `pages[i].content.` (hero.brand, services[].name…)
 *  - HTML : chemins à plat (brand, hero.title, services.items[].title…)
 *
 * Module PUR et client-safe : utilisé côté serveur (construction du contenu)
 * ET côté client (aperçu temps réel par postMessage). Chaque chemin n'est posé
 * que s'il existe déjà dans le contenu (on ne salit jamais la structure).
 */
import { collectImageSlots, getPath } from "./content-overlay";
import { eventLabel, type Intake } from "./onboarding-config";

export type EditableField = { path?: string; type?: string; maxLen?: number };
export type ManifestPhoto = { slot?: string; path?: string; role?: string; required?: boolean };
export type TemplateManifest = {
  fields?: { editable?: EditableField[] };
  photos?: ManifestPhoto[];
} & Record<string, unknown>;

/** Bases réelles des chemins : pages v2 (`pages[i].content`) ou racine (plat). */
export function contentBases(defaultContent: Record<string, unknown>): string[] {
  const pages = (defaultContent as { pages?: unknown[] }).pages;
  return Array.isArray(pages) && pages.length > 0
    ? pages.map((_, i) => `pages[${i}].content`)
    : [""];
}

const joinBase = (base: string, p: string) => (base ? `${base}.${p}` : p);

/** Étend un chemin manifest ("services[].name") en chemins concrets indexés. */
export function expandManifestPath(
  defaultContent: Record<string, unknown>,
  base: string,
  path: string,
): string[] {
  const m = path.match(/^(.*?)\[\]\.(.+)$/);
  if (!m) return [joinBase(base, path)];
  const [, arrPath, rest] = m;
  const arr = getPath(defaultContent, joinBase(base, arrPath));
  if (!Array.isArray(arr)) return [];
  return arr.map((_, i) => joinBase(base, `${arrPath}[${i}].${rest}`));
}

/** Chemins de service (nom/titre de prestation) dans les manifests des 2 lignées. */
const SERVICE_PATH_RE = /^(?:services|prestations)(?:\.items)?\[\]\.(?:name|title)$/;

/** Candidats statiques (lignée SPA historique + variantes courantes), garde d'existence. */
const STATIC_CANDIDATES: Record<string, { paths: string[]; max: number }> = {
  brand: { paths: ["brand", "hero.brand", "site.brand"], max: 40 },
  about: { paths: ["hero.subtitle", "hero.tagline", "scrollText", "about.text"], max: 260 },
  contactEmail: { paths: ["footer.email", "site.footer.email", "topbar.email", "contact.email"], max: 80 },
  contactPhone: { paths: ["topbar.phone", "contact.phone", "cta.phone", "footer.phone"], max: 40 },
};

/**
 * Traduit l'intake structuré en surcharges texte `{ chemin concret: valeur }`.
 * Pilotage par le manifest quand il est fourni, complété par les candidats
 * statiques — toujours bornés par maxLen et l'existence du chemin.
 */
export function intakeToOverrides(
  intake: Intake,
  defaultContent: Record<string, unknown>,
  manifest?: TemplateManifest | null,
): Record<string, string> {
  const bases = contentBases(defaultContent);
  const editable = (manifest?.fields?.editable ?? []).filter(
    (f): f is EditableField & { path: string } => typeof f?.path === "string",
  );
  const out: Record<string, string> = {};

  const put = (path: string, value: string | undefined, max: number) => {
    if (!value) return;
    if (getPath(defaultContent, path) === undefined) return; // chemin inexistant → on s'abstient
    out[path] = value.trim().slice(0, max);
  };

  /** Chemins concrets des champs éditables dont le path manifeste matche `pred`. */
  const concretes = (pred: (p: string) => boolean) =>
    editable
      .filter((f) => pred(f.path))
      .flatMap((f) =>
        bases.flatMap((b) =>
          expandManifestPath(defaultContent, b, f.path).map((p) => ({
            path: p,
            maxLen: f.maxLen ?? 120,
          })),
        ),
      );

  const applyField = (
    value: string | undefined,
    pred: (p: string) => boolean,
    statics: { paths: string[]; max: number },
  ) => {
    if (!value) return;
    for (const c of concretes(pred)) put(c.path, value, c.maxLen);
    for (const b of bases) {
      for (const p of statics.paths) put(joinBase(b, p), value, statics.max);
    }
    // candidats statiques à la racine (shell v2 : site.brand, site.footer.email)
    for (const p of statics.paths) {
      if (p.startsWith("site.")) put(p, value, statics.max);
    }
  };

  // Marque / accroche / contact.
  applyField(intake.brand, (p) => p === "brand" || p.endsWith(".brand"), STATIC_CANDIDATES.brand);
  applyField(
    intake.about,
    (p) => ["hero.subtitle", "hero.tagline", "scrollText", "about.text"].includes(p),
    STATIC_CANDIDATES.about,
  );
  applyField(
    intake.contactEmail,
    (p) => p === "email" || p.endsWith(".email"),
    STATIC_CANDIDATES.contactEmail,
  );
  applyField(
    intake.contactPhone,
    (p) => p === "phone" || p.endsWith(".phone"),
    STATIC_CANDIDATES.contactPhone,
  );
  // Musicien : fiche technique → bloc dédié (page contact/booking).
  applyField(
    intake.techRider,
    (p) => p === "techRider" || p.endsWith(".techRider"),
    { paths: ["contactPage.techRider", "booking.techRider"], max: 600 },
  );

  // Services = prestations du client (photographe : types d'événements).
  const names = (intake.services?.length
    ? intake.services
    : (intake.eventTypes ?? []).map(eventLabel)
  ).filter(Boolean);
  if (names.length > 0) {
    const serviceFields = editable.filter((f) => SERVICE_PATH_RE.test(f.path));
    // Repli statique si le manifest est absent (lignée SPA historique).
    const fields = serviceFields.length
      ? serviceFields
      : [{ path: "services[].name", maxLen: 40 } as EditableField & { path: string }];
    for (const f of fields) {
      for (const b of bases) {
        const targets = expandManifestPath(defaultContent, b, f.path);
        targets.forEach((p, i) => {
          if (i < names.length) put(p, names[i], f.maxLen ?? 40);
        });
      }
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Photos : slots catégorisés par rôle (cohérence des images)
// ---------------------------------------------------------------------------

/** Slots où une photo client n'a JAMAIS sa place (visages témoins, logos…). */
const EXCLUDED_PHOTO_ROLES = new Set(["avatar", "logo", "icon", "favicon"]);
/** Ordre de remplissage : les photos du client vont d'abord aux emplacements forts. */
const ROLE_PRIORITY = ["hero", "cover", "image", "service", "work", "gallery", "background"];

/**
 * URLs démo des slots photo d'un template, ORDONNÉES par rôle (hero → services
 * → galerie) et purgées des slots avatar/logo — pilotées par manifest.photos.
 * Les photos du client remplacent ces URLs dans cet ordre : la 1re photo va au
 * hero, jamais à un avatar de témoignage. Repli : scan brut des images du
 * contenu (comportement historique, lignée SPA sans `path` dans le manifest).
 */
export function photoSlotUrls(
  defaultContent: Record<string, unknown>,
  templateId: string,
  manifest?: TemplateManifest | null,
): string[] {
  const photos = (manifest?.photos ?? []).filter(
    (p): p is ManifestPhoto & { path: string } => typeof p?.path === "string",
  );
  const bases = contentBases(defaultContent);
  const rank = (role: string) => {
    const i = ROLE_PRIORITY.indexOf(role);
    return i < 0 ? ROLE_PRIORITY.length : i;
  };

  const entries: { url: string; role: string; order: number }[] = [];
  photos.forEach((ph, idx) => {
    const role = (ph.role ?? "image").toLowerCase();
    if (EXCLUDED_PHOTO_ROLES.has(role)) return;
    for (const b of bases) {
      for (const p of expandManifestPath(defaultContent, b, ph.path)) {
        const v = getPath(defaultContent, p);
        if (typeof v === "string" && v.includes(`/_templates/${templateId}/`)) {
          entries.push({ url: v, role, order: idx });
        }
      }
    }
  });

  if (entries.length === 0) return collectImageSlots(defaultContent, templateId);

  entries.sort((a, b) => rank(a.role) - rank(b.role) || a.order - b.order);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of entries) {
    if (!seen.has(e.url)) {
      seen.add(e.url);
      out.push(e.url);
    }
  }
  return out;
}

/** Placeholder neutre servi quand le client n'a fourni aucune photo. */
export const PHOTO_PLACEHOLDER_URL = "/img/photo-placeholder.svg";

/**
 * Carte de remplacement des slots photo. Le site construit ne doit JAMAIS
 * garder une photo de démo (le client ne s'y reconnaîtrait pas) :
 *  - ≥ 1 photo client → ses photos sont CYCLÉES sur tous les slots ;
 *  - 0 photo → tous les slots passent sur `emptySlotUrl` (placeholder neutre),
 *    sauf si `emptySlotUrl` est null/omis (mode démo conservé — tunnel outreach,
 *    où les visuels de démo font partie du site pré-fait).
 */
export function buildPhotoMap(
  slots: string[],
  photoUrls: string[],
  emptySlotUrl?: string | null,
): Record<string, string> {
  const map: Record<string, string> = {};
  if (photoUrls.length > 0) {
    slots.forEach((slot, i) => {
      map[slot] = photoUrls[i % photoUrls.length];
    });
  } else if (emptySlotUrl) {
    for (const slot of slots) map[slot] = emptySlotUrl;
  }
  return map;
}
