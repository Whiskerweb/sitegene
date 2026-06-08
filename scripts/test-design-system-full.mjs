/**
 * POC « design system as prompt » — génération du SITE COMPLET.
 *
 * Mistral reçoit le design-system.md + le contenu (toutes sections) et produit
 * la page entière (header + services + why + témoignages + pricing + faq + cta +
 * footer). Le header doit rester pixel-perfect ; le corps suit les patterns du
 * design system.
 *
 * Usage : MISTRAL_API_KEY=… node scripts/test-design-system-full.mjs electrician-pro
 */
import fs from "node:fs";
import path from "node:path";

const KEY = process.env.MISTRAL_API_KEY;
const MODEL = process.env.MISTRAL_MODEL || "mistral-large-latest";
const URL = "https://api.mistral.ai/v1/chat/completions";
if (!KEY) { console.error("MISTRAL_API_KEY manquant"); process.exit(1); }

const tpl = process.argv[2] || "electrician-pro";
const designSystem = fs.readFileSync(`public/_templates/${tpl}/design-system.md`, "utf-8");
const outDir = `docs/design-systems/tests/${tpl}`;
fs.mkdirSync(outDir, { recursive: true });

// Contenu intégral du template (source de vérité), pour la génération démo.
const idx = fs.readFileSync(`public/_templates/${tpl}/index.html`, "utf-8");
const a = idx.indexOf("__SITE_CONTENT__ ||");
const b = idx.indexOf("{", a);
let d = 0, i = b, q = null;
for (; i < idx.length; i++) { const c = idx[i]; if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; } if (c === '"' || c === "'" || c === "`") q = c; else if (c === "{") d++; else if (c === "}") { d--; if (d === 0) { i++; break; } } }
const content = JSON.parse(idx.slice(b, i));
// Réécrit les chemins d'images vers un chemin servable depuis outDir.
const imgBase = `../../../../public/_templates/${tpl}`;
const fixImgs = (o) => {
  if (typeof o === "string") return o.replace(new RegExp(`/_templates/${tpl}`, "g"), imgBase).replace(/^img\//, `${imgBase}/img/`);
  if (Array.isArray(o)) return o.map(fixImgs);
  if (o && typeof o === "object") { const r = {}; for (const k in o) r[k] = fixImgs(o[k]); return r; }
  return o;
};
const contentFixed = fixImgs(content);

const SYSTEM = `Tu es un développeur front senior. On te donne le DESIGN SYSTEM complet d'un template de site vitrine + le CONTENU à afficher. Produis la PAGE D'ACCUEIL COMPLÈTE en HTML5 autonome : header (nav + hero) PUIS toutes les sections du corps décrites dans le design system, dans l'ordre, PUIS le footer.

ANTI-SLOP (ne jamais retomber dans les défauts LLM) :
- La SEULE source de vérité esthétique est le DESIGN SYSTEM. N'injecte JAMAIS les clichés génériques : pas de dégradé violet/indigo « IA » s'il n'est pas dans le design system, pas de glassmorphism générique partout, pas de « trois cartes égales » par réflexe, pas de hero centré sur mesh sombre par défaut, pas d'Inter+slate-900 si le design system dit autre chose, pas de micro-animations en boucle infinie. Respecte les polices, couleurs et structures du design system, point.

EXIGENCES :
- Le HEADER doit être reproduit AU MILLIMÈTRE (classes Tailwind exactes du design system).
- Les sections du corps suivent les patterns décrits (en-tête de section, grilles, cartes, hover, accordéon FAQ…). Réutilise les classes citées.
- Page autonome : <head> avec Tailwind CDN, les Google Fonts, le bloc tailwind.config et le CSS custom du design system recopiés tels quels. Inclus un petit <script> vanilla pour l'accordéon FAQ (toggle de la classe .open).
- Utilise EXACTEMENT le contenu fourni (textes + chemins d'images tels quels).
- N'invente aucun style hors design system. Aucune couleur étrangère.

ANIMATIONS (obligatoire — un kit JS partagé sera injecté, tu dois juste ANNOTER le HTML) :
- Sur CHAQUE bloc qui apparaît au scroll (en-tête de section, carte, ligne de stat, image, paragraphe important), ajoute l'attribut **data-anim** (valeurs : défaut = montée+fondu ; "fade" ; "left" ; "right" ; "scale").
- Pour les éléments d'une même rangée/grille, ajoute un décalage : **data-anim-delay="0"**, "80", "160", "240"… (stagger en ms) pour qu'ils apparaissent l'un après l'autre.
- Le GRAND TITRE du hero (h1) reçoit la classe **anim-words** (apparition mot à mot) UNIQUEMENT s'il est en TEXTE SIMPLE (pas de <span> interne). Si le titre contient des <span> internes (dégradé, pilule, mot stylé), N'utilise PAS anim-words : mets **data-anim="fade"** sur le h1 à la place.
- CHAQUE CHIFFRE de statistique (compteurs) doit être un <span **data-count="<nombre>"** data-count-suffix="<ex: +, %, h, /7>" data-count-decimals="0">0</span> : le contenu de départ est "0", le kit anime jusqu'au nombre. Mets dans data-count la valeur numérique pure (ex. data-count="1200" data-count-suffix="+"). Pour "24/7", garde le texte tel quel (pas de compteur).
- N'inclus PAS toi-même le code du kit d'animation : il est ajouté automatiquement. Annote seulement.

- Réponds UNIQUEMENT avec le code HTML complet (<!DOCTYPE html> … </html>), sans backticks ni commentaire autour.`;

async function callMistral(user) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(URL, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "system", content: SYSTEM }, { role: "user", content: user }],
          temperature: 0.2,
          max_tokens: 32000,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 150)}`);
      const j = await res.json();
      let html = j.choices[0].message.content.trim();
      html = html.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "");
      return { html, usage: j.usage };
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }
}

const user = `DESIGN SYSTEM :
"""
${designSystem}
"""

CONTENU À AFFICHER (JSON, toutes les sections) :
"""
${JSON.stringify(contentFixed, null, 2)}
"""

Produis la page d'accueil complète (header + toutes les sections + footer).`;

console.log(`Génération SITE COMPLET de ${tpl} depuis le design system…`);
const { html: raw, usage } = await callMistral(user);
// Injecte le kit d'animation partagé juste avant </body> (ou </html> en repli).
const motionKit = fs.readFileSync("public/_templates/_shared/motion.html", "utf-8");
let html = raw;
if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, motionKit + "\n</body>");
else html = html.replace(/<\/html>/i, motionKit + "\n</html>");
const outFile = path.join(outDir, "full-site.html");
fs.writeFileSync(outFile, html);
console.log(`  → ${outFile} (${html.length} caractères, ${html.split("\n").length} lignes)`);
console.log(`  tokens : ${usage ? `${usage.completion_tokens} générés / ${usage.total_tokens} total` : "?"}`);
const closed = /<\/html>\s*$/i.test(html);
console.log(`  page terminée (</html>) : ${closed ? "OUI" : "NON — sortie tronquée, augmenter max_tokens ou découper"}`);
