// components/foundry/components/BlogPosts.tsx
// Import adapté (style « blog-posts grid ») : grille d'articles en cartes
// pleine-image (la 1re occupe 2×2), voile bas, étoiles + vues + catégorie, mot
// géant en filigrane derrière, légère bascule au survol. CSS vars ; scrims
// neutres tolérés. Modulable (idéalement 3 à 5 articles).
import type { Skin } from "@/lib/foundry/types";

interface Post { title: string; category: string; image: string; views?: number; readTime?: number; rating?: number }

export default function BlogPosts({ content }: { content: any; skin: Skin }) {
  const posts: Post[] = Array.isArray(content?.items) ? content.items : [];
  return (
    <section className="relative mx-auto my-10 max-w-6xl px-4 py-10">
      {content?.backgroundLabel && (
        <span className="pointer-events-none absolute -top-10 left-[-6%] -z-0 select-none font-extrabold leading-none md:-left-[10%]" style={{ fontSize: "clamp(8rem, 26vw, 24rem)", color: "color-mix(in srgb, var(--c-ink) 4%, transparent)" }}>
          {content.backgroundLabel}
        </span>
      )}
      {content?.title && (
        <h2 className="relative text-center text-4xl font-semibold capitalize md:text-5xl lg:text-6xl" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)", lineHeight: 1.3 }}>{content.title}</h2>
      )}
      {content?.subtitle && (
        <p className="relative mx-auto mt-3 mb-8 max-w-[800px] text-center text-lg md:text-xl" style={{ color: "color-mix(in srgb, var(--c-ink) 50%, transparent)", lineHeight: 1.7 }}>{content.subtitle}</p>
      )}

      <div className="relative grid h-auto grid-cols-1 gap-5 md:h-[650px] md:grid-cols-2 lg:grid-cols-[1fr_0.5fr]">
        {posts.map((p, i) => (
          <div
            key={i}
            style={{ backgroundImage: `url(${p.image})` }}
            className={`group relative flex size-full cursor-pointer flex-col justify-end overflow-hidden rounded-[20px] bg-cover bg-center p-5 text-white transition-all duration-300 hover:scale-[0.99] hover:rotate-[0.3deg] max-md:h-[300px] ${i === 0 ? "md:col-span-2 md:row-span-2 lg:col-span-1" : ""}`}
          >
            <div className="absolute inset-0 -z-0 bg-gradient-to-t from-black/80 to-transparent" />
            <article className="relative z-0 flex items-end">
              <div className="flex flex-1 flex-col gap-3">
                <h3 className="text-2xl font-semibold md:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>{p.title}</h3>
                <div className="flex flex-col gap-2">
                  {p.category && <span className="w-fit rounded-md px-2 py-px text-sm capitalize text-white backdrop-blur-md" style={{ background: "color-mix(in srgb, #fff 35%, transparent)" }}>{p.category}</span>}
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, k) => (
                        <svg key={k} viewBox="0 0 24 24" className="h-5 w-5" fill={k < (p.rating ?? 5) ? "var(--c-accent2)" : "rgba(255,255,255,.35)"}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>
                      ))}
                    </div>
                    {typeof p.views === "number" && <span className="text-sm font-light">({p.views} vues)</span>}
                  </div>
                  {typeof p.readTime === "number" && <div className="text-base font-semibold">{p.readTime} min de lecture</div>}
                </div>
              </div>
              <svg className="transition-transform duration-300 group-hover:translate-x-2" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}
