// lib/rate-limit.ts
// Rate limit naïf par clé (par instance serveur) pour les routes publiques du
// tunnel /creer (avant création de compte). Même esprit que le limiteur de
// /api/foundry/charte : borne les abus simples, pas une défense absolue.

const buckets = new Map<string, number[]>();

export function rateLimitAllowed(key: string, opts: { windowMs: number; max: number }): boolean {
  const now = Date.now();
  const list = (buckets.get(key) ?? []).filter((t) => now - t < opts.windowMs);
  if (list.length >= opts.max) return false;
  list.push(now);
  buckets.set(key, list);
  if (buckets.size > 5000) buckets.clear(); // borne mémoire
  return true;
}

/** IP appelante (x-forwarded-for) pour clé de rate limit. */
export function requestIp(request: Request): string {
  return (request.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
}
