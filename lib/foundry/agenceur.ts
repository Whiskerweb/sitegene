// lib/foundry/agenceur.ts
// L'AGENCEUR : transforme un pitch client en recette de site GARANTIE VALIDE.
// Mistral n'invente rien — il pioche dans le catalogue (manifests), ordonne les
// sections comme un architecte et réécrit les textes au métier du client. Toute
// sortie passe par normalisation (formes calées sur les samples) + réparation
// (hero/footer garantis, rôles dédupliqués) + repli déterministe si l'IA échoue :
// la génération ne peut PAS échouer. Zéro import réseau ici (chatFn injectée).
import type { Recipe, RecipeSection, Vibe, VibeId } from "./types";
import { getManifest, listManifests } from "./manifests";
import { getSample } from "./samples";
import { getVibe } from "./vibes";
import { validateRecipe } from "./recipe";
import { detectTrade, type TradeId } from "./suggest";

export interface AgenceurInput {
  brief: string;
  businessName: string;
  vibeId: string;
  /** Accent personnalisé (hex) choisi sur la carte DA — facultatif. */
  accent?: string;
  /** Charte sur mesure (déjà RÉPARÉE via repairCharte) — prime sur vibeId. */
  customVibe?: Vibe;
}

export type ChatFn = (
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  opts?: { json?: boolean; maxTokens?: number },
) => Promise<string>;

export interface AgenceurResult {
  recipe: Recipe;
  /** "ai" = recette de Mistral (réparée) ; "fallback" = repli déterministe. */
  source: "ai" | "fallback";
}

// --- Normalisation du contenu --------------------------------------------------

const IMAGE_KEY = /image|avatar|photo|logo$/i;
const MAX_TEXT = 600;

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

/** Clés de référence d'un item de liste : union des clés de tous les items du sample. */
function mergedItemRef(sampleItems: Record<string, unknown>[]): Record<string, unknown> {
  const ref: Record<string, unknown> = {};
  for (const it of sampleItems) {
    for (const [k, v] of Object.entries(it)) if (!(k in ref)) ref[k] = v;
  }
  return ref;
}

/** Options de normalisation. `userImages` : accepte une URL d'image fournie par
 * l'utilisateur (édition manuelle) au lieu de forcer la banque (cas agenceur). */
type NormOpts = { userImages?: boolean; keepEmpty?: boolean };

/** Une chaîne d'image est acceptée si non vide (URL uploadée ou chemin /_templates). */
function acceptedImage(rawVal: unknown, fallback: unknown): unknown {
  return typeof rawVal === "string" && rawVal.trim() ? rawVal.trim().slice(0, 2000) : fallback;
}

