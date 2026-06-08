import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { userOwnsSite, generateOnboardingHeader, loadOnboardingHeaderDoc } from "@/lib/onboarding";

export const maxDuration = 90;

/**
 * Aperçu du STYLE : génère uniquement le header (nav + hero) et le stocke.
 * POST { siteId } → { ok, templateId } ; GET ?siteId= → le header HTML (aperçu iframe).
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const siteId = typeof body?.siteId === "string" ? body.siteId : "";
  if (!siteId) return NextResponse.json({ error: "Site manquant." }, { status: 400 });
  if (!(await userOwnsSite(user.id, siteId))) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const origin = new URL(request.url).origin;
  const res = await generateOnboardingHeader(origin, siteId);
  if (!res.ok) {
    return NextResponse.json({ error: `Aperçu indisponible (${res.reason}).` }, { status: 502 });
  }
  return NextResponse.json({ ok: true, templateId: res.templateId });
}

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return new Response("Non connecté.", { status: 401 });
  const url = new URL(request.url);
  const siteId = url.searchParams.get("siteId") ?? "";
  if (!siteId || !(await userOwnsSite(user.id, siteId))) {
    return new Response("Accès refusé.", { status: 403 });
  }
  const headerDoc = await loadOnboardingHeaderDoc(siteId);
  if (!headerDoc) return new Response("Aperçu indisponible.", { status: 404 });
  return new Response(headerDoc, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex",
      "cache-control": "no-store",
    },
  });
}
