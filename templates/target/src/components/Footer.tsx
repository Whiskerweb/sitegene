import { ArrowUpRight } from 'lucide-react'
import FadeIn from './FadeIn'
import { useSite } from '../site/PageContext'

export default function Footer() {
  const { brand, footer } = useSite()
  const f = footer ?? {}
  const socials: string[] = Array.isArray(f.socials) ? f.socials : []
  return (
    <footer id="contact" className="border-t border-tg-line px-5 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-6xl">
        <FadeIn as="h2" className="tg-head max-w-3xl text-4xl font-bold leading-[1.05] md:text-7xl" data-sg-path="footer.title">
          {f.title}
        </FadeIn>
        <FadeIn delay={0.1}>
          <a
            href={`mailto:${f.email}`}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-tg-ink px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.04]"
          >
            <span data-sg-path="footer.email" data-sg-edit="panel">{f.email}</span>
            <ArrowUpRight size={18} />
          </a>
        </FadeIn>

        <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-tg-line pt-8 text-sm text-tg-mut md:flex-row md:items-center">
          <span className="tg-head text-lg font-extrabold tracking-[0.3em] text-tg-ink"><span data-sg-path="brand" data-sg-edit="panel">{brand}</span></span>
          <div className="flex gap-6">
            {socials.map((s) => (
              <span key={s} className="transition-colors hover:text-tg-ink">
                {s}
              </span>
            ))}
          </div>
          <p>© 2026 <span data-sg-path="brand" data-sg-edit="panel">{brand}</span>. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
