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
    <div className="pt-10 md:pt-16">
      <section className="mx-auto max-w-6xl">
        <FadeIn
          as="h1"
          className="max-w-3xl text-5xl font-extrabold leading-[1.0] tracking-tight text-poto-ink md:text-7xl"
        >
          {content.title ?? 'Get in touch'}
        </FadeIn>
        {content.intro ? (
          <FadeIn delay={0.1}>
            <p className="mt-5 max-w-xl text-base font-medium leading-snug text-poto-ink/70">
              {content.intro}
            </p>
          </FadeIn>
        ) : null}

        {content.email ? (
          <FadeIn delay={0.15}>
            <a
              href={`mailto:${content.email}`}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-poto-purple px-7 py-3.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.04]"
            >
              {content.email}
              <ArrowUpRight size={18} />
            </a>
          </FadeIn>
        ) : null}

        {zones.length ? (
          <FadeIn delay={0.2}>
            <p className="mt-10 text-xs font-bold uppercase tracking-[0.3em] text-poto-ink/50">Where we shoot</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {zones.map((z) => (
                <span key={z} className="rounded-full border-2 border-poto-ink/15 px-4 py-1.5 text-sm font-bold text-poto-ink">
                  {z}
                </span>
              ))}
            </div>
          </FadeIn>
        ) : null}
      </section>

      {pricing.length ? (
        <section className="mx-auto mt-16 max-w-3xl">
          <div className="border-t-2 border-poto-ink/10">
            {pricing.map((p) => (
              <div key={p.name} className="flex items-baseline justify-between gap-6 border-b-2 border-poto-ink/10 py-6">
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight text-poto-ink md:text-xl">{p.name}</h3>
                  {p.detail ? <p className="mt-1 text-sm font-medium text-poto-ink/60">{p.detail}</p> : null}
                </div>
                <span className="shrink-0 text-base font-extrabold tabular-nums text-poto-ink md:text-lg">{p.price}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <FAQ items={content.faqs} />
    </div>
  )
}
