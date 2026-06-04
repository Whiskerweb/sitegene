// Traduction FR des templates (lignée HTML clone-site) — marché France.
//
// Pour chaque template : traduit les chaînes visibles de default-content.json
// via Mistral (bornées par les maxLen du manifest), puis synchronise le guard
// inline `window.__SITE_CONTENT__ = window.__SITE_CONTENT__ || {…}` de
// index.html (fallback des démos directes) et pose <html lang="fr">.
// Les clés/chemins ne changent JAMAIS (les tests templates-html restent verts).
//
// Usage :
//   node --env-file=.env.local scripts/translate-templates.mjs --id cleaning-services
//   node --env-file=.env.local scripts/translate-templates.mjs --all
//
// Idempotent : retraduire un template déjà FR le laisse en FR (l'IA renvoie
// les valeurs inchangées). Re-packer un template depuis sites/ (source EN)
// nécessite de relancer ce script sur son id.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TPL_DIR = join(ROOT, "public", "_templates");

/** Templates déjà en français (ou SPA gérés à part) : jamais touchés par --all. */
const SKIP_IDS = new Set([
  "alice-r", "potozon", "target", "eloctix", // SPA (traduits à la source)
  "plumber-pro", "plumber-emergency", "wedding-warm", // déjà FR
]);

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
const MODEL = process.env.MISTRAL_MODEL || "mistral-large-latest";
const CHUNK = 80;

/* ----------------------------------------------------------- collecte */

const SKIP_KEY_RE =
  /(image|img|src|url|href|icon|video|avatar|poster|logo|slot|path|role|tone|color|bg|font|ease|anim)$/i;

function skipValue(v) {
  const s = v.trim();
  if (s.length < 2) return true;
  if (/^[\d\s.,+%€$£:/()x-]+$/.test(s)) return true; // nombres, notes, plages horaires
  if (/^(https?:)?\//.test(s) || s.includes("/_templates/")) return true;
  if (s.includes("@") && !s.includes(" ")) return true; // emails
  if (/^#[0-9a-f]{3,8}$/i.test(s)) return true; // couleurs
  if (/^[a-z0-9_-]+$/.test(s) && s.length <= 12) return true; // slugs/ancres/ids
  return false;
}

function collectStrings(node, path, out) {
  if (typeof node === "string") {
    if (!skipValue(node)) out.push({ path, value: node });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => collectStrings(v, `${path}[${i}]`, out));
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === "string" && SKIP_KEY_RE.test(k)) continue;
      collectStrings(v, path ? `${path}.${k}` : k, out);
    }
  }
}

function setPath(obj, path, value) {
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
  cur[parts[parts.length - 1]] = value;
}

/** Bornes maxLen du manifest (chemins génériques [] → regex). */
function maxLenLookup(manifest) {
  const rules = (manifest?.fields?.editable ?? [])
    .filter((f) => typeof f?.path === "string" && typeof f?.maxLen === "number")
    .map((f) => ({
      re: new RegExp(
        "^" + f.path.split("[]").map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\[\\d+\\]") + "$",
      ),
      maxLen: f.maxLen,
    }));
  return (path, fallbackLen) => {
    for (const r of rules) if (r.re.test(path)) return r.maxLen;
    return Math.max(Math.ceil(fallbackLen * 1.4), fallbackLen + 12);
  };
}

/* ----------------------------------------------------------- Mistral */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function chat(messages, maxTokens = 6000) {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) throw new Error("MISTRAL_API_KEY manquant (.env.local).");
  // Retry avec backoff sur rate-limit (429) / erreurs transitoires (5xx).
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(MISTRAL_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });
    if (res.ok) {
      const j = await res.json();
      return j.choices?.[0]?.message?.content ?? "";
    }
    const body = (await res.text()).slice(0, 200);
    if ((res.status === 429 || res.status >= 500) && attempt < 6) {
      const wait = Math.min(15_000 * 2 ** (attempt - 1), 120_000);
      process.stdout.write(`  ⏳ ${res.status}, retry dans ${wait / 1000}s (essai ${attempt}/6)\n`);
      await sleep(wait);
      continue;
    }
    throw new Error(`Mistral ${res.status}: ${body}`);
  }
}

const SYSTEM = `Tu traduis le contenu d'un site vitrine professionnel de l'ANGLAIS vers le FRANÇAIS (marché France). Adaptation naturelle et premium, pas du mot-à-mot.
RÈGLES STRICTES :
- Respecte la limite maxLen (en caractères) de chaque champ.
- Conserve TELS QUELS : noms propres et noms de marque (ex. "Neatly", "Healix"), emails, téléphones, URLs, chiffres, notes (4.7), sigles.
- Garde le rôle du champ : un titre reste court et percutant, une description 1-2 phrases.
- Si une valeur est déjà en français, renvoie-la INCHANGÉE.
- Réponds en JSON STRICT { "<path>": "<texte fr>" } avec EXACTEMENT les chemins fournis, tous présents.`;

async function translateChunk(items) {
  const user = `Champs à traduire (path · maxLen · texte) :\n${items
    .map((i) => `- ${i.path} · ${i.maxLen} · ${JSON.stringify(i.value)}`)
    .join("\n")}\n\nRenvoie le JSON.`;
  const raw = await chat([
    { role: "system", content: SYSTEM },
    { role: "user", content: user },
  ]);
  return JSON.parse(raw);
}

/* ------------------------------------------------- patch index.html */

/** Localise l'objet du guard (accolades équilibrées, hors chaînes).
 *  Tolère les guards doublés `= window.__SITE_CONTENT__ || window.__SITE_CONTENT__ || {…}`. */