function normalizeValue(sampleVal: unknown, rawVal: unknown, key: string, opts: NormOpts = {}): unknown {
  if (IMAGE_KEY.test(key)) {
    // Agenceur : images TOUJOURS de la banque (l'IA n'invente pas d'URL).
    // Édition manuelle : on accepte l'URL (ou la liste d'URL) choisie par le client.
    if (!opts.userImages) return sampleVal;
    if (Array.isArray(sampleVal)) {
      if (!Array.isArray(rawVal)) return sampleVal;
      const imgs = rawVal.filter((x): x is string => typeof x === "string" && !!x.trim()).map((x) => x.trim().slice(0, 2000)).slice(0, 12);
      return imgs.length > 0 ? imgs : sampleVal;
    }
    return acceptedImage(rawVal, sampleVal);
  }

  if (typeof sampleVal === "string") {
    return typeof rawVal === "string" && rawVal.trim() ? rawVal.trim().slice(0, MAX_TEXT) : sampleVal;
  }
  if (typeof sampleVal === "number") {
    return typeof rawVal === "number" && Number.isFinite(rawVal) ? rawVal : sampleVal;
  }
  if (typeof sampleVal === "boolean") {
    return typeof rawVal === "boolean" ? rawVal : sampleVal;
  }
  if (Array.isArray(sampleVal)) {
    if (!Array.isArray(rawVal)) return sampleVal;
    // Édition manuelle : une liste vidée par le client est PRÉSERVÉE (il a le
    // droit de tout supprimer). Sortie IA : on retombe sur le sample (rendable).
    if (rawVal.length === 0) return opts.keepEmpty ? [] : sampleVal;
    // Liens de navigation : mélange accepté de chaînes et d'objets {label,target}
    // ({target} = page du site, posé par addNavLink — à PRÉSERVER, undo compris).
    if (key === "links") {
      const links = rawVal
        .map((x) => {
          if (typeof x === "string" && x.trim()) return x.trim().slice(0, 80);
          if (isPlainObject(x) && typeof x.label === "string" && x.label.trim()) {
            const label = x.label.trim().slice(0, 80);
            const target = typeof x.target === "string" && x.target.trim() ? x.target.trim().slice(0, 120) : undefined;
            return target ? { label, target } : label;
          }
          return null;
        })
        .filter((x): x is string | { label: string; target: string } => x !== null)
        .slice(0, 8);
      return links.length > 0 ? links : sampleVal;
    }
    const first = sampleVal[0];
    if (typeof first === "string") {
      // Tableau de chaînes (images intercepté plus haut, ou texte pur).
      const items = rawVal
        .filter((x): x is string => typeof x === "string" && !!x.trim())
        .map((x) => x.trim().slice(0, MAX_TEXT))
        .slice(0, 12);
      return items.length > 0 ? items : sampleVal;
    }
    if (isPlainObject(first)) {
      const sampleItems = sampleVal.filter(isPlainObject);
      const ref = mergedItemRef(sampleItems);
      const items = rawVal
        .filter(isPlainObject)
        .slice(0, 12)
        .map((rawItem, i) => {
          const base = sampleItems[i % sampleItems.length];
          const out: Record<string, unknown> = {};
          for (const k of Object.keys(ref)) {
            if (IMAGE_KEY.test(k)) {
              out[k] = opts.userImages
                ? acceptedImage(rawItem[k], k in base ? base[k] : ref[k])
                : k in base
                  ? base[k]
                  : ref[k];
            } else if (k in rawItem) {
              out[k] = normalizeValue(ref[k], rawItem[k], k, opts);
            } else if (k in base) {
              out[k] = base[k];
            }
          }
          return out;
        });
      return items.length > 0 ? items : sampleVal;
    }
    return sampleVal;
  }
  if (isPlainObject(sampleVal)) {
    const raw = isPlainObject(rawVal) ? rawVal : {};
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(sampleVal)) out[k] = normalizeValue(sampleVal[k], raw[k], k, opts);
    return out;
  }
  return sampleVal;
}

/**
 * Contenu d'une section, calé sur la FORME du sample du composant : chaque clé
 * manquante ou mal typée retombe sur le sample. Garantit qu'un composant reçoit
 * toujours des props rendables (jamais de crash de rendu sur sortie IA).
 */
export function normalizeSectionContent(
  componentId: string,
  raw: unknown,
): Record<string, unknown> {
  const sample = getSample(componentId);
  const rawObj = isPlainObject(raw) ? raw : {};
  const manifest = getManifest(componentId);
  const keys = new Set<string>([...Object.keys(sample), ...(manifest?.contentKeys ?? [])]);
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    out[key] = normalizeValue(sample[key], rawObj[key], key);
  }
  return out;
}

/**
 * Contenu édité À LA MAIN par le propriétaire : même calage sur la forme du
 * sample, mais on PRÉSERVE ses textes ET ses images (URL uploadées ou choisies).
 * Sert à l'éditeur visuel — jamais à l'agenceur.
 */
export function sanitizeUserContent(
  componentId: string,
  raw: unknown,
): Record<string, unknown> {
  const sample = getSample(componentId);
  const rawObj = isPlainObject(raw) ? raw : {};
  const manifest = getManifest(componentId);
  const keys = new Set<string>([...Object.keys(sample), ...(manifest?.contentKeys ?? [])]);
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    out[key] = normalizeValue(sample[key], rawObj[key], key, { userImages: true, keepEmpty: true });
  }
  return out;
}

// --- Réparation de la recette --------------------------------------------------

/** Champs de marque injectés quoi qu'il arrive (IA comme fallback). */
function applyBusinessName(sections: RecipeSection[], businessName: string): void {
  const name = businessName.trim().slice(0, 60);
  if (!name) return;
  for (const s of sections) {
    if (s.component === "footer-columns") {
      s.content.brand = name;
      s.content.copyright = `© ${name}. Tous droits réservés.`;
    }
  }
}

const HEX = /^#[0-9a-fA-F]{6}$/;

