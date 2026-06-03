// Enrôle dans la file de prospection (`outreach`) les prospects déjà en base
// qui sont éligibles : un email + un reveal code actif (status 'sent'), pas déjà
// enrôlés, pas suppressés. Idempotent (contrainte unique sur prospect_id).
//
//   npm run outreach:enroll          → enrôle tous les éligibles
//   npm run outreach:enroll -- --dry → aperçu sans écrire
import { createClient } from "@supabase/supabase-js";
import { isSuppressed } from "../lib/email/suppress.ts";

const DRY = process.argv.includes("--dry");

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const log = (...a) => console.log(...a);

// 1. Codes reveal actifs (token présent, statut 'sent'), du plus récent au plus
//    ancien → on garde un seul code par prospect (le plus récent).
const { data: codes, error: codesErr } = await admin
  .from("prospect_codes")
  .select("token, prospect_id, status, created_at, prospects(email, first_name)")
  .eq("status", "sent")
  .not("token", "is", null)
  .not("prospect_id", "is", null)
  .order("created_at", { ascending: false });

if (codesErr) {
  console.error("Erreur lecture prospect_codes:", codesErr.message);
  process.exit(1);
}

// 2. Prospects déjà enrôlés → à exclure.
const { data: existing } = await admin.from("outreach").select("prospect_id");
const enrolled = new Set((existing ?? []).map((r) => r.prospect_id));

const seen = new Set();
let candidates = 0;
let inserted = 0;
let skipped = 0;

for (const code of codes ?? []) {
  const pid = code.prospect_id;
  if (seen.has(pid)) continue; // garde le plus récent uniquement
  seen.add(pid);

  if (enrolled.has(pid)) {
    skipped += 1;
    continue;
  }
  const prospect = Array.isArray(code.prospects) ? code.prospects[0] : code.prospects;
  const email = prospect?.email ?? null;
  if (!email) {
    skipped += 1;
    continue;
  }
  if (await isSuppressed(admin, email)) {
    log(`skip ${email} — suppressé`);
    skipped += 1;
    continue;
  }

  candidates += 1;
  if (DRY) {
    log(`[dry] enrôlerait ${email} (token ${code.token})`);
    continue;
  }

  const { error } = await admin
    .from("outreach")
    .insert({ prospect_id: pid, reveal_token: code.token });
  if (error) {
    // 23505 = doublon (course / déjà enrôlé) → ignoré.
    if (error.code !== "23505") log(`✗ ${email} — ${error.message}`);
    skipped += 1;
  } else {
    inserted += 1;
    log(`✓ enrôlé ${email}`);
  }
}

log(
  DRY
    ? `\n[dry] ${candidates} prospect(s) seraient enrôlés, ${skipped} ignoré(s).`
    : `\n${inserted} enrôlé(s), ${skipped} ignoré(s).`,
);
process.exit(0);
