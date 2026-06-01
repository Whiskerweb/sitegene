import FadeIn from './FadeIn'
import { beyond } from '../data/content'

export default function Stats() {
  return (
    <section id="about" className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <FadeIn
            as="h2"
            data-sg-path="beyond.title"
            className="text-3xl font-medium leading-[1.1] text-white sm:text-4xl md:text-5xl"
          >
            {beyond.title}
          </FadeIn>
          <FadeIn delay={0.1}>
            <p data-sg-path="beyond.body" className="mt-6 max-w-md text-sm leading-relaxed text-white/65 md:text-base">
              {beyond.body}
            </p>
            <a
              href="#contact"
              data-sg-path="beyond.cta"
              className="mt-8 inline-flex min-h-[48px] items-center rounded-full bg-white px-7 py-3 text-sm font-medium text-[#1a1108] transition-transform hover:scale-[1.04]"
            >
              {beyond.cta}
            </a>
          </FadeIn>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-5">
          {beyond.stats.map((s, i) => (
            <FadeIn
              key={s.l}
              delay={i * 0.1}
              className="rounded-3xl border border-white/12 bg-white/[0.04] p-4 text-center backdrop-blur md:p-6"
            >
              <p data-sg-path={`beyond.stats[${i}].v`} className="text-2xl font-medium tabular-nums text-white sm:text-3xl md:text-5xl">
                {s.v}
              </p>
              <p data-sg-path={`beyond.stats[${i}].l`} className="mt-1.5 text-[11px] leading-tight text-white/55 sm:text-xs">{s.l}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
