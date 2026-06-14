// components/foundry/components/ContactBlock.tsx
import { Eyebrow } from "../primitives";
import type { Skin } from "@/lib/foundry/types";

interface ContactContent {
  eyebrow: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  cta: string;
  /** Destination du bouton (lien de réservation injecté) — défaut : haut de page. */
  ctaHref?: string;
}

export default function ContactBlock({ content }: { content: ContactContent; skin: Skin }) {
  // Seules les coordonnées RENSEIGNÉES s'affichent — et elles sont cliquables.
  const rows = (
    [
      ["Email", content.email, content.email ? `mailto:${content.email}` : null],
      ["Téléphone", content.phone, content.phone ? `tel:${content.phone.replace(/[^\d+]/g, "")}` : null],
      ["Adresse", content.address, null],
    ] as Array<[string, string, string | null]>
  ).filter(([, v]) => typeof v === "string" && v.trim());

  return (
    <section id="contact" className="px-5 py-16 md:py-24" style={{ background: "var(--c-surface)" }}>
      <div className="mx-auto grid max-w-[1280px] gap-10 rounded-[var(--r-xl)] p-8 md:grid-cols-2 md:p-12" style={{ background: "var(--c-card)" }}>
        <div>
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 className="mt-4 max-w-sm text-[2rem] md:text-[2.75rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1px", lineHeight: 1.12 }}>
            {content.title}
          </h2>
          <a href={content.ctaHref?.trim() || "#top"} className="mt-7 inline-flex rounded-[var(--r-pill)] px-7 py-3.5 font-bold transition hover:brightness-95" style={{ background: "var(--c-accent)", color: "var(--c-on-accent)" }}>
            {content.cta}
          </a>
        </div>
        {rows.length > 0 && (
          <div className="flex flex-col justify-center gap-4 text-sm">
            {rows.map(([k, v, href]) => (
              <div key={k}>
                <div className="font-mono text-xs uppercase tracking-wide" style={{ color: "var(--c-accent)" }}>{k}</div>
                {href ? (
                  <a href={href} className="mt-0.5 inline-block transition-opacity hover:opacity-70" style={{ color: "var(--c-ink)" }}>{v}</a>
                ) : (
                  <div className="mt-0.5" style={{ color: "var(--c-ink)" }}>{v}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
