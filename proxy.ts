import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Proxy (ex-middleware en Next 16) : rafraîchit la session Supabase à chaque
 * requête en relayant les cookies. Ne fait PAS d'autorisation (gardes dans les
 * pages/layouts). Exclut les assets et les bundles de sites publics.
 */
export async function proxy(request: NextRequest) {
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
    // Tout sauf : assets _next, favicon, bundles _templates, sites publics /s/, et fichiers à extension.
    "/((?!_next/static|_next/image|favicon.ico|_templates|s/|robots.txt|.*\\.[\\w]+$).*)",
  ],
};
