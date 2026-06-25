/**
 * lib/twenty/client.ts — Client REST fin pour l'API Twenty. SERVEUR UNIQUEMENT.
 *
 * On ne modifie JAMAIS Twenty : on parle à son API REST (`/rest`) + Metadata
 * (`/rest/metadata`). Auth : Bearer (clé générée dans Twenty → Settings → API).
 * Tout est centralisé ici : config, throttle (< 100 req/min), timeout, et la
 * classification d'erreurs que le worker exploite pour ses retries.
 *
 * NOTE ENVELOPPE : Twenty enveloppe ses réponses sous `data` (parfois
 * `data.createPerson`, `data.person`, `data.people`…). `pickRecord` /
 * `pickList` digèrent ces variantes ; si la version déployée diffère, c'est le
 * SEUL endroit à ajuster.
 */

export class TwentyConfigError extends Error {}
export class TwentyRetryableError extends Error {} // 429 / 5xx / réseau / timeout
export class TwentyPermanentError extends Error {} // 4xx (hors 429)
export class TwentyNotFoundError extends Error {} // 404 sur un update → recréer

const RAW_BASE = process.env.TWENTY_URL?.replace(/\/+$/, "") ?? "";
const KEY = process.env.TWENTY_API_KEY ?? "";

/** Twenty est-il configuré (URL + clé) ? Sinon on n'enfile rien. */
export function twentyConfigured(): boolean {
  return Boolean(RAW_BASE && KEY);
}

/** Kill-switch de poussée : configuré ET non désactivé explicitement. */
export function twentyEnabled(): boolean {
  const flag = process.env.TWENTY_SYNC_ENABLED;
  if (flag === "0" || flag === "false") return false;
  return twentyConfigured();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --- Throttle global (le worker est séquentiel) -----------------------------
const MIN_GAP_MS = 650; // ~92 req/min, sous la limite de 100/min
let lastCall = 0;
async function throttle() {
  const wait = lastCall + MIN_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();
}

const TIMEOUT_MS = 8000;

type ReqOpts = { metadata?: boolean };

async function request(
  method: string,
  path: string,
  body?: unknown,
  opts: ReqOpts = {},
): Promise<unknown> {
  if (!twentyConfigured()) throw new TwentyConfigError("TWENTY_URL / TWENTY_API_KEY manquant");
  await throttle();
  const url = `${RAW_BASE}/rest${opts.metadata ? "/metadata" : ""}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    throw new TwentyRetryableError(`réseau/timeout: ${e instanceof Error ? e.message : e}`);
  } finally {
    clearTimeout(timer);
  }

  if (res.ok) {
    if (res.status === 204) return null;
    return res.json().catch(() => null);
  }
  const text = await res.text().catch(() => "");
  if (res.status === 404) throw new TwentyNotFoundError(text || "404");
  if (res.status === 429 || res.status >= 500) {
    throw new TwentyRetryableError(`${res.status}: ${text}`);
  }
  throw new TwentyPermanentError(`${res.status}: ${text}`);
}

// --- Extraction tolérante des enveloppes Twenty -----------------------------
type Rec = { id?: string; [k: string]: unknown };

/** Récupère l'objet record d'une réponse (create/update/get d'un singleton). */
function pickRecord(resp: unknown): Rec | null {
  if (!resp || typeof resp !== "object") return null;
  const data = (resp as { data?: unknown }).data ?? resp;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.id === "string") return d as Rec;
    // data.createPerson / data.updatePerson / data.person / data.opportunity…
    for (const v of Object.values(d)) {
      if (v && typeof v === "object" && typeof (v as Rec).id === "string") return v as Rec;
    }
  }
  return null;
}

/** Récupère une liste de records (réponses de type collection). */
function pickList(resp: unknown): Rec[] {
  if (!resp || typeof resp !== "object") return [];
  const data = (resp as { data?: unknown }).data ?? resp;
  if (Array.isArray(data)) return data as Rec[];
  if (data && typeof data === "object") {
    for (const v of Object.values(data as Record<string, unknown>)) {
      if (Array.isArray(v)) return v as Rec[];
    }
  }
  return [];
}

// =============================================================================
// People
// =============================================================================
export async function createPerson(body: Record<string, unknown>): Promise<Rec> {
  const rec = pickRecord(await request("POST", "/people", body));
  if (!rec?.id) throw new TwentyPermanentError("createPerson: réponse sans id");
  return rec;
}

export async function updatePerson(id: string, body: Record<string, unknown>): Promise<Rec> {
  const rec = pickRecord(await request("PATCH", `/people/${id}`, body));
  return rec ?? { id };
}

export async function findPersonByAkyraId(prospectId: string): Promise<Rec | null> {
  const resp = await request(
    "GET",
    `/people?filter=akyraProspectId[eq]:${encodeURIComponent(prospectId)}&limit=1`,
  );
  return pickList(resp)[0] ?? null;
}

// =============================================================================
// Opportunities
// =============================================================================
export async function createOpportunity(body: Record<string, unknown>): Promise<Rec> {
  const rec = pickRecord(await request("POST", "/opportunities", body));
  if (!rec?.id) throw new TwentyPermanentError("createOpportunity: réponse sans id");
  return rec;
}

export async function updateOpportunity(id: string, body: Record<string, unknown>): Promise<Rec> {
  const rec = pickRecord(await request("PATCH", `/opportunities/${id}`, body));
  return rec ?? { id };
}

export async function getOpportunity(id: string): Promise<Rec | null> {
  return pickRecord(await request("GET", `/opportunities/${id}`));
}

// =============================================================================
// Notes (timeline) — créer la note puis la lier à la Person via noteTarget.
// =============================================================================
export async function createNote(title: string, body?: string): Promise<Rec> {
  const payload: Record<string, unknown> = { title };
  if (body) payload.bodyV2 = { markdown: body };
  const rec = pickRecord(await request("POST", "/notes", payload));
  if (!rec?.id) throw new TwentyPermanentError("createNote: réponse sans id");
  return rec;
}

export async function linkNoteToPerson(noteId: string, personId: string): Promise<void> {
  await request("POST", "/noteTargets", { noteId, personId });
}

// =============================================================================
// Metadata API (setup de schéma) — bas niveau, exposé pour le script de setup.
// =============================================================================
export async function metadataGet(path: string): Promise<unknown> {
  return request("GET", path, undefined, { metadata: true });
}
export async function metadataPost(path: string, body: unknown): Promise<unknown> {
  return request("POST", path, body, { metadata: true });
}

export { pickRecord, pickList };
export type { Rec };
