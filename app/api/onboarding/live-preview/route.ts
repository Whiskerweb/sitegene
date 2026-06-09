import { getUser } from "@/lib/auth";
import { userOwnsSite } from "@/lib/onboarding";
import { loadLivePreviewHtml } from "@/lib/onboarding-sections";

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return new Response("Non connecté.", { status: 401 });
  const url = new URL(request.url);
  const siteId = url.searchParams.get("siteId") ?? "";
  if (!siteId || !(await userOwnsSite(user.id, siteId))) return new Response("Accès refusé.", { status: 403 });
  const html = await loadLivePreviewHtml(url.origin, siteId);
  if (!html) return new Response("Aperçu en préparation.", { status: 404 });
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex", "cache-control": "no-store" } });
}
