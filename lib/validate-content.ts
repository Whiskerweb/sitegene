import { z } from "zod";

const PAGE_TYPES = ["home", "portfolio", "about", "service", "contact", "generic"] as const;

const navItem: z.ZodType<any> = z.lazy(() =>
  z.object({
    label: z.string(),
    to: z.string().optional(),
    children: z.array(navItem).optional(),
  }),
);

const schema = z.object({
  version: z.literal(2),
  site: z.object({
    brand: z.string().optional(),
    theme: z.record(z.string(), z.unknown()).optional(),
    nav: z.array(navItem).optional(),
    footer: z.record(z.string(), z.unknown()).optional(),
  }),
  pages: z.array(
    z.object({
      slug: z.string(),
      type: z.enum(PAGE_TYPES),
      title: z.string().optional(),
      meta: z.object({ description: z.string().optional(), ogImage: z.string().optional() }).optional(),
      content: z.record(z.string(), z.unknown()),
    }),
  ),
});

export function validateContentV2(raw: unknown): { ok: true } | { ok: false; error: string } {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.message };
  const c = parsed.data;
  const slugs = new Set(c.pages.map((p) => p.slug.replace(/\/$/, "") || "/"));
  if (!slugs.has("/")) return { ok: false, error: "Page d'accueil '/' manquante." };
  const checkNav = (items: typeof c.site.nav = []): string | null => {
    for (const it of items ?? []) {
      if (it.to && !it.to.startsWith("#") && !slugs.has(it.to.replace(/\/$/, "") || "/")) {
        return `nav.to inconnu: ${it.to}`;
      }
      const sub = it.children && checkNav(it.children);
      if (sub) return sub;
    }
    return null;
  };
  const navErr = checkNav(c.site.nav);
  if (navErr) return { ok: false, error: navErr };
  return { ok: true };
}
