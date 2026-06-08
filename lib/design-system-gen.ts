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
import { setPath, collectImageSlots } from "@/lib/content-overlay";

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

const SYSTEM = `Tu es un développeur front senior. On te donne le DESIGN SYSTEM complet d'un template de site vitrine + les FAITS de l'activité RÉELLE du client. Tu dois RÉDIGER et construire la PAGE D'ACCUEIL COMPLÈTE en HTML5 autonome : header (nav + hero) PUIS toutes les sections du corps décrites dans le design system, dans l'ordre, PUIS le footer. Tu écris des textes PROPRES au métier du client à partir des faits — il n'y a AUCUN contenu de démonstration fourni, n'en invente pas (ni faux avis, ni faux chiffres, ni email/téléphone non fournis).

ANTI-SLOP (ne jamais retomber dans les défauts LLM) :
- La SEULE source de vérité esthétique est le DESIGN SYSTEM. N'injecte JAMAIS les clichés génériques : pas de dégradé violet/indigo « IA » s'il n'est pas dans le design system, pas de glassmorphism générique partout, pas de « trois cartes égales » par réflexe, pas de hero centré sur mesh sombre par défaut, pas d'Inter+slate-900 si le design system dit autre chose, pas de micro-animations en boucle infinie. Respecte les polices, couleurs et structures du design system, point.

ADAPTATION MÉTIER (important) :
- Le template d'origine peut viser un autre métier que celui du client : tu gardes fidèlement la DA (palette, typo, structure, signature du header) mais tu RÉÉCRIS tous les textes, noms de sections, services et le vocabulaire pour LE métier du client (ex. un coach n'a ni « galerie » ni « tirages » : parle de séances, accompagnement, témoignages clients…). Si une section du design system n'a pas de matière côté client, adapte-la honnêtement (ex. avis absents → section « engagements/approche ») — n'invente jamais de faux avis, faux chiffres, faux email/téléphone.

STRUCTURE HTML (impératif technique) :
- Charge Tailwind via <script src="https://cdn.tailwindcss.com"></script>.
- Le bloc \`tailwind.config = { ... }\` est du JavaScript : il DOIT être dans un <script> séparé (jamais à l'intérieur d'un <style>), sinon les couleurs/polices custom (ex. bg-yellow, bg-violet) sont ignorées et ne s'affichent pas.
- Le CSS custom (keyframes, classes .xxx, reset) va dans un <style> séparé, distinct du <script> de config.

ÉDITION (obligatoire) :
- Mets un attribut **data-sg-path="<clé>"** sur CHAQUE texte éditable (titres, accroches, services, prix, items…) et **data-sg-img="<clé>"** sur CHAQUE image, avec des clés sémantiques (ex. hero.title, services[0].name, contact.email). C'est indispensable à l'éditeur WYSIWYG et à l'hydratation.

EXIGENCES :
- Le HEADER doit être reproduit AU MILLIMÈTRE (classes Tailwind exactes du design system).
- Les sections du corps suivent les patterns décrits (en-tête de section, grilles, cartes, hover, accordéon FAQ…). Réutilise les classes citées.
- Page autonome : <head> avec Tailwind CDN, les Google Fonts, le bloc tailwind.config et le CSS custom du design system recopiés tels quels. Inclus un petit <script> vanilla pour l'accordéon FAQ (toggle de la classe .open).
- Pour les images : utilise EXACTEMENT les URLs de photos fournies (section « PHOTOS »), dans l'ordre, en réutilisant en boucle s'il y en a moins que d'emplacements. Si aucune URL n'est fournie, mets un src="" (il sera complété ensuite). Ne mets jamais de chemin de démo.
- N'invente aucun style hors design system. Aucune couleur étrangère.

ANIMATIONS (obligatoire — un kit JS partagé sera injecté, tu dois juste ANNOTER le HTML) :
- Sur CHAQUE bloc qui apparaît au scroll (en-tête de section, carte, ligne de stat, image, paragraphe important), ajoute l'attribut **data-anim** (valeurs : défaut = montée+fondu ; "fade" ; "left" ; "right" ; "scale").
- Pour les éléments d'une même rangée/grille, ajoute un décalage : **data-anim-delay="0"**, "80", "160", "240"… (stagger en ms).
- Le GRAND TITRE du hero (h1) reçoit la classe **anim-words** (apparition mot à mot) UNIQUEMENT s'il est en TEXTE SIMPLE (pas de <span> interne). S'il contient des <span> internes (dégradé, pilule, mot stylé), N'utilise PAS anim-words : mets **data-anim="fade"** sur le h1 à la place.
- CHAQUE CHIFFRE de statistique doit être un <span **data-count="<nombre>"** data-count-suffix="<ex: +, %, h, /7>" data-count-decimals="0">0</span>. Pour "24/7", garde le texte tel quel (pas de compteur).
- N'inclus PAS toi-même le code du kit d'animation : il est ajouté automatiquement. Annote seulement.

- Réponds UNIQUEMENT avec le code HTML complet (<!DOCTYPE html> … </html>), sans backticks ni commentaire autour.`;

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
    if (key && src) setPath(content, key, src);
  }

  // Textes : ouvrant avec data-sg-path puis texte jusqu'au prochain "<" fermant.
  // Non-greedy : on capture le 1er bloc de texte (suffisant pour les feuilles).
  for (const m of html.matchAll(
    /<([a-zA-Z0-9]+)\b[^>]*\bdata-sg-path="([^"]+)"[^>]*>([\s\S]*?)<\//g,
  )) {
    const key = m[2];
    const text = decodeEntities(m[3].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    if (text) setPath(content, key, text);
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
