// Insère un site démo "live" pour tester /s/<slug> de bout en bout.
// Lancer : node --env-file=.env.local scripts/seed-demo-site.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const SLUG = "studio-demo";
const TEMPLATE = "alice-r";

const content = JSON.parse(
  readFileSync(
    join(ROOT, "public/_templates", TEMPLATE, "default-content.json"),
    "utf8",
  ),
);
content.hero.brand = "Studio Démo";
content.hero.title = ["Contenu injecté", "depuis Supabase"];

// Idempotence : on supprime l'éventuel site démo (site_content cascade).
await admin.from("sites").delete().eq("slug", SLUG);

const { data: site, error: e1 } = await admin
  .from("sites")
  .insert({
    slug: SLUG,
    template_id: TEMPLATE,
    status: "live",
    published_at: new Date().toISOString(),
  })
  .select()
  .single();
if (e1) throw e1;

const { error: e2 } = await admin.from("site_content").insert({
  site_id: site.id,
  version: 1,
  content_json: content,
  is_published: true,
  created_by: "operator",
});
if (e2) throw e2;

console.log(`✓ Site démo seedé : /s/${SLUG} (site ${site.id})`);
