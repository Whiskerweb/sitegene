// Enrôle la campagne de prospection À PARTIR DE L'EXCEL (source de vérité des
// emails + liens reveal). Pour chaque ligne (token + email valide) :
//   1. retrouve le prospect_code par token → prospect_id ;
//   2. recopie l'email dans prospects.email (backfill) ;
//   3. crée la ligne outreach (status queued) si pas déjà enrôlé.
// Non destructif : ne touche PAS aux statuts des codes (l'engagement réel est
// détecté ensuite via la table `events`). Ignore les clients (code 'paid') et
// les adresses suppressées.
//
//   npm run outreach:enroll:excel -- "/chemin/Feuille de calcul.xlsx"
//   npm run outreach:enroll:excel -- --dry "/chemin/Feuille de calcul.xlsx"
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { isSuppressed } from "../lib/email/suppress.ts";

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const XLSX_PATH =
  args.find((a) => a.toLowerCase().endsWith(".xlsx")) ||
  `${process.env.HOME}/Downloads/Feuille de calcul.xlsx`;

const log = (...a) => console.log(...a);

// 1. Extraction via le helper Python (openpyxl).
const ext = spawnSync("python3", ["scripts/extract-prospects-xlsx.py", XLSX_PATH], {
  encoding: "utf8",
});
if (ext.status !== 0) {
  console.error("Extraction Excel échouée:", ext.stderr || ext.error?.message);
  process.exit(1);
}
const rows = JSON.parse(ext.stdout).filter((r) => r.token && r.valid);
log(`Excel : ${rows.length} ligne(s) avec token + email valide (${XLSX_PATH}).`);

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: codes } = await admin
  .from("prospect_codes")
  .select("token, prospect_id, status");
const byToken = new Map((codes || []).map((c) => [c.token, c]));

const { data: existing } = await admin.from("outreach").select("prospect_id");
const enrolled = new Set((existing || []).map((r) => r.prospect_id));

let backfilled = 0;
let enrolledN = 0;
let skipped = 0;
const seen = new Set();
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
  if (seen.has(pid)) continue;
  if (seenEmail.has(emailKey)) {
    log(`skip ${r.email} — email déjà enrôlé (doublon)`);
    skipped += 1;
    continue;
  }
  seen.add(pid);
  seenEmail.add(emailKey);

  if (code.status === "paid") {
    log(`skip ${r.email} — déjà client (paid)`);
    skipped += 1;
    continue;
  }
  if (await isSuppressed(admin, r.email)) {
    log(`skip ${r.email} — suppressé`);
    skipped += 1;
    continue;
  }

  if (DRY) {
    log(`[dry] ${r.email} → /r/${r.token} (code ${code.status}${enrolled.has(pid) ? ", déjà enrôlé" : ""})`);
    continue;
  }

  // Backfill email (Excel = source de vérité).
  await admin.from("prospects").update({ email: r.email }).eq("id", pid);
  backfilled += 1;

  if (!enrolled.has(pid)) {
    const { error } = await admin
      .from("outreach")
      .insert({ prospect_id: pid, reveal_token: r.token });
    if (!error) {
      enrolledN += 1;
      log(`✓ enrôlé ${r.email}`);
    } else if (error.code !== "23505") {
      log(`✗ ${r.email} — ${error.message}`);
    }
  }
}

log(
  DRY
    ? `\n[dry] ${rows.length} candidat(s), ${skipped} ignoré(s). Rien écrit.`
    : `\nEmails backfillés : ${backfilled} · Enrôlés : ${enrolledN} · Ignorés : ${skipped}`,
);
process.exit(0);
