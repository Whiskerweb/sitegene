import { ArrowUpRight } from 'lucide-react'
import { usePage } from '../site/PageContext'
import FadeIn from '../components/FadeIn'
import FAQs from '../components/FAQs'

interface PriceRow { name: string; price: string; detail?: string }

export default function ContactPage() {
  const { content } = usePage()
  const zones: string[] = content.zones ?? []
  const pricing: PriceRow[] = content.pricing ?? []
  return (
    <div className="px-5 pt-32 md:px-10 md:pt-40">
      <section className="mx-auto max-w-6xl">
        <FadeIn as="h1" className="tg-head max-w-3xl text-5xl font-bold leading-[1.0] md:text-7xl">
          {content.title ?? 'Get in touch'}
        </FadeIn>
        {content.intro ? (
          <FadeIn delay={0.1}>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-tg-mut">{content.intro}</p>
          </FadeIn>
        ) : null}

        {content.email ? (
          <FadeIn delay={0.15}>
            <a
              href={`mailto:${content.email}`}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-tg-ink px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.04]"
            >
              {content.email}
              <ArrowUpRight size={18} />
            </a>
          </FadeIn>
        ) : null}

        {zones.length ? (
          <FadeIn delay={0.2}>
            <p className="mt-12 text-xs uppercase tracking-[0.3em] text-tg-mut">Where I shoot</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {zones.map((z) => (
                <span key={z} className="rounded-full border border-tg-line px-4 py-1.5 text-sm font-medium text-tg-ink">
                  {z}
                </span>
              ))}
            </div>
          </FadeIn>
        ) : null}
      </section>

      {pricing.length ? (
        <section className="mx-auto mt-16 max-w-3xl">
          <div className="border-t border-tg-line">
            {pricing.map((p) => (
              <div key={p.name} className="flex items-baseline justify-between gap-6 border-b border-tg-line py-6">
                <div>
                  <h3 className="tg-head text-lg font-medium md:text-xl">{p.name}</h3>
                  {p.detail ? <p className="mt-1 text-sm text-tg-mut">{p.detail}</p> : null}
                </div>
                <span className="shrink-0 text-base font-semibold tabular-nums text-tg-ink md:text-lg">{p.price}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <FAQs items={content.faqs} />
    </div>
  )
}
