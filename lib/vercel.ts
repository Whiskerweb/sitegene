/**
 * Client minimal de l'API Vercel Domains : branche les domaines personnalisés
 * des clients sur le projet Vercel d'Akyra (SSL auto). Lit VERCEL_TOKEN /
 * VERCEL_PROJECT_ID / VERCEL_TEAM_ID. Dégradé propre si non configuré (dev).
 */
const API = "https://api.vercel.com";

export type DomainRecord = { type: "A" | "CNAME" | "TXT"; name: string; value: string };
export type DomainStatus = {
  domain: string;
  configured: boolean; // creds Vercel présentes
  verified: boolean; // propriété + DNS OK côté Vercel
  misconfigured: boolean; // DNS pas (encore) pointé
  records: DomainRecord[];
};

function cfg() {
  return {
    token: process.env.VERCEL_TOKEN,
    projectId: process.env.VERCEL_PROJECT_ID,
    teamId: process.env.VERCEL_TEAM_ID,
  };
}

export function vercelConfigured(): boolean {
  const { token, projectId } = cfg();
  return Boolean(token && projectId);
}

function teamQuery(prefix: "?" | "&" = "?"): string {
  const { teamId } = cfg();
  return teamId ? `${prefix}teamId=${teamId}` : "";
}

async function vfetch(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; body: any }> {
  const { token } = cfg();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

/** Apex = 2 labels (ex. entreprise-arelec.fr). Sinon sous-domaine (www.x.fr). */
function isApex(domain: string): boolean {
  return domain.split(".").length === 2;
}

/** Enregistrement recommandé selon apex/sous-domaine (cf. Vercel). */
function baseRecord(domain: string): DomainRecord {
  return isApex(domain)
    ? { type: "A", name: domain, value: "76.76.21.21" }
    : { type: "CNAME", name: domain, value: "cname.vercel-dns.com" };
}

/** Ajoute le domaine au projet Vercel. Idempotent (déjà dans ce projet → ok). */
export async function addDomain(name: string): Promise<{ ok: boolean; error?: string }> {
  if (!vercelConfigured()) return { ok: false, error: "Vercel non configuré côté serveur." };
  const { projectId } = cfg();
  const { ok, body } = await vfetch(`/v10/projects/${projectId}/domains${teamQuery()}`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  if (ok) return { ok: true };
  const code = body?.error?.code;
  if (code === "domain_already_exists") return { ok: true }; // déjà sur ce projet
  if (code === "domain_already_in_use")
    return { ok: false, error: "Ce domaine est déjà utilisé ailleurs (autre projet/compte Vercel)." };
  return { ok: false, error: body?.error?.message ?? "Échec de l'ajout du domaine côté Vercel." };
}

/** Retire le domaine du projet Vercel (changement / débranchement). Best-effort. */
export async function removeDomain(name: string): Promise<void> {
  if (!vercelConfigured()) return;
  const { projectId } = cfg();
  await vfetch(`/v9/projects/${projectId}/domains/${name}${teamQuery()}`, { method: "DELETE" });
}

/** État réel d'un domaine : vérifié ? mal configuré ? enregistrements à poser. */
export async function getDomainStatus(name: string): Promise<DomainStatus> {
  if (!vercelConfigured()) {
    return { domain: name, configured: false, verified: false, misconfigured: true, records: [baseRecord(name)] };
  }
  const { projectId } = cfg();
  const [info, config] = await Promise.all([
    vfetch(`/v9/projects/${projectId}/domains/${name}${teamQuery()}`),
    vfetch(`/v9/projects/${projectId}/domains/${name}/config${teamQuery()}`),
  ]);
  const verified = Boolean(info.body?.verified);
  const misconfigured = Boolean(config.body?.misconfigured);
  const records: DomainRecord[] = [baseRecord(name)];
  // Défis de propriété (TXT) si Vercel les réclame (domaine détenu ailleurs).
  for (const v of (info.body?.verification ?? []) as Array<{ type: string; domain: string; value: string }>) {
    if (v?.type && v?.domain && v?.value)
      records.push({ type: v.type.toUpperCase() as DomainRecord["type"], name: v.domain, value: v.value });
  }
  return { domain: name, configured: true, verified, misconfigured, records };
}