function findGuardObject(html) {
  const m = html.match(/window\.__SITE_CONTENT__\s*=\s*(?:window\.__SITE_CONTENT__\s*\|\|\s*)+/);
  if (!m) return null;
  const start = m.index + m[0].length;
  if (html[start] !== "{") return null;
  let depth = 0, i = start, inStr = null;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (inStr) {
      if (ch === "\\") i++;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") inStr = ch;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return { start, end: i + 1 };
    }
  }
  return null;
}

function patchHtml(html, content) {
  const span = findGuardObject(html);
  if (span) {
    html = html.slice(0, span.start) + JSON.stringify(content, null, 2) + html.slice(span.end);
  } else {
    console.warn("  ⚠ guard __SITE_CONTENT__ introuvable dans index.html (non patché)");
  }
  if (/<html\b[^>]*\blang="/.test(html)) {
    html = html.replace(/(<html\b[^>]*\blang=")[^"]*(")/, "$1fr$2");
  } else {
    html = html.replace(/<html\b/, '<html lang="fr"');
  }
  return html;
}

/**
 * Chaînes visibles du HTML qui semblent rester en anglais — UNIQUEMENT dans les
 * éléments NON annotés data-sg-path (les annotés sont réécrits en FR par
 * l'hydratation au boot, depuis le guard traduit). Revue manuelle.
 */
function englishResidue(html) {
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  const texts = [...body.matchAll(/<([a-zA-Z][a-zA-Z0-9-]*)((?:[^<>"']|"[^"]*"|'[^']*')*)>([^<>{}]+)</g)]
    .filter((m) => !/data-sg-(path|img)=/.test(m[2]))
    .map((m) => m[3].replace(/\s+/g, " ").trim())
    .filter((t) => t.length > 8);
  const en = /\b(the|and|your|with|our|you|for|from|that|every|about|contact us|book now|learn more|get started|read more)\b/i;
  const fr = /\b(le|la|les|des|votre|vos|avec|notre|pour|chez|découvrez|réserver|contactez)\b|[éèêàçùâîô]/i;
  return [...new Set(texts.filter((t) => en.test(t) && !fr.test(t)))];
}

/* --------------------------------------------------------------- run */

/** Resynchronise uniquement le guard inline + lang="fr" depuis default-content.json. */
function patchOnly(id) {
  const dir = join(TPL_DIR, id);
  const contentPath = join(dir, "default-content.json");
  const htmlPath = join(dir, "index.html");
  if (!existsSync(contentPath) || !existsSync(htmlPath)) return;
  const content = JSON.parse(readFileSync(contentPath, "utf8"));
  writeFileSync(htmlPath, patchHtml(readFileSync(htmlPath, "utf8"), content));
  console.log(`✓ ${id} guard resynchronisé`);
}

async function translateTemplate(id) {
  const dir = join(TPL_DIR, id);
  const contentPath = join(dir, "default-content.json");
  const htmlPath = join(dir, "index.html");
  const manifestPath = join(dir, "manifest.json");
  if (!existsSync(contentPath)) throw new Error(`default-content.json absent: ${id}`);

  const content = JSON.parse(readFileSync(contentPath, "utf8"));
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : null;

  const items = [];
  collectStrings(content, "", items);
  const lenOf = maxLenLookup(manifest);
  for (const it of items) it.maxLen = lenOf(it.path, it.value.length);
  console.log(`▶ ${id} : ${items.length} chaînes`);
  if (items.length === 0) return;

  const translated = {};
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    const out = await translateChunk(chunk);
    for (const it of chunk) {
      const v = out[it.path];
      if (typeof v === "string" && v.trim()) translated[it.path] = v.trim().slice(0, it.maxLen);
    }
    process.stdout.write(`  …${Math.min(i + CHUNK, items.length)}/${items.length}\n`);
    await sleep(4_000); // espacement anti rate-limit
  }

  for (const [p, v] of Object.entries(translated)) setPath(content, p, v);
  writeFileSync(contentPath, JSON.stringify(content, null, 2) + "\n");

  if (existsSync(htmlPath)) {
    const html = patchHtml(readFileSync(htmlPath, "utf8"), content);
    writeFileSync(htmlPath, html);
    const residue = englishResidue(html);
    if (residue.length) {
      console.log(`  ⚠ ${residue.length} texte(s) HTML possiblement EN (hors contenu) :`);
      residue.slice(0, 8).forEach((t) => console.log(`     · ${t.slice(0, 90)}`));
    }
  }
  console.log(`✓ ${id} traduit (${Object.keys(translated).length} valeurs)`);
}

const args = process.argv.slice(2);
const idArg = args.includes("--id") ? args[args.indexOf("--id") + 1] : null;
const idsArg = args.includes("--ids") ? args[args.indexOf("--ids") + 1] : null;
const all = args.includes("--all");

const ids = idArg
  ? [idArg]
  : idsArg
    ? idsArg.split(",").map((s) => s.trim()).filter(Boolean)
    : all
      ? readdirSync(TPL_DIR).filter((d) => !SKIP_IDS.has(d) && existsSync(join(TPL_DIR, d, "default-content.json")))
      : null;

if (!ids) {
  console.log("Usage: translate-templates.mjs --id <template> | --ids a,b,c | --all");
  process.exit(1);
}

const patchOnlyMode = args.includes("--patch-only");

const failed = [];
for (const id of ids) {
  try {
    if (patchOnlyMode) {
      patchOnly(id);
      continue;
    }
    await translateTemplate(id);
  } catch (e) {
    failed.push(id);
    console.error(`✗ ${id}:`, e.message);
  }
  await sleep(4_000);
}
if (failed.length) {
  console.log(`\nÉchecs à relancer : --ids ${failed.join(",")}`);
  process.exitCode = 1;
}
