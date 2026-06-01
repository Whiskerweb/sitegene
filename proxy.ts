import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { parseHost } from "@/lib/subdomain";

/**
 * Proxy (ex-middleware en Next 16) : (1) réécrit les sous-domaines client
 * `<slug>.akyra.io/<path>` → `/s/<slug>/<path>` ; (2) rafraîchit la session
 * Supabase en relayant les cookies. N'autorise pas (gardes dans pages/layouts).
 * Exclut assets, API et bundles de sites publics via le matcher.
 */
export async function proxy(request: NextRequest) {
  // 1) Sous-domaine client → route catch-all /s/<slug>
  const parsed = parseHost(request.headers.get("host"));
  if (parsed.kind === "site" && !request.nextUrl.pathname.startsWith("/s/")) {
    const url = request.nextUrl.clone();
    const p = url.pathname;
    url.pathname = `/s/${parsed.slug}${p === "/" ? "" : p}`;
    return NextResponse.rewrite(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Rafraîchit le token si nécessaire (ne pas exécuter de logique entre create et getUser).
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Pages uniquement. On EXCLUT api/ (les routes gèrent leur propre auth + le proxy
    // casse les corps multipart en flux), les assets _next, _templates, sites /s/, fichiers.
    "/((?!api/|_next/static|_next/image|favicon.ico|_templates|s/|robots.txt|.*\\.[\\w]+$).*)",
  ],
};
