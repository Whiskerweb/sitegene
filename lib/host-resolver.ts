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
          maybeSingle(): Promise<{
            data: { slug: string; template_id: string | null } | null;
            error?: { message: string } | null;
          }>;
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
      const { data, error } = await supabase
        .from("sites")
        .select("slug, template_id")
        .eq("slug", slug)
        .eq("status", "live")
        .maybeSingle();
      // Une erreur Supabase (RLS, table absente…) ne doit pas crasher un visiteur,
      // mais un fallback silencieux vers l'app serait indébogable : on la trace.
      if (error) console.error(`[host-resolver] lookup slug "${slug}":`, error.message);
      return toLookup(data);
    },
    async byCustomDomain(domain) {
      const { data, error } = await supabase
        .from("sites")
        .select("slug, template_id")
        .eq("custom_domain", domain)
        .eq("status", "live")
        .maybeSingle();
      if (error) console.error(`[host-resolver] lookup domaine "${domain}":`, error.message);
      return toLookup(data);
    },
  };
}
