/**
 * Génération de site SUR-MESURE depuis un `design-system.md`.
 *
 * « Design system as prompt » : Mistral reçoit le design-system.md d'un template
 * + le contenu (textes/photos réels du client) et produit le HTML complet du
 * site, fidèle à la DA et adapté au métier — même hors catalogue. Le HTML garde
 * les `data-sg-path` / `data-sg-img` (donc éditable) ; un kit d'animation partagé
 * est injecté. On en extrait un `content_json` cohérent pour l'hydratation et
 * l'édition (mêmes clés que les data-sg du shell généré).
 *
 * Porté de `scripts/test-design-system-full.mjs` (POC validé sur les 30 templates).
 * SERVEUR uniquement.
 */
import { collectImageSlots } from "@/lib/content-overlay";

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

/** Récupère le design-system.md d'un template (fichier statique servi). */
export async function loadDesignSystem(
  origin: string,
  templateId: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${origin}/_templates/${templateId}/design-system.md`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const txt = await res.text();
    return txt.trim().length > 0 ? txt : null;
  } catch {
    return null;
  }
}

/** Kit d'animation partagé (révélations, compteurs, accordéon, galerie). */
async function loadMotionKit(origin: string): Promise<string> {
  try {
    const res = await fetch(`${origin}/_templates/_shared/motion.html`, {
      cache: "no-store",
    });
    return res.ok ? await res.text() : "";
  } catch {
    return "";
  }
}

// Règles communes (sans la structure <head>, qui ne concerne que header/full).
const RULES_COMMON = `ANTI-SLOP (ne jamais retomber dans les défauts LLM) :
- La SEULE source de vérité esthétique est le DESIGN SYSTEM. N'injecte JAMAIS les clichés génériques : pas de dégradé violet/indigo « IA » s'il n'est pas dans le design system, pas de glassmorphism générique partout, pas de « trois cartes égales » par réflexe, pas de hero centré sur mesh sombre par défaut, pas d'Inter+slate-900 si le design system dit autre chose, pas de micro-animations en boucle infinie. Respecte les polices, couleurs et structures du design system, point.

ADAPTATION MÉTIER (important) :
- Le template d'origine peut viser un autre métier que celui du client : tu gardes fidèlement la DA (palette, typo, structure, signature) mais tu RÉÉCRIS tous les textes, noms de sections, services et le vocabulaire pour LE métier du client (ex. un coach n'a ni « galerie » ni « tirages » : parle de séances, accompagnement, témoignages clients…). Si une section n'a pas de matière côté client, adapte-la honnêtement (ex. avis absents → « engagements/approche ») — n'invente jamais de faux avis, faux chiffres, faux email/téléphone.

ÉDITION (obligatoire) :
- Mets un attribut **data-sg-path="<clé>"** sur CHAQUE texte éditable (titres, accroches, services, prix, items…) et **data-sg-img="<clé>"** sur CHAQUE image, avec des clés sémantiques (ex. hero.title, services[0].name, contact.email). Indispensable à l'éditeur WYSIWYG et à l'hydratation.

IMAGES :
- Utilise EXACTEMENT les URLs de photos fournies (section « PHOTOS »), dans l'ordre, en boucle s'il y en a moins que d'emplacements. Aucune URL fournie → src="" (complété ensuite). Jamais de chemin de démo.

ANIMATIONS (un kit JS partagé sera injecté, tu dois juste ANNOTER) :
- Sur CHAQUE bloc qui apparaît au scroll (en-tête de section, carte, stat, image, paragraphe), ajoute **data-anim** ("" = montée+fondu ; "fade" ; "left" ; "right" ; "scale"), + **data-anim-delay** ("0","80","160"… en ms) pour le stagger.
- Grand titre hero (h1) : classe **anim-words** UNIQUEMENT s'il est en texte simple (sans <span> interne) ; sinon **data-anim="fade"** sur le h1.
- Chaque chiffre de stat : <span **data-count="<n>"** data-count-suffix="…" data-count-decimals="0">0</span>. "24/7" reste tel quel.
- N'inclus PAS le code du kit (ajouté auto). Annote seulement.`;

