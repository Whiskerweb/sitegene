import { ArrowUpRight } from 'lucide-react'
import { usePage } from '../site/PageContext'
import FadeIn from '../components/FadeIn'
import Gallery from '../components/Gallery'
import FAQ from '../components/FAQ'

interface PriceRow { name: string; price: string; detail?: string }

export default function ServicePage() {
  const { content } = usePage()
  const pricing: PriceRow[] = content.pricing ?? []
  return (
    <div className="relative z-10 pt-28 md:pt-36">
      <section className="mx-auto max-w-6xl px-6 md:px-10">
        <FadeIn
          as="h1"
          className="max-w-3xl text-4xl font-medium leading-[1.1] text-white sm:text-5xl md:text-6xl"
        >
          {content.title ?? 'Session'}
        </FadeIn>
        {content.description ? (
          <FadeIn delay={0.1}>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/65 md:text-base">
              {content.description}
            </p>
          </FadeIn>
        ) : null}
      </section>

      <Gallery heading={content.galleryHeading ?? 'Recent work'} images={content.gallery} />

      {pricing.length ? (
        <section className="mx-auto max-w-3xl px-6 md:px-10">
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

      {content.cta ? (
        <section className="mx-auto max-w-6xl px-6 py-20 md:px-10">
          <a
            href={content.ctaTo ?? '/contact'}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-[#1a1108] transition-transform hover:scale-[1.04]"
          >
            {content.cta}
            <ArrowUpRight size={18} />
          </a>
        </section>
      ) : null}
    </div>
  )
}