// --- Report SÉMANTIQUE de contenu (remplacement de section) -------------------
// Les composants n'ont pas les mêmes clés (title vs titleA/B/C, tagline vs
// subtitle…). On reporte donc par RÔLE de champ, pas par nom de clé, pour que la
// nouvelle pièce hérite du titre/texte/images du client — jamais du sample.
const HEADING_KEY = /^(title|titlea|titleb|titlec|heading|headline)$/i;
const EYEBROW_KEY = /^(eyebrow|badge|label|kicker)$/i;
const PARA_KEY = /^(subtitle|subhead|tagline|desc|description|body|text|intro|bio|paragraph|lead)$/i;
const CTA_KEY = /^(cta|button|buttonlabel|action)$/i;

type FieldCat = "heading" | "eyebrow" | "para" | "cta" | "image" | "imageList" | "other";
function catOf(key: string, val: unknown): FieldCat {
  if (IMAGE_KEY.test(key)) return Array.isArray(val) ? "imageList" : "image";
  if (HEADING_KEY.test(key)) return "heading";
  if (EYEBROW_KEY.test(key)) return "eyebrow";
  if (CTA_KEY.test(key)) return "cta";
  if (PARA_KEY.test(key)) return "para";
  return "other";
}

/** Répartit un texte en n lignes par mots (titre simple ↔ titre multi-lignes). */
function splitInto(text: string, n: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (n <= 1) return [text];
  const per = Math.ceil(words.length / n);
  const parts: string[] = [];
  for (let i = 0; i < n; i++) parts.push(words.slice(i * per, (i + 1) * per).join(" "));
  return parts;
}

/**
 * Adapte le contenu du client à la FORME d'un autre composant (remplacement) :
 * son titre devient le titre, son texte le texte, ses images les images — même
 * si les noms de clés diffèrent. Les champs sans équivalent gardent le sample.
 */
export function adaptContent(toId: string, fromContent: unknown): Record<string, unknown> {
  const sample = getSample(toId);
  const src = isPlainObject(fromContent) ? fromContent : {};

  const pool: Record<"heading" | "eyebrow" | "para" | "cta", string[]> = { heading: [], eyebrow: [], para: [], cta: [] };
  const srcImages: string[] = [];
  for (const [k, v] of Object.entries(src)) {
    const c = catOf(k, v);
    if (c === "image") {
      if (typeof v === "string" && v.trim()) srcImages.push(v.trim());
    } else if (c === "imageList") {
      if (Array.isArray(v)) for (const x of v) if (typeof x === "string" && x.trim()) srcImages.push(x.trim());
    } else if (c === "heading" || c === "eyebrow" || c === "para" || c === "cta") {
      if (typeof v === "string" && v.trim()) pool[c].push(v.trim());
    }
  }

  const out: Record<string, unknown> = {};
  const headingKeys = Object.entries(sample).filter(([k, v]) => catOf(k, v) === "heading").map(([k]) => k);
  if (headingKeys.length && pool.heading.length) {
    const lines = pool.heading.length >= headingKeys.length
      ? pool.heading.slice(0, headingKeys.length)
      : splitInto(pool.heading.join(" "), headingKeys.length);
    headingKeys.forEach((k, i) => { out[k] = lines[i] || pool.heading[pool.heading.length - 1] || sample[k]; });
  }

  const idx = { eyebrow: 0, para: 0, cta: 0 };
  let imgPtr = 0;
  const done = new Set(headingKeys);
  for (const [k, v] of Object.entries(sample)) {
    if (done.has(k)) continue;
    const c = catOf(k, v);
    if (c === "eyebrow" || c === "para" || c === "cta") {
      const p = pool[c]; const i = idx[c]++;
      out[k] = p[i] ?? p[p.length - 1] ?? sample[k]; // ordre puis réutilise le dernier (jamais le sample étranger si une source existe)
    } else if (c === "image") {
      out[k] = imgPtr < srcImages.length ? srcImages[imgPtr++] : (srcImages[srcImages.length - 1] ?? sample[k]);
    } else if (c === "imageList") {
      const rest = srcImages.slice(imgPtr);
      out[k] = rest.length ? rest : sample[k];
      imgPtr = srcImages.length;
    } else if (Array.isArray(v) && Array.isArray((src as Record<string, unknown>)[k])) {
      out[k] = (src as Record<string, unknown>)[k]; // liste de même clé (avis, étapes…) : contenu client conservé
    } else {
      out[k] = sample[k];
    }
  }
  // Garantit formes/longueurs rendables tout en préservant les images du client.
  return sanitizeUserContent(toId, out);
}

