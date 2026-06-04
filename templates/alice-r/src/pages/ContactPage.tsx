import { ArrowUpRight } from 'lucide-react'
import { usePage } from '../site/PageContext'
import FadeIn from '../components/FadeIn'
import FAQ from '../components/FAQ'

interface PriceRow { name: string; price: string; detail?: string }

export default function ContactPage() {
  const { content } = usePage()
  const zones: string[] = content.zones ?? []
  const pricing: PriceRow[] = content.pricing ?? []
  return (
    <div className="relative z-10 pt-28 md:pt-36">
      <section className="mx-auto max-w-6xl px-6 md:px-10">
        <FadeIn
          as="h1"
          className="max-w-3xl text-4xl font-medium leading-[1.1] text-white sm:text-5xl md:text-6xl"
        >
          {content.title ?? 'Écrivez-moi'}
        </FadeIn>
        {content.intro ? (
          <FadeIn delay={0.1}>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/60 md:text-base">
              {content.intro}
            </p>
          </FadeIn>
        ) : null}

        {content.email ? (
          <FadeIn delay={0.15}>
            <a
              href={`mailto:${content.email}`}
              className="mt-8 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-[#1a1108] transition-transform hover:scale-[1.04]"
            >
              {content.email}
              <ArrowUpRight size={18} />
            </a>
          </FadeIn>
        ) : null}

        {zones.length ? (
          <FadeIn delay={0.2}>
            <p className="mt-10 text-xs uppercase tracking-[0.2em] text-white/45">Où je photographie</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {zones.map((z) => (
                <span key={z} className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium text-white/80">
                  {z}
                </span>
              ))}
            </div>
          </FadeIn>
        ) : null}
      </section>

      {pricing.length ? (
        <section className="mx-auto mt-16 max-w-3xl px-6 md:px-10">
          <div className="border-t border-white/12">
            {pricing.map((p) => (
              <div key={p.name} className="flex items-baseline justify-between gap-6 border-b border-white/12 py-6">
                <div>
                  <h3 className="text-lg font-medium text-white md:text-xl">{p.name}</h3>
                  {p.detail ? <p className="mt-1 text-sm text-white/55">{p.detail}</p> : null}
                </div>
                <span className="shrink-0 text-base font-medium tabular-nums text-white md:text-lg">{p.price}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <FAQ items={content.faqs} />
    </div>
  )
}
