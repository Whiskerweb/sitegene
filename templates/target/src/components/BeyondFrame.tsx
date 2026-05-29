import FadeIn from './FadeIn'
import { beyond } from '../data/content'

export default function BeyondFrame() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <FadeIn as="h2" className="tg-head text-4xl font-bold leading-[1.05] md:text-6xl">
            {beyond.title}
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-tg-mut">
              {beyond.body}
            </p>
            <button className="mt-8 rounded-full bg-tg-ink px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.04]">
              {beyond.cta}
            </button>
          </FadeIn>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {beyond.stats.map((s, i) => (
            <FadeIn key={s.l} delay={i * 0.1} className="rounded-2xl border border-tg-line bg-tg-card p-5 text-center">
              <p className="tg-head text-3xl font-bold md:text-4xl">{s.v}</p>
              <p className="mt-2 text-xs text-tg-mut">{s.l}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
