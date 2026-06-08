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

const SYSTEM = `Tu es un développeur front senior. On te donne le DESIGN SYSTEM complet d'un template de site vitrine + le CONTENU à afficher (infos réelles du client). Produis la PAGE D'ACCUEIL COMPLÈTE en HTML5 autonome : header (nav + hero) PUIS toutes les sections du corps décrites dans le design system, dans l'ordre, PUIS le footer.

ANTI-SLOP (ne jamais retomber dans les défauts LLM) :
- La SEULE source de vérité esthétique est le DESIGN SYSTEM. N'injecte JAMAIS les clichés génériques : pas de dégradé violet/indigo « IA » s'il n'est pas dans le design system, pas de glassmorphism générique partout, pas de « trois cartes égales » par réflexe, pas de hero centré sur mesh sombre par défaut, pas d'Inter+slate-900 si le design system dit autre chose, pas de micro-animations en boucle infinie. Respecte les polices, couleurs et structures du design system, point.

ADAPTATION MÉTIER (important) :
- Le contenu fourni décrit l'activité RÉELLE du client (qui n'est pas forcément le métier d'origine du template). Adapte les TEXTES, les noms de services et le vocabulaire à SON métier, tout en gardant fidèlement la DA (palette, typo, structure, signature du header). Si une section du design system n'a pas de matière côté client, adapte-la honnêtement (ex. remplacer des avis absents par une section « engagements ») — n'invente jamais de faux avis, faux chiffres, faux email/téléphone.

STRUCTURE HTML (impératif technique) :
- Charge Tailwind via <script src="https://cdn.tailwindcss.com"></script>.
- Le bloc \`tailwind.config = { ... }\` est du JavaScript : il DOIT être dans un <script> séparé (jamais à l'intérieur d'un <style>), sinon les couleurs/polices custom (ex. bg-yellow, bg-violet) sont ignorées et ne s'affichent pas.
- Le CSS custom (keyframes, classes .xxx, reset) va dans un <style> séparé, distinct du <script> de config.

ÉDITION (obligatoire) :
- Mets un attribut **data-sg-path="<clé>"** sur CHAQUE texte éditable (titres, accroches, services, prix, items…) et **data-sg-img="<clé>"** sur CHAQUE image, en réutilisant les clés du CONTENU fourni quand elles existent. C'est indispensable à l'éditeur WYSIWYG et à l'hydratation.

EXIGENCES :
- Le HEADER doit être reproduit AU MILLIMÈTRE (classes Tailwind exactes du design system).
- Les sections du corps suivent les patterns décrits (en-tête de section, grilles, cartes, hover, accordéon FAQ…). Réutilise les classes citées.
- Page autonome : <head> avec Tailwind CDN, les Google Fonts, le bloc tailwind.config et le CSS custom du design system recopiés tels quels. Inclus un petit <script> vanilla pour l'accordéon FAQ (toggle de la classe .open).
- Utilise EXACTEMENT les chemins d'images fournis (tels quels).
- N'invente aucun style hors design system. Aucune couleur étrangère.

ANIMATIONS (obligatoire — un kit JS partagé sera injecté, tu dois juste ANNOTER le HTML) :
- Sur CHAQUE bloc qui apparaît au scroll (en-tête de section, carte, ligne de stat, image, paragraphe important), ajoute l'attribut **data-anim** (valeurs : défaut = montée+fondu ; "fade" ; "left" ; "right" ; "scale").
- Pour les éléments d'une même rangée/grille, ajoute un décalage : **data-anim-delay="0"**, "80", "160", "240"… (stagger en ms).
- Le GRAND TITRE du hero (h1) reçoit la classe **anim-words** (apparition mot à mot) UNIQUEMENT s'il est en TEXTE SIMPLE (pas de <span> interne). S'il contient des <span> internes (dégradé, pilule, mot stylé), N'utilise PAS anim-words : mets **data-anim="fade"** sur le h1 à la place.
- CHAQUE CHIFFRE de statistique doit être un <span **data-count="<nombre>"** data-count-suffix="<ex: +, %, h, /7>" data-count-decimals="0">0</span>. Pour "24/7", garde le texte tel quel (pas de compteur).
- N'inclus PAS toi-même le code du kit d'animation : il est ajouté automatiquement. Annote seulement.

- Réponds UNIQUEMENT avec le code HTML complet (<!DOCTYPE html> … </html>), sans backticks ni commentaire autour.`;

type ImagePlan = { count: number; slots: { path: string; role?: string; description?: string }[] };

function buildUserPrompt(
  designSystem: string,
  content: Record<string, unknown>,
  brief?: string,
  imagePlan?: ImagePlan,
): string {
  return `DESIGN SYSTEM :
"""
${designSystem}
"""

${brief ? `BRIEF CLIENT (métier réel, à utiliser pour adapter les textes) :\n"""\n${brief}\n"""\n\n` : ""}${
    imagePlan
      ? `PLAN PHOTO (où va chaque image) :\n${imagePlan.slots
          .map((s) => `- ${s.path}${s.role ? ` (${s.role})` : ""}${s.description ? ` : ${s.description}` : ""}`)
          .join("\n")}\n\n`
      : ""
  }CONTENU À AFFICHER (JSON, toutes les sections — textes et chemins d'images réels) :
"""
${JSON.stringify(content, null, 2)}
"""

Produis la page d'accueil complète (header + toutes les sections + footer), fidèle à la DA et adaptée au métier réel du client.`;
}

/** Appel Mistral dédié à la génération : gros max_tokens, timeout long, retry. */
async function callMistralGen(
  system: string,
  user: string,
  timeoutMs: number,
): Promise<string | null> {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) return null;
  const model = process.env.MISTRAL_MODEL || "mistral-large-latest";
  for (let attempt = 1; attempt <= 2; attempt++) {
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
      if (!res.ok) throw new Error(`Mistral ${res.status}`);
      const j = await res.json();
      const out = (j.choices?.[0]?.message?.content ?? "").trim();
      if (out) return out;
    } catch {
      // retry
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
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

export type GenerateResult = { html: string; content: Record<string, unknown> };

/**
 * Génère le site sur-mesure pour `templateId` à partir du design system + du
 * contenu (et, optionnellement, d'un brief métier et d'un plan photo).
 * Retourne `null` en cas d'échec/timeout/sortie tronquée → le caller doit
 * basculer sur le pipeline déterministe (fallback).
 */
export async function generateBespokeSite(input: {
  origin: string;
  templateId: string;
  content: Record<string, unknown>;
  brief?: string;
  imagePlan?: ImagePlan;
  timeoutMs?: number;
}): Promise<GenerateResult | null> {
  const { origin, templateId, content, brief, imagePlan } = input;
  const designSystem = await loadDesignSystem(origin, templateId);
  if (!designSystem) return null;

  const raw = await callMistralGen(
    SYSTEM,
    buildUserPrompt(designSystem, content, brief, imagePlan),
    input.timeoutMs ?? 90_000,
  );
  if (!raw) return null;

  let html = stripFences(raw);
  if (!/<\/html>\s*$/i.test(html)) return null; // sortie tronquée → fallback

  const motion = await loadMotionKit(origin);
  html = injectMotion(html, motion);

  const { content: extracted } = extractContentFromShell(html, templateId);
  return { html, content: extracted };
}