/**
 * Construit une recette VALIDE à partir de sections brutes (sortie IA) :
 * composants inconnus écartés, un seul composant par rôle, hero en tête et
 * footer en queue (injectés si absents), contenus normalisés sur les samples.
 */
export function repairRecipe(
  rawSections: unknown,
  input: AgenceurInput,
): Recipe {
  const customVibe = input.customVibe;
  const vibeId: string = customVibe ? "custom" : ((getVibe(input.vibeId)?.id ?? "warm-serif") as VibeId);
  const accent = input.accent && HEX.test(input.accent.trim()) ? input.accent.trim() : undefined;

  const seenRoles = new Set<string>();
  const sections: RecipeSection[] = [];
  const list = Array.isArray(rawSections) ? rawSections : [];
  for (const raw of list) {
    if (!isPlainObject(raw) || typeof raw.component !== "string") continue;
    const manifest = getManifest(raw.component);
    if (!manifest) continue;
    if (seenRoles.has(manifest.role)) continue; // un seul composant par rôle
    seenRoles.add(manifest.role);
    sections.push({
      component: manifest.id,
      content: normalizeSectionContent(manifest.id, raw.content),
    });
  }

  // Hero en tête (injecté si absent).
  const heroIdx = sections.findIndex((s) => getManifest(s.component)?.role === "hero");
  if (heroIdx > 0) sections.unshift(sections.splice(heroIdx, 1)[0]);
  if (heroIdx === -1) {
    sections.unshift({ component: "hero-split-asym", content: normalizeSectionContent("hero-split-asym", {}) });
  }

  // Navbar (optionnelle) toujours TOUT en haut, avant le hero.
  const navIdx = sections.findIndex((s) => getManifest(s.component)?.role === "navbar");
  if (navIdx > 0) sections.unshift(sections.splice(navIdx, 1)[0]);

  // Footer en queue (injecté si absent).
  const footIdx = sections.findIndex((s) => getManifest(s.component)?.role === "footer");
  if (footIdx !== -1 && footIdx !== sections.length - 1) sections.push(sections.splice(footIdx, 1)[0]);
  if (footIdx === -1) {
    sections.push({ component: "footer-columns", content: normalizeSectionContent("footer-columns", {}) });
  }

  // Page trop maigre (IA trop timide) : complète avec les rôles essentiels.
  if (sections.length < 5) {
    const fillers = ["intro-split", "services-rows", "testimonials-carousel", "contact-block", "cta-banner"];
    for (const id of fillers) {
      if (sections.length >= 6) break;
      const role = getManifest(id)!.role;
      if (seenRoles.has(role)) continue;
      seenRoles.add(role);
      sections.splice(sections.length - 1, 0, { component: id, content: normalizeSectionContent(id, {}) });
    }
  }

  applyBusinessName(sections, input.businessName);

  return { vibe: vibeId, customVibe, brand: accent ? { primary: accent } : undefined, sections };
}

// --- Repli déterministe ----------------------------------------------------------

/** Plans de page par métier (repli si l'IA est indisponible — textes des samples). */
const FALLBACK_PLANS: Record<TradeId, string[]> = {
  coach: ["hero-split-asym", "logo-marquee", "intro-split", "services-rows", "process-steps", "stats-countup", "reviews-postit-carousel", "pricing-cards", "faq-accordion", "contact-block", "cta-banner", "footer-columns"],
  "bien-etre": ["hero-split-asym", "intro-split", "services-rows", "process-steps", "reviews-postit-carousel", "pricing-cards", "faq-accordion", "contact-block", "cta-banner", "footer-columns"],
  photographe: ["hero-split-asym", "intro-split", "services-rows", "stats-countup", "testimonials-carousel", "faq-accordion", "contact-block", "cta-banner", "footer-columns"],
  artisan: ["hero-split-asym", "intro-split", "services-rows", "process-steps", "stats-countup", "testimonials-carousel", "faq-accordion", "contact-block", "cta-banner", "footer-columns"],
  restaurant: ["hero-split-asym", "intro-split", "services-rows", "testimonials-carousel", "faq-accordion", "contact-block", "cta-banner", "footer-columns"],
  beaute: ["hero-split-asym", "intro-split", "services-rows", "pricing-cards", "testimonials-carousel", "faq-accordion", "contact-block", "cta-banner", "footer-columns"],
  conseil: ["hero-split-asym", "logo-marquee", "intro-split", "services-rows", "process-steps", "stats-countup", "testimonials-carousel", "faq-accordion", "contact-block", "cta-banner", "footer-columns"],
  musicien: ["hero-split-asym", "intro-split", "services-rows", "stats-countup", "testimonials-carousel", "contact-block", "cta-banner", "footer-columns"],
  fitness: ["hero-split-asym", "intro-split", "services-rows", "process-steps", "stats-countup", "pricing-cards", "testimonials-carousel", "faq-accordion", "contact-block", "cta-banner", "footer-columns"],
  autre: ["hero-split-asym", "intro-split", "services-rows", "process-steps", "testimonials-carousel", "faq-accordion", "contact-block", "cta-banner", "footer-columns"],
};

