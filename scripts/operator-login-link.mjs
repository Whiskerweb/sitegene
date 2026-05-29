// Génère un lien de connexion magic-link direct pour l'opérateur (sans email).
// node --env-file=.env.local scripts/operator-login-link.mjs [email] [origin]
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const email = (process.argv[2] || "lucasroncey07@gmail.com").toLowerCase();
const origin = process.argv[3] || "http://localhost:3000";

const { data, error } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email,
  options: { redirectTo: `${origin}/auth/callback?next=/admin` },
});
if (error) throw error;

console.log("\n👉 Lien de connexion opérateur (clique pour entrer dans /admin) :\n");
console.log(data.properties.action_link);
console.log("");
