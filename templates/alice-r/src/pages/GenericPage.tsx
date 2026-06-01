import { usePage } from '../site/PageContext'
import FadeIn from '../components/FadeIn'
import Gallery from '../components/Gallery'

type Block =
  | { kind: 'richText'; title?: string; body: string }
  | { kind: 'imageText'; title?: string; body: string; image: string; reverse?: boolean }
  | { kind: 'gallery'; heading?: string; images: string[] }
  | { kind: 'cta'; label: string; to?: string }

export default function GenericPage() {
  const { content } = usePage()
  const blocks: Block[] = content.blocks ?? []
  return (
    <div className="relative z-10 pt-28 md:pt-36">
      {content.title ? (
        <section className="mx-auto max-w-6xl px-6 md:px-10">
          <h1 className="max-w-3xl text-4xl font-medium leading-[1.1] text-white sm:text-5xl md:text-6xl">
            {content.title}
          </h1>
        </section>
      ) : null}

      {blocks.map((b, i) => {
        if (b.kind === 'richText') {
          return (
            <section key={i} className="mx-auto max-w-3xl px-6 py-12 md:px-10">
              {b.title ? <h2 className="mb-4 text-2xl font-medium text-white md:text-3xl">{b.title}</h2> : null}
              <p className="text-sm leading-relaxed text-white/65 md:text-base">{b.body}</p>
            </section>
          )
        }
        if (b.kind === 'imageText') {
          return (
            <section key={i} className="mx-auto max-w-6xl px-6 py-12 md:px-10">
              <div className={`grid items-center gap-10 md:grid-cols-2 ${b.reverse ? 'md:[direction:rtl]' : ''}`}>
                <FadeIn className="[direction:ltr]">
                  {b.title ? <h2 className="mb-4 text-2xl font-medium text-white md:text-3xl">{b.title}</h2> : null}
                  <p className="text-sm leading-relaxed text-white/65 md:text-base">{b.body}</p>
                </FadeIn>
                <FadeIn delay={0.1} className="[direction:ltr]">
                  <img src={b.image} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-3xl object-cover ring-1 ring-white/10" />
                </FadeIn>
              </div>
            </section>
          )
        }
        if (b.kind === 'gallery') {
          return <Gallery key={i} heading={b.heading ?? 'Gallery'} images={b.images} />
        }
        return (
          <section key={i} className="mx-auto max-w-6xl px-6 py-12 md:px-10">
            <a
              href={b.to ?? '/contact'}
              className="inline-flex min-h-[48px] items-center rounded-full bg-white px-7 py-3.5 text-sm font-medium text-[#1a1108] transition-transform hover:scale-[1.04]"
            >
              {b.label}
            </a>
          </section>
        )
      })}
    </div>
  )
}
