// Crée une note + un job modify_site (simule l'approbation opérateur).
// node --env-file=.env.local scripts/test-note-modify.mjs
import { createClient } from "@supabase/supabase-js";
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const SITE = "8bea675b-af5a-4071-9526-61d5ef18235d";
const OWNER = "d51fcdee-ba83-482c-9cce-a48782d07888";
const OP = "79e7824f-4423-4e9e-8a4a-a31ead427d8d";
const msg = "Change la marque affichée (hero.brand) en : Vision Paris Studio.";

const { data: note } = await admin
  .from("notes")
  .insert({ site_id: SITE, author_user_id: OWNER, message: msg, status: "in_progress" })
  .select("id")
  .single();
await admin.from("jobs").insert({
  type: "modify_site",
  status: "pending",
  site_id: SITE,
  created_by: OP,
  payload: { siteId: SITE, instruction: msg, noteId: note.id },
});
console.log(`✓ note ${note.id} + job modify_site créés`);
