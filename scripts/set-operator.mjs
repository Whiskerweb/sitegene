// Promeut un email en compte opérateur (crée le user si besoin).
// Lancer : node --env-file=.env.local scripts/set-operator.mjs [email]
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const email = (process.argv[2] || "lucasroncey07@gmail.com").toLowerCase();

const { data: list, error: lerr } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 200,
});
if (lerr) throw lerr;
let user = list.users.find((u) => u.email?.toLowerCase() === email);

if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (error) throw error;
  user = data.user;
  console.log(`User créé : ${email}`);
} else {
  console.log(`User existant : ${email}`);
}

const { error: upErr } = await admin
  .from("profiles")
  .upsert({ id: user.id, email, is_operator: true });
if (upErr) throw upErr;

console.log(`✓ Opérateur défini : ${email} (${user.id})`);
