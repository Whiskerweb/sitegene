import { ArrowUpRight } from 'lucide-react'
import FadeIn from './FadeIn'
import { footer, hero } from '../data/content'

export default function Footer() {
  return (
    <footer
      id="contact"
      className="relative z-10 border-t border-white/12 px-6 py-20 md:px-10 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <FadeIn
          as="h2"
          data-sg-path="footer.title"
          className="max-w-3xl text-3xl font-medium leading-[1.1] text-white sm:text-4xl md:text-6xl"
        >
          {footer.title}
        </FadeIn>

        <FadeIn delay={0.1}>
          <a
            href={`mailto:${footer.email}`}
            className="mt-8 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-[#1a1108] transition-transform hover:scale-[1.04]"
          >
            <span data-sg-path="footer.email" data-sg-edit="panel">{footer.email}</span>
            <ArrowUpRight size={18} />
          </a>
        </FadeIn>

        <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-white/12 pt-8 md:flex-row md:items-center">
          <span data-sg-path="hero.brand" data-sg-edit="panel" className="text-lg font-medium tracking-tight text-white">{hero.brand}</span>
          <div className="flex gap-5">
            {footer.socials.map((s) => (
              <span
                key={s}
                className="inline-flex min-h-[44px] items-center text-sm font-medium text-white/55 transition-colors hover:text-white"
              >
                {s}
              </span>
            ))}
          </div>
          <p className="text-sm text-white/40">© 2026 <span data-sg-path="hero.brand" data-sg-edit="panel">{hero.brand}</span>. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
