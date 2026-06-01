import { usePage } from '../site/PageContext'
import FadeIn from '../components/FadeIn'
import Gallery from '../components/Gallery'
import Works from '../components/Works'

export default function PortfolioPage() {
  const { content } = usePage()
  return (
    <section className="pt-10 md:pt-16">
      <FadeIn
        as="h1"
        className="flex items-center gap-3 text-5xl font-extrabold tracking-tight text-poto-ink md:text-7xl"
      >
        {content.title ?? 'Portfolio'}
        <span className="h-3.5 w-3.5 rounded-sm bg-poto-yellow" />
      </FadeIn>
      {content.intro ? (
        <FadeIn delay={0.1}>
          <p className="mt-5 max-w-xl text-base font-medium leading-snug text-poto-ink/70">
            {content.intro}
          </p>
        </FadeIn>
      ) : null}

      <Gallery cards={content.cards} textLeft={content.textLeft} textRight={content.textRight} />
      <Works items={content.works} />
    </section>
  )
}
