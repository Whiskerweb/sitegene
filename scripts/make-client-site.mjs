// Crée/most à jour un site MULTI-PAGES (v2) « live » possédé par un compte client
// EXISTANT, éditable page par page dans le dashboard (/editor).
// Version réduite : ne crée pas de compte, n'octroie pas de crédits, ne supprime rien.
//
// Usage :
//   node --env-file=.env.local scripts/make-client-site.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const EMAIL = (process.env.CLIENT_EMAIL || "lucas.roncey@gmail.com").toLowerCase();
const TEMPLATE = process.env.CLIENT_TEMPLATE || "alice-r";
const SLUG = process.env.CLIENT_SLUG || "studio-halo";
const BRAND = process.env.CLIENT_BRAND || "Studio Halo";

// 1) Compte EXISTANT (lookup, pas de création).
const { data: list, error: le } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
if (le) throw le;
const user = list.users.find((u) => u.email?.toLowerCase() === EMAIL);
if (!user) {
  console.error(`✗ Aucun compte ${EMAIL}. Connecte-toi une 1re fois au dashboard, puis relance.`);
  process.exit(1);
}
console.log(`✓ Compte trouvé : ${EMAIL} (${user.id})`);

// 2) Contenu v2 multi-pages depuis le template + branding inventé.
const content = JSON.parse(
  readFileSync(join(process.cwd(), "public/_templates", TEMPLATE, "default-content.json"), "utf8"),
);
content.site = content.site || {};
content.site.brand = BRAND;
const home = Array.isArray(content.pages) ? content.pages.find((p) => p.slug === "/") : null;
if (home?.content?.hero && typeof home.content.hero === "object" && "brand" in home.content.hero) {
  home.content.hero.brand = BRAND;
}
const pageList = Array.isArray(content.pages)
  ? content.pages.map((p) => `${p.slug} (${p.type})`).join(", ")
  : "(v1 plat)";

// 3) Site live possédé par le client — insert-or-update (sans suppression).
const { data: existing } = await admin
  .from("sites")
  .select("id")
  .eq("slug", SLUG)
  .maybeSingle();

let siteId;
if (existing) {
  siteId = existing.id;
  const { error: ue } = await admin
    .from("sites")
    .update({
      template_id: TEMPLATE,
      template_version: "2",
      status: "live",
      published_at: new Date().toISOString(),
      owner_user_id: user.id,
    })
    .eq("id", siteId);
  if (ue) throw ue;
  console.log(`✓ Site existant mis à jour (${siteId})`);
} else {
  const { data: site, error: e1 } = await admin
    .from("sites")
    .insert({
      slug: SLUG,
      template_id: TEMPLATE,
      template_version: "2",
      status: "live",
      published_at: new Date().toISOString(),
      owner_user_id: user.id,
    })
    .select("id")
    .single();
  if (e1) throw e1;
  siteId = site.id;
  console.log(`✓ Site créé (${siteId})`);
}

// 4) Nouvelle version de contenu v2 publiée (append, sans écraser l'historique).
const { data: topv } = await admin
  .from("site_content")
  .select("version")
  .eq("site_id", siteId)
  .order("version", { ascending: false })
  .limit(1)
  .maybeSingle();
const nextVersion = (topv?.version ?? 0) + 1;
// la version précédente n'est plus "publiée" (une seule publiée à la fois)
await admin.from("site_content").update({ is_published: false }).eq("site_id", siteId);
const { error: e2 } = await admin.from("site_content").insert({
  site_id: siteId,
  version: nextVersion,
  content_json: content,
  is_published: true,
  created_by: "operator",
});
if (e2) throw e2;

const APP = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
console.log("");
console.log(`✓ Site multi-pages « ${BRAND} » (template ${TEMPLATE}) prêt`);
console.log(`  Pages : ${pageList}`);
console.log(`  Dashboard : ${APP}/dashboard`);
console.log(`  Éditeur (sélecteur de page) : ${APP}/editor`);
console.log(`  Public : ${APP}/s/${SLUG}`);
