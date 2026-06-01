import { usePage } from '../site/PageContext'
import FadeIn from '../components/FadeIn'
import Works from '../components/Works'
import Gallery from '../components/Gallery'

export default function PortfolioPage() {
  const { content } = usePage()
  return (
    <section className="px-5 pt-32 md:px-10 md:pt-40">
      <div className="mx-auto max-w-6xl">
        <FadeIn as="h1" className="tg-head flex items-center gap-3 text-5xl font-bold md:text-7xl">
          <span className="h-3.5 w-3.5 rounded-sm bg-tg-accent" />
          {content.title ?? 'Portfolio'}
        </FadeIn>
        {content.intro ? (
          <FadeIn delay={0.1}>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-tg-mut">{content.intro}</p>
          </FadeIn>
        ) : null}
      </div>
      <Works items={content.works} />
      <Gallery items={content.gallery} />
    </section>
  )
}
