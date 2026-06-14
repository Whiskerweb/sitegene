# Domaines clients (sous-domaine + domaine perso Pro) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre joignables les sites clients sur leur sous-domaine `<slug>.akyra.io` (fonderie incluse) **et** brancher réellement un domaine personnalisé (apex) via l'API Vercel, réservé aux abonnés Pro, avec un statut DNS honnête.

**Architecture :** Un résolveur `host → {slug, render}` (logique pure + source de lookup injectable) corrige la réécriture du proxy (`/a/` pour la fonderie, `/s/` pour les templates statiques, garde anti-double-réécriture). Un client `lib/vercel.ts` ajoute/retire/interroge les domaines sur le projet Vercel. L'API `custom-domain` enrichit le POST (gate Pro conservé) et expose un endpoint de statut que l'UI interroge en polling pour afficher les vrais enregistrements DNS et un badge réel.

**Tech Stack :** Next.js 16 (proxy.ts ex-middleware), TypeScript, Supabase, API REST Vercel Domains, Vitest.

**Référence design :** `docs/superpowers/specs/2026-06-14-domaines-clients-pro-design.md`

---

## File Structure

- `lib/vercel.ts` — **NOUVEAU** : client API Vercel Domains (add/remove/status), lit `VERCEL_TOKEN`/`VERCEL_PROJECT_ID`/`VERCEL_TEAM_ID`. Dégradé propre si non configuré.
- `lib/vercel.test.ts` — **NOUVEAU** : tests (fetch mocké).
- `lib/host-resolver.ts` — **NOUVEAU** : `resolveHost(host, source)` + `createSupabaseLookup(supabase)`. Pur + source injectable.
- `lib/host-resolver.test.ts` — **NOUVEAU** : tests (source fake).
- `proxy.ts` — **MODIFIÉ** : remplace la réécriture aveugle `/s/` par `resolveHost` ; garde `/a/` et `/s/`.
- `app/api/site/custom-domain/route.ts` — **MODIFIÉ** : POST enrichi (add/remove Vercel + statut initial).
- `app/api/site/custom-domain/status/route.ts` — **NOUVEAU** : GET statut pour le polling UI.
- `components/settings/CustomDomainCard.tsx` — **MODIFIÉ** : records DNS réels + badge réel + polling. Mur Pro inchangé.

---

## Task 1 : `lib/vercel.ts` — client API Vercel Domains

**Files:**
- Create: `lib/vercel.ts`
- Test: `lib/vercel.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue**

Create `lib/vercel.test.ts` :

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { addDomain, getDomainStatus, vercelConfigured } from "./vercel";

const ENV = { VERCEL_TOKEN: "tok", VERCEL_PROJECT_ID: "prj", VERCEL_TEAM_ID: "team" };

beforeEach(() => {
  for (const [k, v] of Object.entries(ENV)) process.env[k] = v;
});
afterEach(() => {
  vi.restoreAllMocks();
  for (const k of Object.keys(ENV)) delete process.env[k];
});

function mockFetch(map: Record<string, { status: number; body: unknown }>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const key = Object.keys(map).find((k) => url.includes(k));
      const r = key ? map[key] : { status: 404, body: { error: { code: "not_found" } } };
      return { ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => r.body } as Response;
    }),
  );
}

describe("vercelConfigured", () => {
  it("true si token + project présents", () => {
    expect(vercelConfigured()).toBe(true);
  });
  it("false si token manquant", () => {
    delete process.env.VERCEL_TOKEN;
    expect(vercelConfigured()).toBe(false);
  });
});

describe("addDomain", () => {
  it("succès → ok", async () => {
    mockFetch({ "/domains": { status: 200, body: { name: "x.fr" } } });
    expect(await addDomain("x.fr")).toEqual({ ok: true });
  });
  it("déjà dans ce projet (domain_already_exists) → ok", async () => {
    mockFetch({ "/domains": { status: 409, body: { error: { code: "domain_already_exists" } } } });
    expect(await addDomain("x.fr")).toEqual({ ok: true });
  });
  it("utilisé ailleurs (domain_already_in_use) → erreur FR", async () => {
    mockFetch({ "/domains": { status: 409, body: { error: { code: "domain_already_in_use" } } } });
    const r = await addDomain("x.fr");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/ailleurs/i);
  });
});

describe("getDomainStatus", () => {
  it("apex non pointé → records A 76.76.21.21, verified false, misconfigured true", async () => {
    mockFetch({
      "/config": { status: 200, body: { misconfigured: true } },
      "/domains/x.fr": { status: 200, body: { verified: false, verification: [] } },
    });
    const s = await getDomainStatus("x.fr");
    expect(s.verified).toBe(false);
    expect(s.misconfigured).toBe(true);
    expect(s.records).toContainEqual({ type: "A", name: "x.fr", value: "76.76.21.21" });
  });
  it("sous-domaine → record CNAME cname.vercel-dns.com", async () => {
    mockFetch({
      "/config": { status: 200, body: { misconfigured: false } },
      "/domains/www.x.fr": { status: 200, body: { verified: true, verification: [] } },
    });
    const s = await getDomainStatus("www.x.fr");
    expect(s.verified).toBe(true);
    expect(s.records).toContainEqual({ type: "CNAME", name: "www.x.fr", value: "cname.vercel-dns.com" });
  });
  it("non configuré (pas de token) → configured false, pas de crash", async () => {
    delete process.env.VERCEL_TOKEN;
    const s = await getDomainStatus("x.fr");
    expect(s.configured).toBe(false);
    expect(s.verified).toBe(false);
  });
});
```

