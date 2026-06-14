// components/foundry/components/FooterColumns.tsx
import { navLabel, navHref } from "@/lib/foundry/nav";
import type { Skin } from "@/lib/foundry/types";
import SocialIcon from "./SocialIcon";

// Un lien de colonne : chaîne simple (texte brut, ex. une adresse) ou objet
// {label,target} (stocké) / {label,href} (résolu au rendu public).
type FooterLink = string | { label?: string; target?: string; href?: string };
interface FooterCol { title: string; links: FooterLink[] }
interface FooterContent {
  brand: string;
  tagline: string;
  columns: FooterCol[];
  socials?: Array<{ platform?: string; href?: string; label?: string }>;
  copyright: string;
}

const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_LIKE = /^\+?[\d][\d ().\-]{7,}$/;

/** Coordonnées en texte brut → lien cliquable (mailto/tel), sinon null. */
function autoHref(label: string): string | null {
  const v = label.trim();
  if (EMAIL_LIKE.test(v)) return `mailto:${v}`;
  if (PHONE_LIKE.test(v)) return `tel:${v.replace(/[^\d+]/g, "")}`;
  return null;
}

export default function FooterColumns({ content }: { content: FooterContent; skin: Skin }) {
  const socials = (Array.isArray(content.socials) ? content.socials : []).filter((s) => s?.href);
  return (
    <footer className="px-5 pt-16 pb-8" style={{ background: "var(--c-card)" }}>
      <div className="mx-auto grid max-w-[1280px] gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <span className="text-xl" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)" }}>{content.brand}</span>
          <p className="mt-5 max-w-xs" style={{ color: "var(--c-accent)" }}>{content.tagline}</p>
          {socials.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {socials.map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label ?? s.platform ?? "Lien"}
                  className="grid h-9 w-9 place-items-center rounded-full transition hover:opacity-70"
                  style={{ border: "1px solid color-mix(in srgb, var(--c-accent) 35%, transparent)", color: "var(--c-ink)" }}
                >
                  <SocialIcon platform={s.platform ?? s.label ?? "link"} className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>
        {content.columns.map((c, i) => (
          <div key={i}>
            <p className="text-lg font-bold" style={{ color: "var(--c-ink)" }}>{c.title}</p>
            <ul className="mt-5 flex flex-col gap-3" style={{ color: "var(--c-accent)" }}>
              {c.links.map((l, j) => {
                const label = navLabel(l);
                const href = (() => {
                  const h = navHref(l);
                  if (h && h !== "#") return h;
                  return typeof l === "string" ? autoHref(l) : null;
                })();
                return (
                  <li key={j}>
                    {href ? (
                      <a href={href} className="transition-opacity hover:opacity-70" style={{ color: "inherit" }}>{label}</a>
                    ) : (
                      label
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-14 max-w-[1280px] border-t pt-6 text-xs" style={{ borderColor: "color-mix(in srgb, var(--c-accent) 18%, transparent)", color: "var(--c-accent)" }}>{content.copyright}</div>
    </footer>
  );
}
