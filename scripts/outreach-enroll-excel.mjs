// Enrôle / met à jour la campagne depuis l'Excel de prospection (source de vérité :
// email + lien reveal + MESSAGE rédigé à la main + prénom).
//   1. extraction Excel (helper Python) ;
//   2. backfill prospects.email / first_name ;
//   3. (re)mise en file outreach (status queued, step 0) tant que pas engagé/avancé ;
//   4. écriture des messages par token → scripts/.outreach-messages.json (lu par le worker).
//
//   npm run outreach:enroll:excel -- "/chemin/Akyra Prospection photographes.xlsx"
//   npm run outreach:enroll:excel -- --dry "/chemin/fichier.xlsx"
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { isSuppressed } from "../lib/email/suppress.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const XLSX_PATH =
  args.find((a) => a.toLowerCase().endsWith(".xlsx")) ||
  `${process.env.HOME}/Downloads/Akyra Prospection photographes.xlsx`;

const log = (...a) => console.log(...a);

/** Sujet de l'email initial (le corps = ton message). */
function subjectFor(firstName) {
  return firstName ? `${firstName}, votre site est prêt` : "Votre site est prêt";
}

const ext = spawnSync("python3", ["scripts/extract-prospects-xlsx.py", XLSX_PATH], {
  encoding: "utf8",
});
if (ext.status !== 0) {
  console.error("Extraction Excel échouée:", ext.stderr || ext.error?.message);
  process.exit(1);
}
const rows = JSON.parse(ext.stdout).filter((r) => r.valid && r.message);
log(`Excel : ${rows.length} ligne(s) prêtes (email + lien + message) — ${XLSX_PATH}`);

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: codes } = await admin
  .from("prospect_codes")
  .select("token, prospect_id, status");
const byToken = new Map((codes || []).map((c) => [c.token, c]));

const { data: existing } = await admin.from("outreach").select("id, prospect_id, status, step");
const byProspect = new Map((existing || []).map((r) => [r.prospect_id, r]));

const messages = {};
let backfilled = 0;
let enrolledN = 0;
let requeued = 0;
let skipped = 0;
const seenEmail = new Set();

for (const r of rows) {
  const code = byToken.get(r.token);
  if (!code || !code.prospect_id) {
    log(`skip ${r.email} — token introuvable en base`);
    skipped += 1;
    continue;
  }
  const pid = code.prospect_id;
  const emailKey = r.email.toLowerCase();
  if (seenEmail.has(emailKey)) {
    skipped += 1;
    continue;
  }
  seenEmail.add(emailKey);

  if (code.status === "paid") {
    log(`skip ${r.email} — déjà client`);
    skipped += 1;
    continue;
  }
  if (await isSuppressed(admin, r.email)) {
    log(`skip ${r.email} — suppressé`);
    skipped += 1;
    continue;
  }

  // Message + sujet à servir pour ce prospect (clé = token).
  messages[r.token] = { message: r.message, subject: subjectFor(r.first_name) };

  if (DRY) {
    const cur = byProspect.get(pid);
    log(`[dry] ${r.email} (${cur ? "déjà enrôlé, sera re-mis en file" : "nouveau"})`);
    continue;
  }

  // Backfill prospect.
  await admin
    .from("prospects")
    .update({ email: r.email, first_name: r.first_name || null })
    .eq("id", pid);
  backfilled += 1;

  const cur = byProspect.get(pid);
  const now = new Date().toISOString();
  if (!cur) {
    const { error } = await admin
      .from("outreach")
      .insert({ prospect_id: pid, reveal_token: r.token });
    if (!error) enrolledN += 1;
    else if (error.code !== "23505") log(`✗ ${r.email} — ${error.message}`);
  } else if (["queued", "active"].includes(cur.status) && cur.step <= 1) {
    // Pas encore engagé/avancé → on (re)met en file pour servir le bon message.
    await admin
      .from("outreach")
      .update({
        status: "queued",
        step: 0,
        next_run_at: now,
        last_sent_at: null,
        reveal_token: r.token,
        updated_at: now,
      })
      .eq("id", cur.id);
    requeued += 1;
  }
}

if (!DRY) {
  const outPath = join(__dirname, ".outreach-messages.json");
  writeFileSync(outPath, JSON.stringify(messages, null, 2));
  log(`Messages écrits : ${Object.keys(messages).length} → ${outPath}`);
}

log(
  DRY
    ? `\n[dry] ${rows.length} prêtes, ${skipped} ignorées. Rien écrit.`
    : `\nBackfill: ${backfilled} · Nouveaux: ${enrolledN} · Re-mis en file: ${requeued} · Ignorés: ${skipped}`,
);
process.exit(0);