/** Recette de secours, valide par construction. */
export function fallbackRecipe(input: AgenceurInput): Recipe {
  const trade = detectTrade(input.brief).trade;
  const plan = FALLBACK_PLANS[trade];
  const sections = plan.map((id) => ({ component: id, content: normalizeSectionContent(id, {}) }));
  return repairRecipe(sections, input);
}

// --- Prompt & génération ----------------------------------------------------------

function catalogForPrompt(): string {
  return listManifests()
    .map((m) => {
      const sample = JSON.stringify(getSample(m.id));
      return [
        `### ${m.id}`,
        `rôle: ${m.role} · rareté: ${m.rarity}`,
        `description: ${m.description}`,
        `quand l'utiliser: ${m.whenToUse.join(" ; ")}`,
        `exemple de "content" (LA FORME À RESPECTER, clés et types identiques) : ${sample}`,
      ].join("\n");
    })
    .join("\n\n");
}

export function buildAgenceurMessages(input: AgenceurInput): Array<{ role: "system" | "user"; content: string }> {
  const vibe = input.customVibe ?? getVibe(input.vibeId);
  const trade = detectTrade(input.brief).trade;
  const system = `Tu es l'ARCHITECTE-AGENCEUR d'Akyra. Tu assembles des sites vitrines en français à partir d'un CATALOGUE FERMÉ de composants. Tu ne crées JAMAIS de composant ni de HTML : tu choisis, tu ordonnes, tu rédiges les textes. Tu penses comme un architecte : utilité de chaque section, rythme visuel, conversion.

RÈGLES D'ASSEMBLAGE (strictes) :
- Entre 6 et 9 sections + le footer.
- "hero-split-asym" toujours en PREMIER. "footer-columns" toujours en DERNIER.
- Jamais deux composants du même rôle.
- Toujours une preuve sociale (reviews, stats ou logos) et toujours "contact-block" ou "cta-banner" avant le footer.
- "pricing-cards" uniquement si le métier vend des formules/forfaits lisibles.
- Choisis les composants les plus pertinents pour CE client (sers-toi de "quand l'utiliser").

RÈGLES DE CONTENU (strictes) :
- Textes 100 % en FRANÇAIS, réécrits pour ce client précis : son métier, son ton, sa ville s'il l'a donnée. Zéro lorem ipsum, zéro texte générique.
- Respecte EXACTEMENT la forme du "content" d'exemple de chaque composant : mêmes clés, mêmes types, même structure d'items. Longueurs proches de l'exemple (±40 %).
- NE MODIFIE PAS les clés d'images (image, image2, avatars, avatar) : recopie la valeur de l'exemple À L'IDENTIQUE.
- Les chiffres (stats, prix) doivent être plausibles pour le métier, jamais mensongers ("sur devis" est permis).

SORTIE : JSON STRICT, rien d'autre :
{"sections":[{"component":"<id du catalogue>","content":{...}}]}

CATALOGUE :
${catalogForPrompt()}`;

  const user = `PITCH DU CLIENT : « ${input.brief.trim().slice(0, 1200)} »
NOM DE L'ACTIVITÉ : ${input.businessName.trim().slice(0, 80) || "(non précisé)"}
MÉTIER DÉTECTÉ : ${trade}
DIRECTION ARTISTIQUE CHOISIE : ${vibe ? `${vibe.label} (${vibe.mood.join(", ")})` : input.vibeId} — adapte le TON des textes à cette ambiance, pas la structure.

Assemble le site et renvoie le JSON.`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/** Parse tolérant : JSON direct, sinon premier bloc {...} de la réponse. */
export function parseAgenceurJson(rawText: string): { sections: unknown } | null {
  const tryParse = (s: string): { sections: unknown } | null => {
    try {
      const parsed = JSON.parse(s);
      return isPlainObject(parsed) && "sections" in parsed ? (parsed as { sections: unknown }) : null;
    } catch {
      return null;
    }
  };
  const direct = tryParse(rawText);
  if (direct) return direct;
  const start = rawText.indexOf("{");
  const end = rawText.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  return tryParse(rawText.slice(start, end + 1));
}

const AGENCEUR_TIMEOUT_MS = 75_000;

/**
 * Génère la recette du site. NE PEUT PAS ÉCHOUER : toute erreur (réseau, JSON
 * malformé, recette invalide) retombe sur le repli déterministe par métier.
 */
export async function generateRecipe(input: AgenceurInput, chatFn: ChatFn): Promise<AgenceurResult> {
  try {
    const raw = await Promise.race([
      chatFn(buildAgenceurMessages(input), { json: true, maxTokens: 6000 }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("agenceur timeout")), AGENCEUR_TIMEOUT_MS),
      ),
    ]);
    const parsed = parseAgenceurJson(raw);
    if (!parsed) throw new Error("réponse agenceur illisible");
    const recipe = repairRecipe(parsed.sections, input);
    const v = validateRecipe(recipe);
    if (!v.ok) throw new Error(`recette réparée invalide : ${v.errors[0]}`);
    return { recipe, source: "ai" };
  } catch (e) {
    console.error("[foundry/agenceur] repli déterministe :", e instanceof Error ? e.message : e);
    return { recipe: fallbackRecipe(input), source: "fallback" };
  }
}