- [ ] **Step 2 : Lancer le test (échec attendu)**

Run: `npx vitest run lib/vercel.test.ts`
Expected: FAIL — `Cannot find module './vercel'`.

- [ ] **Step 3 : Écrire l'implémentation**

Create `lib/vercel.ts` :

```ts
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
```

- [ ] **Step 4 : Lancer le test (succès attendu)**

Run: `npx vitest run lib/vercel.test.ts`
Expected: PASS (tous les cas).

- [ ] **Step 5 : Commit**

```bash
git add lib/vercel.ts lib/vercel.test.ts
git commit -m "feat(domaines): client API Vercel Domains (add/remove/status)"
```

---

## Task 2 : `lib/host-resolver.ts` — résolveur host → site

**Files:**
- Create: `lib/host-resolver.ts`
- Test: `lib/host-resolver.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue**

Create `lib/host-resolver.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { resolveHost, type SiteLookupSource, type SiteLookup } from "./host-resolver";

/** Source fake : map slug→lookup et customDomain→lookup. */
function source(bySlug: Record<string, SiteLookup>, byDomain: Record<string, SiteLookup>): SiteLookupSource {
  return {
    async bySlug(slug) {
      return bySlug[slug] ?? null;
    },
    async byCustomDomain(domain) {
      return byDomain[domain] ?? null;
    },
  };
}

const FOUNDRY: SiteLookup = { slug: "arelec", render: "foundry" };
const STATIC: SiteLookup = { slug: "alice-r", render: "static" };

