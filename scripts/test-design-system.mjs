/**
 * POC « design system as prompt » — harnais de test.
 *
 * Mistral reçoit UNIQUEMENT le design-system.md d'un template (jamais le HTML
 * original) et doit produire le HEADER (nav + hero) en HTML standalone :
 *   Test 1 — reconstruction : contenu démo → le rendu doit être indiscernable
 *            de l'original (fidélité au millimètre).
 *   Test 2 — adaptation : brief client réel + demande hors-cadre → fidélité à
 *            la DA + intégration de la demande dans le langage du template.
 *
 * Sortie : docs/design-systems/tests/<id>/ (HTML générés + compare.html à
 * ouvrir dans un navigateur pour la comparaison côte à côte avec l'original).
 *
 * Usage : MISTRAL_API_KEY=… node scripts/test-design-system.mjs electrician-pro
 */
import fs from "node:fs";
import path from "node:path";

const KEY = process.env.MISTRAL_API_KEY;
const MODEL = process.env.MISTRAL_MODEL || "mistral-large-latest";
const URL = "https://api.mistral.ai/v1/chat/completions";
if (!KEY) { console.error("MISTRAL_API_KEY manquant"); process.exit(1); }

const tpl = process.argv[2] || "electrician-pro";
const dsPath = `public/_templates/${tpl}/design-system.md`;
const designSystem = fs.readFileSync(dsPath, "utf-8");
const outDir = `docs/design-systems/tests/${tpl}`;
fs.mkdirSync(outDir, { recursive: true });

// Photo du hero : chemin relatif depuis outDir vers les assets du template.
const heroImg = `../../../../public/_templates/${tpl}/img/hero.jpg`;

const SYSTEM = `Tu es un développeur front senior. On te donne le DESIGN SYSTEM complet d'un template de site vitrine. Ta mission : produire le HEADER du site (la barre de navigation + la section hero, RIEN d'autre) en une page HTML5 complète et autonome.

EXIGENCES :
- Suis le design system AU MILLIMÈTRE : structure DOM, classes Tailwind exactes, tokens, CSS custom, espacements, états hover, responsive. Les blocs de code du design system sont la référence absolue.
- Page autonome : <head> avec Tailwind CDN (https://cdn.tailwindcss.com), les Google Fonts indiquées, le bloc tailwind.config et le CSS custom du design system recopiés tels quels.
- Remplis les emplacements {…} avec le contenu fourni dans la demande.
- N'ajoute AUCUNE section après le hero. N'invente aucun style hors design system.
- Réponds UNIQUEMENT avec le code HTML complet (de <!DOCTYPE html> à </html>), sans commentaire autour, sans backticks.`;

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
          max_tokens: 8000,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 150)}`);
      const j = await res.json();
      let html = j.choices[0].message.content.trim();
      // Nettoie d'éventuels backticks malgré la consigne.
      html = html.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "");
      return html;
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }
}

// ---- Test 1 : reconstruction fidèle (contenu démo du template) --------------
const test1 = `DESIGN SYSTEM :
"""
${designSystem}
"""

CONTENU À UTILISER (reconstruction de la démo) :
- Marque : Ohmly
- Note d'avis : 4,8+ Avis
- Liens nav (dans l'ordre) : Accueil (actif), À propos (#about), Prestations (#services), Pourquoi nous (#why), Tarifs (#pricing), Nos réalisations (#), Contact & devis (#)
- CTA nav : Demander un devis
- H1 : Solutions électriques sûres et fiables
- Tagline : Électriciens agréés et certifiés pour des interventions rapides, sécurisées et économiques chez vous ou en entreprise.
- CTA hero : Réserver une intervention
- Photo hero : ${heroImg}
- Badge photo : Made in Demo

Produis le header complet.`;

// ---- Test 2 : adaptation client + demande hors-cadre ------------------------
const test2 = `DESIGN SYSTEM :
"""
${designSystem}
"""

BRIEF CLIENT (adaptation réelle) :
- Marque : Volt'Éclair — électricien à Brest et alentours (30 km)
- Spécialités : mise aux normes NF C 15-100, dépannage urgent, bornes de recharge véhicule électrique
- Points forts : intervention 24h/24 7j/7, devis gratuit sous 2 h, 12 ans d'expérience, note Google 4,9 (87 avis)
- DEMANDE SPÉCIALE DU CLIENT : il veut que l'urgence 24/7 soit ULTRA visible dès l'arrivée sur le site, avec son numéro 02 98 45 12 34.
- Photo hero : ${heroImg}

Adapte le header à ce client en restant fidèle au design system (vois la section « Règles d'adaptation & verrous »). Produis le header complet.`;

console.log(`Design system : ${dsPath} (${designSystem.length} caractères)`);
console.log("Test 1 — reconstruction fidèle…");
const html1 = await callMistral(test1);
fs.writeFileSync(path.join(outDir, "test1-reconstruction.html"), html1);
console.log(`  → ${outDir}/test1-reconstruction.html (${html1.length} caractères)`);

console.log("Test 2 — adaptation client (Volt'Éclair, urgence 24/7)…");
const html2 = await callMistral(test2);
fs.writeFileSync(path.join(outDir, "test2-adaptation.html"), html2);
console.log(`  → ${outDir}/test2-adaptation.html (${html2.length} caractères)`);

// ---- Page de comparaison côte à côte ----------------------------------------
const compare = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><title>POC design-system — ${tpl}</title>
<style>
body{margin:0;font-family:system-ui;background:#111;color:#eee}
h1{font-size:16px;padding:12px 16px;margin:0;background:#1a1a1a}
.row{display:grid;grid-template-columns:1fr 1fr;gap:2px;background:#333}
.col{background:#fff;display:flex;flex-direction:column}
.col h2{font-size:13px;margin:0;padding:8px 12px;background:#222;color:#ccc}
iframe{border:0;width:100%;height:780px}
</style></head><body>
<h1>POC design-system « ${tpl} » — l'IA n'a JAMAIS vu le HTML original, seulement le design-system.md</h1>
<div class="row">
  <div class="col"><h2>ORIGINAL (template réel)</h2><iframe src="../../../../public/_templates/${tpl}/index.html"></iframe></div>
  <div class="col"><h2>TEST 1 — reconstruit par Mistral depuis le design system</h2><iframe src="test1-reconstruction.html"></iframe></div>
</div>
<div class="row" style="margin-top:2px">
  <div class="col"><h2>TEST 2 — adapté au client Volt'Éclair (urgence 24/7 demandée)</h2><iframe src="test2-adaptation.html"></iframe></div>
  <div class="col"><h2>ORIGINAL (référence)</h2><iframe src="../../../../public/_templates/${tpl}/index.html"></iframe></div>
</div>
</body></html>`;
fs.writeFileSync(path.join(outDir, "compare.html"), compare);
console.log(`\nComparaison : ouvrir ${outDir}/compare.html dans un navigateur`);