// --- Sous-pages (création de page) -----------------------------------------------

export interface SubPageInput {
  /** Demande libre du client (« une page tarifs avec mes trois formules »…). */
  request: string;
  businessName: string;
  /** Pitch d'origine du client — contexte métier pour des textes justes. */
  brief?: string;
  /** Composants de l'accueil : la sous-page ne doit pas le recomposer. */
  homeComponents?: string[];
  /** Titres des pages existantes (noms d'onglets à ne pas réutiliser). */
  existingTitles?: string[];
}

export interface SubPageResult {
  /** Nom court de la page (onglet + lien navbar), déduit de la demande. */
  title: string;
  sections: RecipeSection[];
  source: "ai" | "fallback";
}

/**
 * Sections d'une SOUS-PAGE : composants connus uniquement, un seul par rôle,
 * navbar/footer écartés (hérités de l'accueil) et hero écarté (réservé à
 * l'accueil — c'est lui qui faisait ressembler les pages à des landings).
 * Minimum 3 sections (complétées si l'IA est trop maigre).
 */
export function repairSubPageSections(rawSections: unknown): RecipeSection[] {
  const seen = new Set<string>();
  const out: RecipeSection[] = [];
  for (const raw of Array.isArray(rawSections) ? rawSections : []) {
    if (!isPlainObject(raw) || typeof raw.component !== "string") continue;
    const m = getManifest(raw.component);
    if (!m || m.role === "navbar" || m.role === "footer" || m.role === "hero") continue;
    if (seen.has(m.role)) continue;
    seen.add(m.role);
    out.push({ component: m.id, content: normalizeSectionContent(m.id, raw.content) });
  }
  // Page trop maigre → complète avec des blocs de contenu pertinents.
  const fillers = ["intro-split", "services-rows", "faq-accordion", "contact-block", "cta-banner"];
  for (const id of fillers) {
    if (out.length >= 3) break;
    const role = getManifest(id)!.role;
    if (seen.has(role)) continue;
    seen.add(role);
    out.push({ component: id, content: normalizeSectionContent(id, {}) });
  }
  return out;
}

/** Intentions de page reconnues : titre, plan de secours et intro dédiée.
 *  Chaque plan a sa STRUCTURE propre (sections design comprises) — deux pages
 *  d'intentions différentes ne doivent jamais se ressembler. */
