import { RESERVED_SLUGS, isValidSlug } from "./templates";

/** Domaines racine où un sous-domaine = un site client. */
const SITE_ROOTS = ["akyra.io", "localhost"];

export type HostKind =
  | { kind: "app" }
  | { kind: "site"; slug: string };

/**
 * Décide, à partir du header Host, si la requête vise l'app (apex/www/réservé/
 * domaine inconnu) ou un site client (`<slug>.akyra.io`, `<slug>.localhost`).
 */
export function parseHost(host: string | null | undefined): HostKind {
  if (!host) return { kind: "app" };
  const hostname = host.split(":")[0].toLowerCase(); // retire le port
  const root = SITE_ROOTS.find(
    (r) => hostname === r || hostname.endsWith(`.${r}`),
  );
  if (!root) return { kind: "app" }; // domaine non géré (preview vercel, etc.)
  if (hostname === root) return { kind: "app" }; // apex / localhost nu
  const sub = hostname.slice(0, -(root.length + 1)); // retire ".akyra.io"
  if (sub === "www") return { kind: "app" };
  if (sub.includes(".")) return { kind: "app" }; // pas de multi-niveau en v1
  if (RESERVED_SLUGS.has(sub) || !isValidSlug(sub)) return { kind: "app" };
  return { kind: "site", slug: sub };
}
