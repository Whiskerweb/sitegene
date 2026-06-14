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