describe("resolveHost", () => {
  it("sous-domaine fonderie → site render foundry", async () => {
    const s = source({ arelec: FOUNDRY }, {});
    expect(await resolveHost("arelec.akyra.io", s)).toEqual({ kind: "site", slug: "arelec", render: "foundry" });
  });
  it("sous-domaine template statique → site render static", async () => {
    const s = source({ "alice-r": STATIC }, {});
    expect(await resolveHost("alice-r.akyra.io", s)).toEqual({ kind: "site", slug: "alice-r", render: "static" });
  });
  it("sous-domaine inconnu en base → app", async () => {
    const s = source({}, {});
    expect(await resolveHost("inexistant.akyra.io", s)).toEqual({ kind: "app" });
  });
  it("apex akyra.io → app SANS lookup", async () => {
    let touched = false;
    const s: SiteLookupSource = {
      async bySlug() {
        touched = true;
        return null;
      },
      async byCustomDomain() {
        touched = true;
        return null;
      },
    };
    expect(await resolveHost("akyra.io", s)).toEqual({ kind: "app" });
    expect(touched).toBe(false);
  });
  it("preview vercel.app → app SANS lookup custom", async () => {
    let touchedDomain = false;
    const s: SiteLookupSource = {
      async bySlug() {
        return null;
      },
      async byCustomDomain() {
        touchedDomain = true;
        return null;
      },
    };
    expect(await resolveHost("akyra-test.vercel.app", s)).toEqual({ kind: "app" });
    expect(touchedDomain).toBe(false);
  });
  it("domaine personnalisé trouvé → site (render correct)", async () => {
    const s = source({}, { "entreprise-arelec.fr": FOUNDRY });
    expect(await resolveHost("entreprise-arelec.fr", s)).toEqual({ kind: "site", slug: "arelec", render: "foundry" });
  });
  it("domaine personnalisé inconnu → app", async () => {
    const s = source({}, {});
    expect(await resolveHost("pas-branche.fr", s)).toEqual({ kind: "app" });
  });
  it("lookup qui jette → app (jamais de 500)", async () => {
    const s: SiteLookupSource = {
      async bySlug() {
        throw new Error("réseau");
      },
      async byCustomDomain() {
        throw new Error("réseau");
      },
    };
    expect(await resolveHost("arelec.akyra.io", s)).toEqual({ kind: "app" });
  });
});
```

- [ ] **Step 2 : Lancer le test (échec attendu)**

Run: `npx vitest run lib/host-resolver.test.ts`
Expected: FAIL — `Cannot find module './host-resolver'`.

- [ ] **Step 3 : Écrire l'implémentation**

Create `lib/host-resolver.ts` :

```ts
import { parseHost } from "./subdomain";

/** Doit rester aligné avec FOUNDRY_TEMPLATE_ID de lib/foundry/server.ts.
 *  Inliné ici pour garder ce module léger/edge-safe (proxy.ts). */
const FOUNDRY_TEMPLATE_ID = "foundry";

/** Hôtes de la plateforme : jamais traités comme domaine personnalisé. */
const PLATFORM_HOST_SUFFIXES = ["akyra.io", "localhost", "vercel.app"];

export type SiteLookup = { slug: string; render: "foundry" | "static" };

export interface SiteLookupSource {
  bySlug(slug: string): Promise<SiteLookup | null>;
  byCustomDomain(domain: string): Promise<SiteLookup | null>;
}

export type ResolvedHost =
  | { kind: "app" }
  | { kind: "site"; slug: string; render: "foundry" | "static" };

function isPlatformHost(hostname: string): boolean {
  return PLATFORM_HOST_SUFFIXES.some((s) => hostname === s || hostname.endsWith(`.${s}`));
}

/**
 * Résout un Host vers l'app ou un site client (sous-domaine OU domaine perso).
 * - `<slug>.akyra.io` → lookup par slug.
 * - hôte inconnu (non-plateforme) → lookup par custom_domain.
 * - apex/www/réservé/preview → app, sans aucune requête.
 * Toute erreur de lookup retombe sur `app` (jamais de 500 pour un visiteur).
 */
export async function resolveHost(
  host: string | null | undefined,
  source: SiteLookupSource,
): Promise<ResolvedHost> {
  const hostname = (host ?? "").split(":")[0].toLowerCase();
  if (!hostname) return { kind: "app" };

  try {
    const parsed = parseHost(host);
    if (parsed.kind === "site") {
      const row = await source.bySlug(parsed.slug);
      return row ? { kind: "site", slug: row.slug, render: row.render } : { kind: "app" };
    }
    // parsed = app : soit plateforme (apex/www/réservé/preview), soit domaine perso.
    if (isPlatformHost(hostname)) return { kind: "app" };
    const row = await source.byCustomDomain(hostname);
    return row ? { kind: "site", slug: row.slug, render: row.render } : { kind: "app" };
  } catch {
    return { kind: "app" };
  }
}

