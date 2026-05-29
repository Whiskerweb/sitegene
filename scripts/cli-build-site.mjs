// Publie un site (draft) + un lien d'aperçu (reveal) vers Supabase, depuis un
// content.json adapté + un dossier de photos. Le site apparaît dans /admin.
//
// Usage (depuis sitegene/) :
//   node --import tsx --env-file=.env.local scripts/cli-build-site.mjs \
//     --template alice-r --name "Studio Lumen" [--email contact@studio.fr] \
//     --content ./.intake-tmp/lumen/content.json --photos ./.intake-tmp/lumen/photos
//
// Les images du content.json sont reliées aux fichiers du dossier --photos PAR LEUR
// NOM (basename) : mets dans content.json le nom de fichier réel de la photo voulue
// pour chaque emplacement (ex "hero.jpg", "p3.jpg", "mariage-01.jpg").
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const templateId = arg("template");
const name = arg("name");
const email = arg("email");
const contentPath = arg("content");
const photosDir = arg("photos");

const TEMPLATES = ["alice-r", "potozon", "target"];
if (!TEMPLATES.includes(templateId)) {
  console.error("--template invalide. Attendu : alice-r | potozon | target");
  process.exit(1);
}
if (!name) {
  console.error("--name requis (prénom / nom du studio).");
  process.exit(1);
}
if (!contentPath || !existsSync(contentPath)) {
  console.error("--content <fichier .json> requis et doit exister.");
  process.exit(1);
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const CT = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
const siteId = randomUUID();

// 1) Upload des photos → map { basename: urlPublique }
const urlByBase = {};
if (photosDir && existsSync(photosDir)) {
  for (const file of readdirSync(photosDir)) {
    const ext = (file.split(".").pop() || "").toLowerCase();
    if (!CT[ext]) continue;
    const buf = readFileSync(join(photosDir, file));
    const { error } = await admin.storage
      .from("site-photos")
      .upload(`${siteId}/${file}`, buf, { contentType: CT[ext], upsert: true });
    if (error) {
      console.error(`Upload ${file} : ${error.message}`);
      process.exit(1);
    }
    const { data: pub } = admin.storage.from("site-photos").getPublicUrl(`${siteId}/${file}`);
    urlByBase[file] = pub.publicUrl;
  }
  console.log(`✓ ${Object.keys(urlByBase).length} photo(s) uploadée(s).`);
}

// 2) Lecture du contenu + réécriture des images (par nom de fichier).
function rewrite(node) {
  if (typeof node === "string") {
    const b = node.split("/").pop();
    return urlByBase[b] ?? node;
  }
  if (Array.isArray(node)) return node.map(rewrite);
  if (node && typeof node === "object") {
    const o = {};
    for (const [k, v] of Object.entries(node)) o[k] = rewrite(v);
    return o;
  }
  return node;
}
const content = rewrite(JSON.parse(readFileSync(contentPath, "utf8")));

// 3) Opérateur (created_by).
const { data: op } = await admin
  .from("profiles")
  .select("id")
  .eq("is_operator", true)
  .limit(1)
  .maybeSingle();

// 4) Insertions : prospect → site (draft) → contenu v1 → code/token de reveal.
const { data: prospect, error: pe } = await admin
  .from("prospects")
  .insert({ first_name: name, email: email ?? null, template_id: templateId, created_by: op?.id ?? null })
  .select("id")
  .single();
if (pe) { console.error("prospect:", pe.message); process.exit(1); }

const { error: se } = await admin.from("sites").insert({ id: siteId, template_id: templateId, status: "draft" });
if (se) { console.error("site:", se.message); process.exit(1); }

const { error: ce } = await admin.from("site_content").insert({
  site_id: siteId, version: 1, content_json: content, is_published: false, created_by: "operator",
});
if (ce) { console.error("contenu:", ce.message); process.exit(1); }

const token = randomUUID().replace(/-/g, "");
const code = name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
const { error: ke } = await admin
  .from("prospect_codes")
  .insert({ prospect_id: prospect.id, code, token, site_id: siteId, status: "sent" });
if (ke) { console.error("code:", ke.message); process.exit(1); }

console.log("");
console.log(`✓ Site créé : « ${name} » (template ${templateId})`);
console.log(`  Aperçu (reveal) : ${APP_URL}/r/${token}`);
console.log(`  → Visible dans le dashboard opérateur : ${APP_URL}/admin`);
