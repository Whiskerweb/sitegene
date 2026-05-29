import { ArrowUpRight } from 'lucide-react'
import FadeIn from './FadeIn'
import { footer } from '../data/content'

function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 5l6 7-6 7M19 5l-6 7 6 7"
        stroke="#111111"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer id="contact" className="border-t-2 border-poto-ink/10 py-20 md:py-28">
      <FadeIn
        as="h2"
        className="max-w-3xl text-4xl font-extrabold leading-[1.0] tracking-tight text-poto-ink md:text-7xl"
      >
        {footer.title}
      </FadeIn>

      <FadeIn delay={0.1}>
        <a
          href={`mailto:${footer.email}`}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-poto-purple px-7 py-3.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.04]"
        >
          {footer.email}
          <ArrowUpRight size={18} />
        </a>
      </FadeIn>

      <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t-2 border-poto-ink/10 pt-8 md:flex-row md:items-center">
        <div className="flex items-center gap-1.5">
          <LogoMark />
          <span className="text-xl font-extrabold tracking-tight text-poto-ink">Potozon</span>
        </div>
        <div className="flex gap-5">
          {footer.socials.map((s) => (
            <span
              key={s}
              className="inline-flex min-h-[44px] items-center text-sm font-semibold text-poto-ink/65 transition-colors hover:text-poto-orange"
            >
              {s}
            </span>
          ))}
        </div>
        <p className="text-sm font-medium text-poto-ink/55">© 2026 Potozon. All rights reserved.</p>
      </div>
    </footer>
  )
}
