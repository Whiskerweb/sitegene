import { usePage } from '../site/PageContext'
import FadeIn from '../components/FadeIn'

type Block =
  | { kind: 'richText'; title?: string; body: string }
  | { kind: 'imageText'; title?: string; body: string; image: string; reverse?: boolean }
  | { kind: 'cta'; label: string; to?: string }

export default function GenericPage() {
  const { content } = usePage()
  const blocks: Block[] = content.blocks ?? []
  return (
    <div className="px-5 pt-32 md:px-10 md:pt-40">
      {content.title ? (
        <section className="mx-auto max-w-6xl">
          <h1 className="tg-head max-w-3xl text-5xl font-bold leading-[1.0] md:text-7xl">
            {content.title}
          </h1>
        </section>
      ) : null}

      {blocks.map((b, i) => {
        if (b.kind === 'richText') {
          return (
            <section key={i} className="mx-auto max-w-3xl py-12">
              {b.title ? <h2 className="tg-head mb-4 text-3xl font-bold">{b.title}</h2> : null}
              <p className="text-sm leading-relaxed text-tg-mut">{b.body}</p>
            </section>
          )
        }
        if (b.kind === 'imageText') {
          return (
            <section key={i} className="mx-auto max-w-6xl py-12">
              <div className={`grid items-center gap-10 md:grid-cols-2 ${b.reverse ? 'md:[direction:rtl]' : ''}`}>
                <FadeIn className="[direction:ltr]">
                  {b.title ? <h2 className="tg-head mb-4 text-3xl font-bold">{b.title}</h2> : null}
                  <p className="text-sm leading-relaxed text-tg-mut">{b.body}</p>
                </FadeIn>
                <FadeIn delay={0.1} className="[direction:ltr]">
                  <img src={b.image} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover" />
                </FadeIn>
              </div>
            </section>
          )
        }
        return (
          <section key={i} className="mx-auto max-w-6xl py-12">
            <a
              href={b.to ?? '/contact'}
              className="inline-flex items-center rounded-full bg-tg-ink px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.04]"
            >
              {b.label}
            </a>
          </section>
        )
      })}
    </div>
  )
}
