// components/foundry/components/BlogCards.tsx
// Import adapté (style « Latest Blog ») : en-tête centré + grille de cartes
// (image arrondie, titre, catégorie) qui se soulèvent au survol. MODULABLE :
// flex centré → 1, 2 ou 3+ cartes restent au centre. CSS vars ; serveur.
import type { Skin } from "@/lib/foundry/types";
import { Eyebrow } from "../primitives";

interface Item { image: string; title: string; category: string }

export default function BlogCards({ content }: { content: any; skin: Skin }) {
  const items: Item[] = Array.isArray(content?.items) ? content.items : [];
  return (
    <section className="px-5 py-16 md:py-24" style={{ background: "var(--c-surface)" }}>
      <div className="mx-auto flex max-w-5xl flex-col items-center">
        {content?.eyebrow && <Eyebrow>{content.eyebrow}</Eyebrow>}
        {content?.title && (
          <h2 className="mt-3 text-center text-[2rem] md:text-[2.8rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.2px", lineHeight: 1.1 }}>{content.title}</h2>
        )}
        {content?.subtitle && (
          <p className="mt-3 max-w-lg text-center text-sm" style={{ color: "var(--c-muted)" }}>{content.subtitle}</p>
        )}

        <div className="mt-12 flex flex-wrap justify-center gap-8">
          {items.map((it, i) => (
            <article key={i} className="w-full max-w-72 flex-1 basis-72 transition-transform duration-300 hover:-translate-y-1">
              <div className="overflow-hidden rounded-xl" style={{ background: "var(--c-card)" }}>
                <img src={it.image} alt="" loading="lazy" className="aspect-[3/2] w-full object-cover" />
              </div>
              <h3 className="mt-3 text-base font-semibold leading-snug" style={{ color: "var(--c-ink)" }}>{it.title}</h3>
              {it.category && <p className="mt-1 text-xs font-medium" style={{ color: "var(--c-accent)" }}>{it.category}</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