const SUBPAGE_INTENTS: Array<{ match: RegExp; title: string; plan: string[]; intro: string }> = [
  { match: /tarif|prix|formule|forfait|abonnement/i, title: "Tarifs", plan: ["intro-split", "pricing-cards", "marquee-words", "faq-accordion", "cta-banner"], intro: "Des prix clairs, sans surprise : choisissez la formule qui vous correspond." },
  { match: /contact|rendez-vous|rdv|joindre|appel/i, title: "Contact", plan: ["intro-split", "contact-block", "faq-accordion"], intro: "Une question, un projet ? Voici comment nous joindre — réponse rapide garantie." },
  { match: /faq|question/i, title: "Questions fréquentes", plan: ["intro-split", "faq-accordion", "quote-spotlight", "contact-block"], intro: "Les réponses aux questions qu'on nous pose le plus souvent." },
  { match: /avis|t[ée]moignage|r[ée]f[ée]rence/i, title: "Avis clients", plan: ["intro-split", "testimonials-carousel", "stats-countup", "quote-spotlight", "cta-banner"], intro: "Ce que nos clients disent de nous, en toute transparence." },
  { match: /r[ée]alisation|galerie|portfolio|projet|chantier/i, title: "Réalisations", plan: ["intro-split", "gallery-mosaic", "parallax-strip", "testimonials-carousel", "cta-banner"], intro: "Un aperçu concret de notre savoir-faire à travers nos derniers projets." },
  { match: /propos|histoire|[ée]quipe|qui (suis|sommes)|valeur/i, title: "À propos", plan: ["intro-split", "story-timeline", "team-cards", "quote-spotlight", "cta-banner"], intro: "Notre histoire, nos valeurs et ce qui guide notre travail au quotidien." },
  { match: /devis|estimation/i, title: "Devis", plan: ["intro-split", "process-steps", "contact-block"], intro: "Décrivez votre besoin : nous chiffrons vite, et sans engagement." },
  { match: /service|prestation|offre|expertise/i, title: "Nos services", plan: ["intro-split", "services-rows", "parallax-strip", "process-steps", "cta-banner"], intro: "Le détail de nos prestations, pour savoir exactement ce que nous pouvons faire pour vous." },
];

const SUBPAGE_DEFAULT = { plan: ["intro-split", "services-rows", "faq-accordion", "cta-banner"], intro: "Tout ce qu'il faut savoir, simplement." };