const RULES_HEAD = `STRUCTURE HTML (impératif technique) :
- Charge Tailwind via <script src="https://cdn.tailwindcss.com"></script>.
- Le bloc \`tailwind.config = { ... }\` est du JavaScript : il DOIT être dans un <script> séparé (jamais dans un <style>), sinon les couleurs/polices custom (bg-yellow…) sont ignorées.
- Le CSS custom (keyframes, classes, reset) va dans un <style> séparé, distinct du <script> de config. Recopie tailwind.config + CSS custom + Google Fonts du design system tels quels.`;

const SYSTEM = `Tu es un développeur front senior. On te donne le DESIGN SYSTEM complet d'un template + les FAITS de l'activité RÉELLE du client. Construis la PAGE D'ACCUEIL COMPLÈTE en HTML5 autonome : header (nav + hero) PUIS toutes les sections du corps, dans l'ordre, PUIS le footer. Rédige des textes PROPRES au métier du client à partir des faits — AUCUN contenu de démo fourni, n'en invente pas.

${RULES_COMMON}

${RULES_HEAD}

- Header reproduit AU MILLIMÈTRE (classes du design system). Corps suivant les patterns décrits. Petit <script> vanilla pour l'accordéon FAQ (toggle .open).
- Réponds UNIQUEMENT avec le code HTML complet (<!DOCTYPE html> … </html>), sans backticks ni commentaire.`;

const SYSTEM_HEADER = `Tu es un développeur front senior. On te donne le DESIGN SYSTEM d'un template + les FAITS du client. Construis UNIQUEMENT LE HEADER (nav + hero) en document HTML5 AUTONOME et minimal : <head> complet (Tailwind CDN, tailwind.config, Google Fonts, CSS custom du design system) + <body class="…"> contenant SEULEMENT le <header> (nav + hero du design system, reproduit au millimètre). PAS de sections de corps, PAS de footer. Rédige les textes (marque, accroche du hero, CTA) propres au métier du client à partir des faits.

${RULES_COMMON}

${RULES_HEAD}

- Réponds UNIQUEMENT avec le code HTML complet (<!DOCTYPE html> … </html>) contenant le head + le header seul, sans backticks ni commentaire.`;

const SYSTEM_BODY = `Tu es un développeur front senior. On te donne le DESIGN SYSTEM d'un template, les FAITS du client, et le HEADER DÉJÀ CONSTRUIT (head + nav + hero) qu'il faut PROLONGER. Produis UNIQUEMENT les SECTIONS DU CORPS + le FOOTER qui viennent APRÈS le header, en réutilisant EXACTEMENT les mêmes classes Tailwind, couleurs, polices et conventions que le header fourni. NE répète NI le <head>, NI le <html>/<body>, NI le header : commence directement au markup de la 1re section.

${RULES_COMMON}

- Suis les sections du corps décrites dans le design system (en-têtes de section, grilles, cartes, hover, accordéon FAQ…), dans l'ordre. Inclus un petit <script> vanilla pour l'accordéon FAQ (toggle .open) si tu mets une FAQ.
- Réponds UNIQUEMENT avec le markup HTML des sections + footer (pas de <!DOCTYPE>, pas de <head>, pas de <header>), sans backticks ni commentaire.`;

type ImagePlanLite = { count: number; slots: { path: string; role?: string; description?: string }[] };

/** Faits compacts de l'activité du client — la SEULE matière des textes générés. */
export type GenFacts = {
  brand?: string;
  activity?: string;
  services?: string[];
  priceRange?: string;
  area?: string;
  tone?: string;
  contact?: string;
  brief?: string;
  extras?: string[];
};

