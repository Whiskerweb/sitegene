// Réinitialise la roue de bienvenue (→ re-déclenche le tutoriel atelier) pour un compte.
// Lancer : node --env-file=.env.local scripts/reset-tour.mjs [email]
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const email = (process.argv[2] || "arnaud@yopmail.com").toLowerCase();

// Recherche paginée de l'utilisateur par email.
let user = null;
for (let page = 1; page <= 50 && !user; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw error;
  user = data.users.find((u) => u.email?.toLowerCase() === email) ?? null;
  if (data.users.length < 200) break; // dernière page
}
if (!user) {
  console.error(`✗ Aucun compte pour ${email}`);
  process.exit(1);
}

const { data: before } = await admin
  .from("profiles")
  .select("id, email, wheel_spun_at")
  .eq("id", user.id)
  .maybeSingle();
console.log(`Avant : wheel_spun_at = ${before?.wheel_spun_at ?? "null"}`);

const { error: upErr } = await admin
  .from("profiles")
  .update({ wheel_spun_at: null })
  .eq("id", user.id);
if (upErr) throw upErr;

console.log(`✓ Roue réinitialisée pour ${email} (${user.id}) — wheel_spun_at = null`);
console.log("  → à la prochaine ouverture du dashboard : roue de bienvenue + tutoriel guidé.");
