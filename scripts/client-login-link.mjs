// Lien magic-link direct vers le dashboard client (sans email).
// node --env-file=.env.local scripts/client-login-link.mjs [email] [origin] [next]
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const email = (process.argv[2] || "lucas.roncey@gmail.com").toLowerCase();
const origin = process.argv[3] || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const next = process.argv[4] || "/dashboard";

const { data, error } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email,
  options: { redirectTo: `${origin}/auth/confirm?next=${next}` },
});
if (error) throw error;

const url = `${origin}/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink&next=${next}`;
console.log("\n👉 Lien de connexion (clic = entre dans le dashboard) :\n");
console.log(url);
console.log("");