function factsBlock(f: GenFacts): string {
  const lines: string[] = [];
  if (f.brand) lines.push(`Marque / nom : ${f.brand}`);
  if (f.activity) lines.push(`Activité (métier) : ${f.activity}`);
  if (f.services?.length) lines.push(`Services / prestations : ${f.services.join(" · ")}`);
  if (f.priceRange) lines.push(`Tarifs : ${f.priceRange}`);
  if (f.area) lines.push(`Zone / ville : ${f.area}`);
  if (f.tone) lines.push(`Ton souhaité : ${f.tone}`);
  if (f.contact) lines.push(`Contact : ${f.contact}`);
  if (f.extras?.length) lines.push(...f.extras.map((e) => `Info : ${e}`));
  if (f.brief) lines.push(`Synthèse : ${f.brief}`);
  return lines.join("\n") || "(peu d'informations — reste sobre et générique du métier)";
}

function buildUserPrompt(
  designSystem: string,
  facts: GenFacts,
  imagePlan?: ImagePlanLite,
  photoUrls?: string[],
): string {
  return `DESIGN SYSTEM :
"""
${designSystem}
"""

FAITS CLIENT (rédige TOUS les textes du site à partir de ça — n'invente rien au-delà) :
"""
${factsBlock(facts)}
"""

${
    imagePlan
      ? `PLAN PHOTO (rôle de chaque emplacement, ${imagePlan.count} au total) :\n${imagePlan.slots
          .map((s, i) => `${i + 1}. ${s.description ?? s.role ?? "photo"}`)
          .join("\n")}\n\n`
      : ""
  }${
    photoUrls?.length
      ? `PHOTOS (URLs à utiliser dans l'ordre, en boucle si besoin) :\n${photoUrls.map((u, i) => `${i + 1}. ${u}`).join("\n")}\n\n`
      : "PHOTOS : aucune fournie → mets src=\"\" sur les <img> (complétées ensuite).\n\n"
  }Construis la page d'accueil COMPLÈTE (header + sections + footer), fidèle à la DA, avec des textes 100% propres au métier du client. Aucun contenu de démonstration.`;
}

type MistralGen = { ok: true; text: string } | { ok: false; reason: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Appel Mistral dédié à la génération : gros max_tokens, timeout long, retry
 *  ROBUSTE (4×, backoff exponentiel, gestion explicite du 429/rate-limit) car la
 *  génération est longue (~30-90s) et sensible aux limites de débit. Remonte la
 *  RAISON d'échec (observabilité). */
async function callMistralGen(system: string, user: string, timeoutMs: number): Promise<MistralGen> {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) return { ok: false, reason: "no-key" };
  const model = process.env.MISTRAL_MODEL || "mistral-large-latest";
  let reason = "inconnu";
  const MAX = 4;
  for (let attempt = 1; attempt <= MAX; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(MISTRAL_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          temperature: 0.2,
          max_tokens: 32000,
        }),
        signal: ctrl.signal,
      });
      if (res.status === 429) {
        // Rate limit : attente plus longue avant de réessayer.
        reason = "http-429";
        if (attempt < MAX) await sleep(Math.min(30_000, 5_000 * attempt));
        continue;
      }
      if (!res.ok) {
        reason = `http-${res.status}`;
        if (attempt < MAX) await sleep(2_000 * attempt);
        continue;
      }
      const j = await res.json();
      const out = (j.choices?.[0]?.message?.content ?? "").trim();
      if (out) return { ok: true, text: out };
      reason = "réponse-vide";
    } catch (e) {
      reason = e instanceof Error && e.name === "AbortError" ? "timeout" : "fetch-fail";
      if (attempt < MAX) await sleep(2_000 * attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, reason };
}

