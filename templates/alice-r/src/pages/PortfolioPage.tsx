import { usePage } from '../site/PageContext'
import Gallery from '../components/Gallery'

interface GalleryGroup { category: string; images: string[] }

export default function PortfolioPage() {
  const { content } = usePage()
  const galleries: GalleryGroup[] = content.galleries ?? []
  return (
    <section className="relative z-10 pt-28 md:pt-36">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <h1 className="max-w-3xl text-4xl font-medium leading-[1.1] text-white sm:text-5xl md:text-6xl">
          {content.title ?? 'Portfolio'}
        </h1>
        {content.intro ? (
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/60 md:text-base">
            {content.intro}
          </p>
        ) : null}
      </div>
      {galleries.map((g) => (
        <Gallery key={g.category} heading={g.category} images={g.images} />
      ))}
    </section>
  )
}
