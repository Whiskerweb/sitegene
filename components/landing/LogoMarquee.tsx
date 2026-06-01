import { CATEGORIES } from "@/lib/categories";

/** Preuve sociale multi-métiers (un témoignage par catégorie, source unique). */
const reviews = CATEGORIES.map((c) => c.testimonial);

export default function LogoMarquee() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-[1240px]">
        <p className="mb-10 text-center text-sm font-medium text-slate">
          Des pros déjà en ligne, et ravis.
        </p>
        <div className="grid gap-5 md:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.name} className="rounded-[22px] border border-sky-200 bg-surface-2 p-6 shadow-cloud-sm">
              <div className="mb-3 text-[15px] tracking-[0.1em] text-warn" aria-hidden>
                ★★★★★
              </div>
              <blockquote className="text-[15px] leading-[1.6] text-night">
                « {r.quote} »
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-2.5 text-sm">
                <span className="h-9 w-9 rounded-full border-2 border-white shadow-sm" style={{ background: r.tone }} />
                <span>
                  <span className="font-semibold text-night">{r.name}</span>
                  <span className="block text-[13px] text-mist">{r.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
