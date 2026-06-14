import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { resolveHost, createSupabaseLookup } from "@/lib/host-resolver";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Proxy (ex-middleware en Next 16) : (1) réécrit les sous-domaines client
 * `<slug>.akyra.io/<path>` → `/s/<slug>/<path>` ; (2) rafraîchit la session
 * Supabase en relayant les cookies. N'autorise pas (gardes dans pages/layouts).
 * Exclut assets, API et bundles de sites publics via le matcher.
 */
export async function proxy(request: NextRequest) {
  // 1) Sous-domaine client OU domaine personnalisé → /a/<slug> (fonderie) ou /s/<slug> (statique).
  //    Garde : on ne re-réécrit jamais un chemin déjà routé (/a/ ou /s/) — évite la
  //    boucle /s/<slug>/a/<slug> qui cassait les sous-domaines fonderie.
  const path = request.nextUrl.pathname;
  // NB : `/s/` est déjà exclu par le matcher ci-dessous, mais PAS `/a/`. La garde
  // `/a/` est donc load-bearing : ne pas la retirer en pensant qu'elle est redondante.
  const alreadyRouted = path.startsWith("/a/") || path.startsWith("/s/");
  if (!alreadyRouted) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolved = await resolveHost(
      request.headers.get("host"),
      createSupabaseLookup(createPublicClient() as any),
    );
    if (resolved.kind === "site") {
      const url = request.nextUrl.clone();
      const base = resolved.render === "foundry" ? "a" : "s";
      url.pathname = `/${base}/${resolved.slug}${path === "/" ? "" : path}`;
      return NextResponse.rewrite(url);
    }
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