/** Forme minimale du client Supabase utilisée pour le lookup. */
interface SupabaseLike {
  from(table: string): {
    select(cols: string): {
      eq(col: string, val: string): {
        eq(col: string, val: string): {
          maybeSingle(): Promise<{ data: { slug: string; template_id: string | null } | null }>;
        };
      };
    };
  };
}

/** Source de lookup adossée à Supabase (sites `live`, lisibles via RLS publique). */
export function createSupabaseLookup(supabase: SupabaseLike): SiteLookupSource {
  const toLookup = (data: { slug: string; template_id: string | null } | null): SiteLookup | null =>
    data ? { slug: data.slug, render: data.template_id === FOUNDRY_TEMPLATE_ID ? "foundry" : "static" } : null;
  return {
    async bySlug(slug) {
      const { data } = await supabase
        .from("sites")
        .select("slug, template_id")
        .eq("slug", slug)
        .eq("status", "live")
        .maybeSingle();
      return toLookup(data);
    },
    async byCustomDomain(domain) {
      const { data } = await supabase
        .from("sites")
        .select("slug, template_id")
        .eq("custom_domain", domain)
        .eq("status", "live")
        .maybeSingle();
      return toLookup(data);
    },
  };
}
```

- [ ] **Step 4 : Lancer le test (succès attendu)**

Run: `npx vitest run lib/host-resolver.test.ts`
Expected: PASS (tous les cas).

- [ ] **Step 5 : Commit**

```bash
git add lib/host-resolver.ts lib/host-resolver.test.ts
git commit -m "feat(domaines): resolveHost (host -> app|site+render) + lookup Supabase"
```

---

## Task 3 : `proxy.ts` — réécriture corrigée (/a/ vs /s/, garde double-réécriture)

**Files:**
- Modify: `proxy.ts`

- [ ] **Step 1 : Remplacer le bloc de réécriture sous-domaine**

Remplacer l'import et le bloc `// 1) Sous-domaine client …` actuels.

Ancien (à retirer) — `proxy.ts:3` et `proxy.ts:11-19` :

```ts
import { parseHost } from "@/lib/subdomain";
```
```ts
export async function proxy(request: NextRequest) {
  // 1) Sous-domaine client → route catch-all /s/<slug>
  const parsed = parseHost(request.headers.get("host"));
  if (parsed.kind === "site" && !request.nextUrl.pathname.startsWith("/s/")) {
    const url = request.nextUrl.clone();
    const p = url.pathname;
    url.pathname = `/s/${parsed.slug}${p === "/" ? "" : p}`;
    return NextResponse.rewrite(url);
  }
```

Nouveau :

```ts
import { resolveHost, createSupabaseLookup } from "@/lib/host-resolver";
import { createPublicClient } from "@/lib/supabase/public";
```
```ts
export async function proxy(request: NextRequest) {
  // 1) Sous-domaine client OU domaine personnalisé → /a/<slug> (fonderie) ou /s/<slug> (statique).
  //    Garde : on ne re-réécrit jamais un chemin déjà routé (/a/ ou /s/) — évite la
  //    boucle /s/<slug>/a/<slug> qui cassait les sous-domaines fonderie.
  const path = request.nextUrl.pathname;
  const alreadyRouted = path.startsWith("/a/") || path.startsWith("/s/");
  if (!alreadyRouted) {
    const resolved = await resolveHost(
      request.headers.get("host"),
      createSupabaseLookup(createPublicClient()),
    );
    if (resolved.kind === "site") {
      const url = request.nextUrl.clone();
      const base = resolved.render === "foundry" ? "a" : "s";
      url.pathname = `/${base}/${resolved.slug}${path === "/" ? "" : path}`;
      return NextResponse.rewrite(url);
    }
  }
```

> Le reste de `proxy()` (refresh session Supabase) et le `export const config` restent inchangés.

- [ ] **Step 2 : Vérifier le typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur sur `proxy.ts` / `lib/host-resolver.ts`.

- [ ] **Step 3 : Vérifier que la suite ne casse pas**

Run: `npx vitest run lib/`
Expected: PASS (subdomain, host-resolver, vercel).

- [ ] **Step 4 : Commit**

