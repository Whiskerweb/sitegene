// (Plumber Pro) Avis : 1 carte large en vedette (quote XL + avatar) + 3 petites cartes.
// Fond card, cartes blanches, étoiles accent, radius card.
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";

interface ReviewItem { quote: string; author: string; role?: string; avatar?: string; rating?: number }

function Stars({ n }: { n?: number }) {
  const count = Math.max(0, Math.min(5, n ?? 5));
  return <span style={{ color: "var(--c-accent)" }}>{"★".repeat(count)}{"☆".repeat(5 - count)}</span>;
}

export default function PlumberProTestimonials({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const items: ReviewItem[] = Array.isArray(content?.items) ? content.items : [
    { quote: "Une équipe remarquable, intervention rapide et propre. Je recommande vivement !", author: "Julien Caron", role: "Propriétaire", rating: 4 },
    { quote: "Technicien courtois et très soigneux, tout est parfait.", author: "Olivia Bonnet", role: "Gestionnaire", rating: 4 },
    { quote: "Prise en charge rapide et résultat impeccable, merci !", author: "Marc Leblanc", role: "Chef d'entreprise", rating: 4 },
    { quote: "Réactifs et agréables, on les recommande les yeux fermés.", author: "Sophie Chastel", role: "Particulier", rating: 4 },
  ];
  const [featured, ...rest] = items;
  return (
    <section className="pptesti bg-[var(--c-card)] py-20 md:py-28 px-6" style={root}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--c-accent)" }}>
            {content?.label ?? "Témoignages"}
          </span>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight md:text-5xl" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)" }}>
            {content?.title ?? "De vrais avis honnêtes de vrais clients"}
          </h2>
        </div>

        {/* Grande carte vedette */}
        {featured && (
          <div className="mb-6 flex flex-col gap-5 rounded-[var(--r-xl)] bg-[var(--c-surface)] p-8 shadow-sm md:p-10">
            <div className="text-base"><Stars n={featured.rating} /></div>
            <p className="text-lg font-medium leading-relaxed md:text-xl" style={{ color: "var(--c-ink)" }}>
              &ldquo;{featured.quote}&rdquo;
            </p>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold" style={{ color: "var(--c-ink)" }}>{featured.author}</div>
                {featured.role && <div className="text-sm" style={{ color: "var(--c-muted)" }}>{featured.role}</div>}
              </div>
              {featured.avatar && (
                <img src={featured.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
              )}
            </div>
          </div>
        )}

        {/* 3 petites */}
        <div className="grid gap-6 md:grid-cols-3">
          {rest.slice(0, 3).map((r, i) => (
            <div key={i} className="flex flex-col gap-4 rounded-[var(--r-card)] bg-[var(--c-surface)] p-7 shadow-sm">
              <div className="text-sm"><Stars n={r.rating} /></div>
              <p className="flex-1 text-sm leading-relaxed" style={{ color: "var(--c-ink)" }}>&ldquo;{r.quote}&rdquo;</p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold" style={{ color: "var(--c-ink)" }}>{r.author}</div>
                  {r.role && <div className="text-xs" style={{ color: "var(--c-muted)" }}>{r.role}</div>}
                </div>
                {r.avatar && (
                  <img src={r.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
