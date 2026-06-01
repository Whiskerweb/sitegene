import { NextRequest, NextResponse } from "next/server";
import { parseHost } from "@/lib/subdomain";

/**
 * Sous-domaine client : `<slug>.akyra.io/<path>` est réécrit en interne vers
 * `/s/<slug>/<path>` (la route catch-all rend le site). L'app (apex/www/réservé)
 * passe sans modification. Les assets et l'API sont exclus via le matcher.
 */
export function middleware(req: NextRequest) {
  const parsed = parseHost(req.headers.get("host"));
  if (parsed.kind !== "site") return NextResponse.next();

  const url = req.nextUrl.clone();
  // évite la double-réécriture si déjà sous /s/
  if (url.pathname.startsWith("/s/")) return NextResponse.next();
  url.pathname = `/s/${parsed.slug}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // exclut _next, assets, API, bundles de templates et fichiers à extension
  matcher: ["/((?!_next/|api/|_templates/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