function stripFences(html: string): string {
  return html
    .trim()
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function injectMotion(html: string, motion: string): string {
  if (!motion) return html;
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${motion}\n</body>`);
  if (/<\/html>/i.test(html)) return html.replace(/<\/html>/i, `${motion}\n</html>`);
  return html + motion;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * Affecte une valeur à un chemin, ROBUSTE aux collisions de clés (deux data-sg
 * dont l'un est préfixe de l'autre) : un intermédiaire primitif est remplacé par
 * un conteneur ; on n'écrase jamais un objet existant par une chaîne. Évite le
 * crash « Cannot assign to read only property of string » de setPath.
 */
function safeSet(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  if (parts.length === 0) return;
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    const next = cur[k];
    if (next == null || typeof next !== "object") {
      cur[k] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    }
    cur = cur[k] as Record<string, unknown>;
  }
  const last = parts[parts.length - 1];
  // Collision inverse (un objet existe déjà à cette clé) → ne pas le clobber.
  if (cur[last] != null && typeof cur[last] === "object") return;
  cur[last] = value;
}

/**
 * Reconstruit un content_json à partir du shell généré : chaque `data-sg-path`
 * → son texte, chaque `data-sg-img` → son `src`. Les clés correspondent donc
 * EXACTEMENT aux data-sg du shell (hydratation + édition cohérentes).
 */
export function extractContentFromShell(
  html: string,
  templateId?: string,
): { content: Record<string, unknown>; imageSlots: string[] } {
  const content: Record<string, unknown> = {};

  // Images : <img … data-sg-img="KEY" … src="URL" …> (attributs dans tout ordre)
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const key = /data-sg-img="([^"]+)"/i.exec(tag)?.[1];
    const src = /\bsrc="([^"]+)"/i.exec(tag)?.[1];
    if (key && src) safeSet(content, key, src);
  }

  // Textes : ouvrant avec data-sg-path puis texte jusqu'au prochain "<" fermant.
  // Non-greedy : on capture le 1er bloc de texte (suffisant pour les feuilles).
  for (const m of html.matchAll(
    /<([a-zA-Z0-9]+)\b[^>]*\bdata-sg-path="([^"]+)"[^>]*>([\s\S]*?)<\//g,
  )) {
    const key = m[2];
    const text = decodeEntities(m[3].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    if (text) safeSet(content, key, text);
  }

  const imageSlots = templateId ? collectImageSlots(content, templateId) : [];
  return { content, imageSlots };
}

/** Force le src de chaque <img data-sg-img> avec les URLs client (ordre, en boucle). */
function assignPhotosInOrder(html: string, urls: string[]): string {
  if (!urls.length) return html;
  let i = 0;
  return html.replace(/<img\b[^>]*\bdata-sg-img="[^"]*"[^>]*>/gi, (tag) => {
    const url = urls[i % urls.length];
    i += 1;
    return /\bsrc="[^"]*"/i.test(tag)
      ? tag.replace(/\bsrc="[^"]*"/i, `src="${url}"`)
      : tag.replace(/<img/i, `<img src="${url}"`);
  });
}

export type GenResult =
  | { ok: true; html: string; content: Record<string, unknown> }
  | { ok: false; reason: string };

/**
 * Génère le site sur-mesure pour `templateId` depuis le design system + les FAITS
 * du client (+ plan photo + URLs de photos). Aucun contenu de démo en entrée →
 * pas de fuite. Retourne `{ ok:false, reason }` en cas d'échec → le caller bascule
 * sur le pipeline déterministe (fallback).
 */
export async function generateBespokeSite(input: {
  origin: string;
  templateId: string;
  facts: GenFacts;
  imagePlan?: ImagePlanLite;
  photoUrls?: string[];
  timeoutMs?: number;
}): Promise<GenResult> {
  const { origin, templateId, facts, imagePlan, photoUrls } = input;
  const designSystem = await loadDesignSystem(origin, templateId);
  if (!designSystem) return { ok: false, reason: "design-system-introuvable" };

  const gen = await callMistralGen(
    SYSTEM,
    buildUserPrompt(designSystem, facts, imagePlan, photoUrls),
    input.timeoutMs ?? 90_000,
  );
  if (!gen.ok) return { ok: false, reason: gen.reason };

  let html = stripFences(gen.text);
  if (!/<\/html>\s*$/i.test(html)) return { ok: false, reason: "tronqué" };

  // Force les vraies photos client (fiabilité : indépendant de ce que l'IA a écrit).
  if (photoUrls?.length) html = assignPhotosInOrder(html, photoUrls);

  const motion = await loadMotionKit(origin);
  html = injectMotion(html, motion);

  const { content: extracted } = extractContentFromShell(html, templateId);
  return { ok: true, html, content: extracted };
}

// ───────────────────────── Génération en 2 temps ─────────────────────────

export type HeaderResult = { ok: true; headerDoc: string } | { ok: false; reason: string };

/**
 * Génère UNIQUEMENT le header (document HTML autonome : head + nav + hero), pour
 * que le client valide le STYLE avant la génération longue du site complet.
 */
export async function generateHeader(input: {
  origin: string;
  templateId: string;
  facts: GenFacts;
  imagePlan?: ImagePlanLite;
  photoUrls?: string[];
  timeoutMs?: number;
}): Promise<HeaderResult> {
  const { origin, templateId, facts, imagePlan, photoUrls } = input;
  const designSystem = await loadDesignSystem(origin, templateId);
  if (!designSystem) return { ok: false, reason: "design-system-introuvable" };

  const gen = await callMistralGen(
    SYSTEM_HEADER,
    buildUserPrompt(designSystem, facts, imagePlan, photoUrls),
    input.timeoutMs ?? 60_000,
  );
  if (!gen.ok) return { ok: false, reason: gen.reason };

  let headerDoc = stripFences(gen.text);
  if (!/<\/html>\s*$/i.test(headerDoc)) return { ok: false, reason: "tronqué" };
  if (photoUrls?.length) headerDoc = assignPhotosInOrder(headerDoc, photoUrls);
  return { ok: true, headerDoc };
}

function buildBodyUserPrompt(
  designSystem: string,
  facts: GenFacts,
  headerDoc: string,
  imagePlan?: ImagePlanLite,
  photoUrls?: string[],
): string {
  return `${buildUserPrompt(designSystem, facts, imagePlan, photoUrls)}

HEADER DÉJÀ CONSTRUIT (à PROLONGER, mêmes classes/couleurs/polices ; ne le répète pas) :
"""
${headerDoc}
"""

Produis maintenant les SECTIONS DU CORPS + le FOOTER qui suivent ce header.`;
}

export type BodyResult = { ok: true; bodyHtml: string } | { ok: false; reason: string };

/** Génère les sections du corps + footer qui PROLONGENT le header validé. */
export async function generateBody(input: {
  origin: string;
  templateId: string;
  facts: GenFacts;
  headerDoc: string;
  imagePlan?: ImagePlanLite;
  photoUrls?: string[];
  timeoutMs?: number;
}): Promise<BodyResult> {
  const { origin, templateId, facts, headerDoc, imagePlan, photoUrls } = input;
  const designSystem = await loadDesignSystem(origin, templateId);
  if (!designSystem) return { ok: false, reason: "design-system-introuvable" };

  const gen = await callMistralGen(
    SYSTEM_BODY,
    buildBodyUserPrompt(designSystem, facts, headerDoc, imagePlan, photoUrls),
    input.timeoutMs ?? 110_000,
  );
  if (!gen.ok) return { ok: false, reason: gen.reason };

  // Le modèle peut parfois renvoyer un wrapper : on ne garde que le markup utile.
  let bodyHtml = stripFences(gen.text)
    .replace(/^[\s\S]*?<\/header>/i, "") // retire tout ce qui précède (head/header parasites)
    .replace(/<\/body>[\s\S]*$/i, "") // retire </body></html> éventuels
    .trim();
  if (!bodyHtml) return { ok: false, reason: "corps-vide" };
  return { ok: true, bodyHtml };
}

/** Assemble header validé + corps généré + photos + kit motion → page complète. */
export async function assembleSite(input: {
  origin: string;
  templateId: string;
  headerDoc: string;
  bodyHtml: string;
  photoUrls?: string[];
}): Promise<{ html: string; content: Record<string, unknown> }> {
  const { origin, templateId, headerDoc, bodyHtml, photoUrls } = input;
  let html = /<\/body>/i.test(headerDoc)
    ? headerDoc.replace(/<\/body>/i, `${bodyHtml}\n</body>`)
    : headerDoc + bodyHtml;
  // Réassigne les photos sur le document COMPLET (header + corps, même ordre).
  if (photoUrls?.length) html = assignPhotosInOrder(html, photoUrls);
  const motion = await loadMotionKit(origin);
  html = injectMotion(html, motion);
  const { content } = extractContentFromShell(html, templateId);
  return { html, content };
}
