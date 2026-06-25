// Worker de synchro Twenty (drain de twenty_outbox) — utile en local/dev ou en
// fallback hors-Vercel. En PROD, c'est le cron Vercel /api/cron/twenty-sync qui
// fait foi (Vercel = serverless, pas de process long).
//
//   npm run twenty:worker        → boucle (poll toutes les 20 s)
//   npm run twenty:worker:once   → draine la file due puis s'arrête
import { createClient } from "@supabase/supabase-js";
import { drainOutbox, reconcileStaleContacts } from "../lib/twenty/sync.ts";
import { twentyEnabled } from "../lib/twenty/client.ts";

const ONCE = process.argv.includes("--once");
const POLL_MS = 20000;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!twentyEnabled()) {
  log("Twenty désactivé (TWENTY_URL/TWENTY_API_KEY manquant ou TWENTY_SYNC_ENABLED=0).");
  process.exit(0);
}

async function tick() {
  const reconciled = await reconcileStaleContacts(admin, { limit: 100 });
  const res = await drainOutbox(admin, { limit: 80 });
  log(`réconciliés=${reconciled} traités=${res.processed} ok=${res.done} échecs=${res.failed}`);
}

log(`Twenty sync worker démarré (${ONCE ? "once" : "boucle"}).`);
if (ONCE) {
  await tick();
  process.exit(0);
} else {
  while (true) {
    try {
      await tick();
    } catch (e) {
      log("Erreur boucle:", e?.message ?? e);
    }
    await sleep(POLL_MS);
  }
}
