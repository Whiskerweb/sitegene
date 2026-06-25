// Backfill Akyra → Twenty : crée/maj la Person + Opportunity de chaque prospect.
// Résumable (saute les prospects ayant déjà un twenty_person_id), throttlé par
// le client Twenty (< 100 req/min). À lancer après twenty:setup.
//
//   DRY_RUN=1 npm run twenty:backfill    → log ce qui serait synchronisé
//   npm run twenty:backfill              → synchronise réellement
//   RESYNC_ALL=1 npm run twenty:backfill → re-synchronise même les déjà liés
//
// Remplissage PROGRESSIF (filtres cumulables) :
//   ONLY_STATUS=GAGNE          → seulement ce pipeline_status (ex. les clients)
//   ONLY_STAGE=REVEAL_VU       → seulement ce pipeline_stage
//   ONLY_CATEGORY=photographe  → seulement cette catégorie
//   EXCLUDE_TEST=1             → ignore les lignes test/exemple/demo (email/prénom)
//   LIMIT=10                   → s'arrête après N prospects synchronisés
import { createClient } from "@supabase/supabase-js";
import { syncProspect } from "../lib/twenty/sync.ts";
import { twentyEnabled } from "../lib/twenty/client.ts";

const DRY = process.env.DRY_RUN === "1";
const RESYNC_ALL = process.env.RESYNC_ALL === "1";
const EXCLUDE_TEST = process.env.EXCLUDE_TEST === "1";
const ONLY_STATUS = process.env.ONLY_STATUS || null;
const ONLY_STAGE = process.env.ONLY_STAGE || null;
const ONLY_CATEGORY = process.env.ONLY_CATEGORY || null;
const LIMIT = process.env.LIMIT ? Number.parseInt(process.env.LIMIT, 10) : null;
const PAGE = 200;
const TEST_RE = /test|exemple|demo|fake/i;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

if (!twentyEnabled() && !DRY) {
  log("Twenty désactivé — abandon (configure TWENTY_URL/TWENTY_API_KEY).");
  process.exit(1);
}

const filtersLabel =
  [
    ONLY_STATUS && `status=${ONLY_STATUS}`,
    ONLY_STAGE && `stage=${ONLY_STAGE}`,
    ONLY_CATEGORY && `category=${ONLY_CATEGORY}`,
    EXCLUDE_TEST && "exclude-test",
    LIMIT && `limit=${LIMIT}`,
  ]
    .filter(Boolean)
    .join(", ") || "aucun filtre";

async function run() {
  log(`Backfill (${filtersLabel})${DRY ? " [DRY_RUN]" : ""}.`);
  let from = 0;
  let total = 0;
  let synced = 0;
  // Pagination par offset sur l'ensemble filtré ; on saute en mémoire les lignes
  // déjà liées (résumable) et les lignes test. Pas de boucle infinie possible.
  for (;;) {
    let q = admin
      .from("prospects")
      .select("id, first_name, email, pipeline_status, pipeline_stage, twenty_person_id")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (ONLY_STATUS) q = q.eq("pipeline_status", ONLY_STATUS);
    if (ONLY_STAGE) q = q.eq("pipeline_stage", ONLY_STAGE);
    if (ONLY_CATEGORY) q = q.eq("category", ONLY_CATEGORY);
    const { data: rows, error } = await q;
    if (error) {
      log("Erreur lecture prospects:", error.message);
      process.exit(1);
    }
    if (!rows?.length) break;
    from += PAGE;
    for (const p of rows) {
      if (!RESYNC_ALL && p.twenty_person_id) continue; // déjà synchronisé
      if (EXCLUDE_TEST && TEST_RE.test(`${p.email ?? ""}${p.first_name ?? ""}`)) continue;
      total++;
      if (DRY) {
        log(`[dry] ${p.first_name ?? p.email ?? p.id} (${p.pipeline_status})`);
      } else {
        try {
          await syncProspect(admin, p.id);
          synced++;
          if (synced % 20 === 0) log(`… ${synced} synchronisés`);
        } catch (e) {
          log(`✗ ${p.id}: ${e?.message ?? e}`);
        }
      }
      if (LIMIT && (DRY ? total : synced) >= LIMIT) {
        log(`Limite ${LIMIT} atteinte — ${total} parcouru(s), ${synced} synchronisé(s).`);
        return;
      }
    }
  }
  log(`Terminé — ${total} parcouru(s), ${synced} synchronisé(s).`);
}

await run();
process.exit(0);
