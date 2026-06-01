import { ArrowUpRight } from 'lucide-react'
import { usePage } from '../site/PageContext'
import FadeIn from '../components/FadeIn'
import Services from '../components/Services'
import FAQ from '../components/FAQ'

interface PriceRow { name: string; price: string; detail?: string }

export default function ServicePage() {
  const { content } = usePage()
  const pricing: PriceRow[] = content.pricing ?? []
  return (
    <div className="pt-10 md:pt-16">
      <section className="mx-auto max-w-6xl">
        <FadeIn
          as="h1"
          className="max-w-3xl text-5xl font-extrabold leading-[1.0] tracking-tight text-poto-ink md:text-7xl"
        >
          {content.title ?? 'Service'}
        </FadeIn>
        {content.description ? (
          <FadeIn delay={0.1}>
            <p className="mt-6 max-w-xl text-base font-medium leading-snug text-poto-ink/70">
              {content.description}
            </p>
          </FadeIn>
        ) : null}
      </section>

      <Services intro={content.servicesIntro} items={content.services} />

      {pricing.length ? (
        <section className="mx-auto max-w-3xl">
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

      {content.cta ? (
        <section className="mx-auto max-w-6xl py-20">
          <a
            href={content.ctaTo ?? '/contact'}
            className="inline-flex items-center gap-2 rounded-full bg-poto-orange px-7 py-3.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.04]"
          >
            {content.cta}
            <ArrowUpRight size={18} />
          </a>
        </section>
      ) : null}
    </div>
  )
}