```bash
git add proxy.ts
git commit -m "fix(domaines): proxy route fonderie (/a/) vs statique (/s/) + garde anti-boucle"
```

---

## Task 4 : POST `/api/site/custom-domain` — branchement Vercel réel

**Files:**
- Modify: `app/api/site/custom-domain/route.ts`

- [ ] **Step 1 : Ajouter les imports Vercel**

En tête de fichier, après `import { hasActiveSubscription } from "@/lib/subscription";` :

```ts
import { addDomain, removeDomain, getDomainStatus } from "@/lib/vercel";
```

- [ ] **Step 2 : Récupérer l'ancien domaine + brancher/débrancher sur Vercel**

Remplacer le bloc final (de `const site = await primarySiteForUser…` jusqu'au `return NextResponse.json({ ok: true, custom_domain: domain || null });`) par :

```ts
  const site = await primarySiteForUser<{ id: string; custom_domain: string | null }>(
    admin,
    user.id,
    "id, custom_domain",
  );
  if (!site) {
    return NextResponse.json({ error: "Aucun site." }, { status: 404 });
  }

  const previous = site.custom_domain;

  // 1) Branchement Vercel AVANT l'écriture en base : si Vercel refuse durement,
  //    on n'enregistre pas un domaine qui ne marchera jamais.
  if (domain && domain !== previous) {
    const added = await addDomain(domain);
    if (!added.ok) {
      return NextResponse.json({ error: added.error ?? "Échec côté Vercel." }, { status: 502 });
    }
  }

  // 2) Écriture en base.
  const { error } = await admin
    .from("sites")
    .update({ custom_domain: domain || null })
    .eq("id", site.id);
  if (error) {
    return NextResponse.json({ error: "Échec de l'enregistrement." }, { status: 500 });
  }

  // 3) Nettoyage : retire l'ancien domaine du projet Vercel s'il a changé (best-effort).
  if (previous && previous !== domain) {
    await removeDomain(previous);
  }

  // 4) Statut initial (records DNS à poser) pour affichage immédiat.
  const status = domain ? await getDomainStatus(domain) : null;
  return NextResponse.json({ ok: true, custom_domain: domain || null, status });
```

- [ ] **Step 3 : Vérifier le typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur sur `app/api/site/custom-domain/route.ts`.

- [ ] **Step 4 : Commit**

```bash
git add app/api/site/custom-domain/route.ts
git commit -m "feat(domaines): POST custom-domain branche le domaine sur Vercel (gate Pro conservé)"
```

---

## Task 5 : GET `/api/site/custom-domain/status` — statut pour le polling

**Files:**
- Create: `app/api/site/custom-domain/status/route.ts`

- [ ] **Step 1 : Écrire la route**

Create `app/api/site/custom-domain/status/route.ts` :

```ts
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { primarySiteForUser } from "@/lib/primary-site";
import { hasActiveSubscription } from "@/lib/subscription";
import { getDomainStatus } from "@/lib/vercel";

/**
 * Statut réel du domaine personnalisé du site principal (interrogé en polling
 * par la carte Réglages). Gate Pro identique au POST.
 */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const admin = createAdminClient();
  if (!(await hasActiveSubscription(admin, user.id))) {
    return NextResponse.json({ error: "Réservé aux abonnés.", upgrade: true }, { status: 403 });
  }

  const site = await primarySiteForUser<{ custom_domain: string | null }>(
    admin,
    user.id,
    "custom_domain",
  );
  const domain = site?.custom_domain ?? null;
  if (!domain) return NextResponse.json({ connected: false });

  const status = await getDomainStatus(domain);
  return NextResponse.json({ connected: true, status });
}
```

- [ ] **Step 2 : Vérifier le typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add app/api/site/custom-domain/status/route.ts
git commit -m "feat(domaines): endpoint statut domaine perso (polling UI)"
```

---

## Task 6 : `CustomDomainCard.tsx` — records DNS réels + badge honnête + polling

**Files:**
- Modify: `components/settings/CustomDomainCard.tsx`

- [ ] **Step 1 : Vider l'état du parent (hooks uniquement dans le sous-composant)**

> **Pourquoi un sous-composant ?** Le parent fait un `return` anticipé pour les non-abonnés (`if (!isSubscribed) return …`). On ne peut pas déclarer de hooks (`useEffect`/`useCallback`) APRÈS un return conditionnel (règles des hooks). Tout l'état part donc dans `CustomDomainBody`, rendu uniquement pour les abonnés. Le parent ne porte plus AUCUN `useState`.

Remplacer le bloc des quatre `useState` du parent (lignes 21-24) :

```tsx
  const [domain, setDomain] = useState(currentDomain ?? "");
  const [saved, setSaved] = useState<string | null>(currentDomain);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
```

par (rien — on les supprime) :

```tsx
  // (plus d'état ici : le parent ne fait que router abonné/non-abonné)
```

- [ ] **Step 2 : Remplacer le corps abonné par un rendu de `<CustomDomainBody>`**

Le bloc `if (!isSubscribed) { … }` (lignes 27-48) reste **inchangé**.

Remplacer tout le reste — à partir de `const save = async () => {` (ligne 50) jusqu'à la fin du fichier — par :

```tsx
  return <CustomDomainBody currentDomain={currentDomain} />;
}

function CustomDomainBody({ currentDomain }: { currentDomain: string | null }) {
  const [domain, setDomain] = useState(currentDomain ?? "");
  const [saved, setSaved] = useState<string | null>(currentDomain);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    configured: boolean;
    verified: boolean;
    misconfigured: boolean;
    records: { type: string; name: string; value: string }[];
  } | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/site/custom-domain/status");
      const data = (await res.json().catch(() => null)) as
        | { connected?: boolean; status?: typeof status }
        | null;
      if (data?.connected && data.status) setStatus(data.status);
      else setStatus(null);
    } catch {
      /* silencieux : le polling réessaiera */
    }
  }, []);

  // Polling : au montage si un domaine est branché, puis toutes les 5 s tant que non vérifié.
  useEffect(() => {
    if (!saved) {
      setStatus(null);
      return;
    }
    fetchStatus();
    const id = setInterval(() => {
      setStatus((s) => {
        if (s?.verified) return s; // stop quand vérifié
        fetchStatus();
        return s;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [saved, fetchStatus]);

  const save = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/site/custom-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; custom_domain?: string | null; status?: typeof status; error?: string }
        | null;
      if (res.ok && data?.ok) {
        setSaved(data.custom_domain ?? null);
        setStatus(data.status ?? null);
      } else {
        setError(data?.error ?? "Une erreur est survenue.");
      }
    } catch {
      setError("Connexion impossible. Réessayez.");
    }
    setLoading(false);
  };

  const verified = status?.verified ?? false;
  const pending = Boolean(saved) && !verified;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-archivo text-base font-semibold text-night">Domaine personnalisé</h2>
        {verified ? (
          <Badge tone="success">
            <IconCheck size={13} /> Branché
          </Badge>
        ) : pending ? (
          <Badge tone="warn">En attente DNS…</Badge>
        ) : (
          <Badge tone="brand">Pro</Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-slate">
        Branchez votre propre nom de domaine, puis posez les enregistrements DNS ci-dessous chez
        votre registrar. La propagation peut prendre quelques heures.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="votre-studio.com"
          className="w-full rounded-xl border border-sky-300 bg-surface-2 px-4 py-2.5 text-sm text-night outline-none focus:border-brand"
        />
        <Button onClick={save} loading={loading} size="sm" className="shrink-0">
          {saved ? "Mettre à jour" : "Brancher"}
        </Button>
      </div>

      {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}

      {status?.configured === false && (
        <p className="mt-2 text-xs font-medium text-danger">
          Connexion Vercel indisponible côté serveur. Le domaine est enregistré mais pas encore
          actif — vérifiez la configuration.
        </p>
      )}

      {saved && status && status.records.length > 0 && (
        <div className="mt-4 rounded-xl border border-sky-300 bg-surface-2 p-3">
          <p className="mb-2 text-[13px] font-medium text-night">
            Enregistrements DNS à créer chez votre registrar :
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-mist">
                <tr>
                  <th className="pb-1 pr-4 font-medium">Type</th>
                  <th className="pb-1 pr-4 font-medium">Nom</th>
                  <th className="pb-1 font-medium">Valeur</th>
                </tr>
              </thead>
              <tbody className="font-mono text-night">
                {status.records.map((r, i) => (
                  <tr key={i}>
                    <td className="py-0.5 pr-4">{r.type}</td>
                    <td className="py-0.5 pr-4">{r.name}</td>
                    <td className="py-0.5">{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {verified ? (
            <p className="mt-2 text-[13px] text-night">
              Domaine vérifié et actif sur <code className="font-semibold">{saved}</code>.
            </p>
          ) : (
            <p className="mt-2 text-[13px] text-mist">
              En attente de propagation DNS. Cette carte se met à jour automatiquement.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
```

- [ ] **Step 3 : Mettre à jour les imports React en tête de fichier**

Remplacer `import { useState } from "react";` par :

```tsx
import { useState, useEffect, useCallback } from "react";
```

- [ ] **Step 4 : Vérifier le typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur sur `components/settings/CustomDomainCard.tsx`.

- [ ] **Step 5 : Vérifier le build/lint**

Run: `npm run lint`
Expected: aucune erreur (warnings tolérés selon config existante).

- [ ] **Step 6 : Commit**

```bash
git add components/settings/CustomDomainCard.tsx
git commit -m "feat(domaines): carte domaine perso — records DNS réels + badge honnête + polling"
```

---

## Task 7 : Vérification manuelle de bout en bout

**Files:** aucun (test manuel).

- [ ] **Step 1 : Sous-domaine fonderie**

Lancer `npm run dev`. Ouvrir `http://arelec.localhost:3000` (remplacer `arelec` par un slug fonderie `live` réel).
Expected : le site s'affiche (rendu `/a/`), plus de 404. Confirmer dans l'onglet réseau que l'URL reste `arelec.localhost:3000` (réécriture, pas redirection en boucle).

- [ ] **Step 2 : Sous-domaine template statique**

Ouvrir `http://<slug-static>.localhost:3000` (slug d'un site `live` non-fonderie).
Expected : le site statique s'affiche (rendu `/s/`).

- [ ] **Step 3 : Domaine perso — branchement (compte Pro)**

Dans `/dashboard/settings` avec un compte abonné, brancher `entreprise-arelec.fr`.
Expected : pas d'erreur ; le tableau DNS affiche `A / entreprise-arelec.fr / 76.76.21.21` ; badge « En attente DNS… ». Vérifier sur Vercel (dashboard ou `curl`) que le domaine est bien ajouté au projet.

- [ ] **Step 4 : Domaine perso — non-abonné**

Avec un compte non abonné, ouvrir `/dashboard/settings`.
Expected : mur d'upgrade « Pro » + bouton « Passer à l'abonnement » (inchangé), aucun champ de saisie.

- [ ] **Step 5 : Note opérationnelle (hors code)**

Confirmer que `VERCEL_TOKEN` / `VERCEL_PROJECT_ID` / `VERCEL_TEAM_ID` sont présents dans les variables d'environnement du **projet Vercel en prod** (pas seulement `.env.local`), sinon le branchement échouera en ligne avec « Connexion Vercel indisponible ».

---

## Notes de revue

- **Couverture spec :** Bug 1 (Tasks 2-3), Bug 2 branchement (Tasks 1, 4), statut réel (Tasks 1, 5, 6), UI honnête + records (Task 6), gate Pro conservé (Tasks 4-6, mur inchangé), apex-only (`isApex` Task 1). Vérif manuelle (Task 7).
- **Hors périmètre (rappel) :** www/redirections apex↔www, multi-domaines, cache du lookup proxy.
- **Edge-safety :** `lib/host-resolver.ts` n'importe que `./subdomain` (pur) et inline la constante `"foundry"` — pas d'import serveur lourd dans le proxy.