/** Mots de remplissage en tête de demande (« je veux une page sur… »). */
const REQUEST_FILLER = /^(je (veux|voudrais|souhaite)|j'aimerais|cr[ée]e[rz]?|ajoute[rz]?|fais|une?|nouvelle|page|sous-page|d[ée]di[ée]e?|pour|sur|avec|qui|pr[ée]sente|parle de|de|des|du|la|le|les|mon|ma|mes)\s+/i;

/** Déduit un nom court de page depuis la demande libre (sans IA). */
export function deriveSubPageTitle(request: string): string {
  const intent = SUBPAGE_INTENTS.find((r) => r.match.test(request));
  if (intent) return intent.title;
  let rest = request.trim();
  for (let i = 0; i < 8; i++) {
    const next = rest.replace(REQUEST_FILLER, "");
    if (next === rest) break;
    rest = next.trim();
  }
  const words = rest.split(/\s+/).filter(Boolean).slice(0, 3).join(" ").replace(/[.,;:!?…]+$/, "");
  if (words.length < 2) return "Nouvelle page";
  const t = words.charAt(0).toUpperCase() + words.slice(1);
  return t.slice(0, 30);
}

/** Titre renvoyé par l'IA : nettoyé, court, sinon null. */
function cleanAiTitle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().replace(/^["'«\s]+|["'»\s]+$/g, "").slice(0, 40);
  return t.length >= 2 ? t : null;
}

/**
 * Sous-page de secours (déterministe) : plan choisi selon l'INTENTION de la
 * demande, en-tête de page au TITRE de la page (jamais le texte d'exemple).
 */
export function fallbackSubPageSections(input: SubPageInput, title: string): RecipeSection[] {
  const intent = SUBPAGE_INTENTS.find((r) => r.match.test(`${title} ${input.request}`)) ?? SUBPAGE_DEFAULT;
  const sections = intent.plan.map((id) => ({ component: id, content: normalizeSectionContent(id, {}) }));
  // En-tête de page : titre + intro dédiée, reportés sémantiquement sur le bloc.
  const head = sections[0];
  const name = input.businessName.trim().slice(0, 60);
  head.content = adaptContent(head.component, {
    title,
    ...(name ? { eyebrow: name } : {}),
    subtitle: intent.intro,
  });
  return repairSubPageSections(sections);
}

function buildSubPageMessages(input: SubPageInput): Array<{ role: "system" | "user"; content: string }> {
  const home = (input.homeComponents ?? []).join(", ") || "(composition inconnue)";
  const titles = (input.existingTitles ?? []).join(" · ") || "(aucune)";
  const system = `Tu es l'ARCHITECTE-AGENCEUR d'Akyra. Le client possède DÉJÀ un site une-page (l'accueil). Tu composes UNE NOUVELLE SOUS-PAGE de ce site à partir d'un CATALOGUE FERMÉ de composants : tu choisis, tu ordonnes, tu rédiges les textes en français — tu ne crées jamais de composant ni de HTML.

UNE SOUS-PAGE N'EST PAS UNE LANDING :
- PAS de navbar, PAS de footer (hérités de l'accueil), PAS de hero (réservé à l'accueil).
- 3 à 6 sections : d'abord un EN-TÊTE DE PAGE (ex. "intro-split" : titre de la page + texte d'introduction), puis le contenu UTILE au sujet, et termine par un appel à l'action ou un bloc contact.
- L'accueil contient déjà : ${home}. Ta page APPROFONDIT UN SUJET : chaque section doit dire quelque chose que l'accueil ne dit pas. Quand un autre composant du même rôle convient, préfère-le à celui déjà utilisé sur l'accueil.
- Jamais deux composants du même rôle.

CHAQUE PAGE A SA STRUCTURE PROPRE (règle d'or) :
- La STRUCTURE découle du SUJET — une page réalisations est une galerie ("gallery-mosaic", "parallax-strip"), une page à propos raconte ("story-timeline", "team-cards", "quote-spotlight"), une page tarifs compare ("pricing-cards"). Deux pages de sujets différents ne doivent JAMAIS avoir le même squelette.
- Utilise les sections DESIGN pour rythmer ("parallax-strip", "marquee-words", "quote-spotlight") : une page n'est pas une pile de blocs de texte.
- N'utilise PAS systématiquement les mêmes blocs génériques (services-rows, faq-accordion) : seulement s'ils servent VRAIMENT le sujet de la page.

RÈGLES DE CONTENU (strictes) :
- 100 % FRANÇAIS, écrit pour LE SUJET DE LA PAGE et pour CE client (activité ci-dessous). RÉÉCRIS TOUS les textes — ne recopie JAMAIS les textes d'exemple du catalogue.
- Respecte EXACTEMENT la FORME du "content" d'exemple (mêmes clés/types). Longueurs proches (±40 %).
- NE MODIFIE PAS les clés d'images : recopie la valeur de l'exemple à l'identique.
- "title" : le NOM de la page pour le menu et l'onglet — 1 à 3 mots (ex. « Tarifs », « Nos services », « À propos »). Noms déjà pris (interdits) : ${titles}.

SORTIE : JSON STRICT : {"title":"<nom de la page>","sections":[{"component":"<id>","content":{...}}]}

CATALOGUE :
${catalogForPrompt()}`;

  const user = `ACTIVITÉ DU CLIENT : « ${(input.brief ?? "").trim().slice(0, 600) || "(non précisée)"} »
NOM DE L'ACTIVITÉ : ${input.businessName.trim().slice(0, 80) || "(non précisé)"}
DEMANDE DU CLIENT POUR CETTE NOUVELLE PAGE : « ${input.request.trim().slice(0, 1000)} »

Compose la sous-page (titre court + sections de contenu, sans navbar/footer/hero) et renvoie le JSON.`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/**
 * Génère une sous-page (titre + sections) depuis la demande libre du client.
 * NE PEUT PAS ÉCHOUER : toute erreur retombe sur un plan déterministe choisi
 * selon l'intention de la demande, avec un en-tête au titre de la page.
 */
export async function generateSubPage(input: SubPageInput, chatFn: ChatFn): Promise<SubPageResult> {
  const derivedTitle = deriveSubPageTitle(input.request);
  try {
    const raw = await Promise.race([
      chatFn(buildSubPageMessages(input), { json: true, maxTokens: 4000 }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("sous-page timeout")), AGENCEUR_TIMEOUT_MS)),
    ]);
    const parsed = parseAgenceurJson(raw);
    if (!parsed) throw new Error("réponse illisible");
    const sections = repairSubPageSections(parsed.sections);
    if (sections.length < 2) throw new Error("sous-page trop maigre");
    const title = cleanAiTitle((parsed as { title?: unknown }).title) ?? derivedTitle;
    return { title, sections, source: "ai" };
  } catch (e) {
    console.error("[foundry/agenceur] sous-page → repli :", e instanceof Error ? e.message : e);
    return { title: derivedTitle, sections: fallbackSubPageSections(input, derivedTitle), source: "fallback" };
  }
}
