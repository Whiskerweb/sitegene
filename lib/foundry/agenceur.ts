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

function normalizeValue(sampleVal: unknown, rawVal: unknown, key: string, itemIndex = 0): unknown {
  // Les images viennent TOUJOURS de la banque locale (l'IA n'invente pas d'URL).
  if (IMAGE_KEY.test(key)) return sampleVal;

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
    if (!Array.isArray(rawVal) || rawVal.length === 0) return sampleVal;
    const first = sampleVal[0];
    if (typeof first === "string") {
      // Tableau d'images (avatars…) déjà intercepté plus haut ; ici du texte pur.
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
        .slice(0, 8)
        .map((rawItem, i) => {
          const base = sampleItems[i % sampleItems.length];
          const out: Record<string, unknown> = {};
          for (const k of Object.keys(ref)) {
            if (IMAGE_KEY.test(k)) {
              // Image d'item : celle du sample correspondant (banque locale).
              if (k in base) out[k] = base[k];
              else if (ref[k] !== undefined) out[k] = ref[k];
            } else if (k in rawItem) {
              out[k] = normalizeValue(ref[k], rawItem[k], k, i);
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
    for (const k of Object.keys(sampleVal)) out[k] = normalizeValue(sampleVal[k], raw[k], k);
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
  autre: ["hero-split-asym", "intro-split", "services-rows", "process-steps", "testimonials-carousel", "faq-accordion", "contact-block", "cta-banner", "footer-columns"],
};

/** Recette de secours, valide par construction. */
export function fallbackRecipe(input: AgenceurInput): Recipe {
  const trade = detectTrade(input.brief);
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
  const trade = detectTrade(input.brief);
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
