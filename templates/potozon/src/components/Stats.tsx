import FadeIn from './FadeIn'
import { beyond } from '../data/content'

// Texte lisible (foncé ou clair) selon la couleur de fond de la carte.
const DARK_TEXT = new Set(['#FFC400'])

export default function Stats() {
  return (
    <section className="mx-auto max-w-6xl py-20 md:py-28">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <FadeIn
            as="h2"
            className="text-4xl font-extrabold leading-[1.02] tracking-tight text-poto-ink md:text-6xl"
          >
            {beyond.title}
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-6 max-w-md text-base font-medium leading-relaxed text-poto-ink/75">
              {beyond.body}
            </p>
            <a
              href="#contact"
              className="mt-8 inline-flex rounded-full bg-poto-ink px-7 py-3.5 text-sm font-bold text-white transition-transform hover:scale-[1.04]"
            >
              {beyond.cta}
            </a>
          </FadeIn>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {beyond.stats.map((s, i) => {
            const dark = DARK_TEXT.has(s.color)
            return (
              <FadeIn
                key={s.l}
                delay={i * 0.1}
                className="rounded-2xl p-3 text-center md:p-5"
                style={{ backgroundColor: s.color }}
              >
                <p
                  className="text-2xl font-extrabold tabular-nums sm:text-3xl md:text-5xl"
                  style={{ color: dark ? '#111111' : '#ffffff' }}
                >
                  {s.v}
                </p>
                <p
                  className="mt-1.5 text-[11px] font-semibold leading-tight sm:text-xs"
                  style={{ color: dark ? 'rgba(17,17,17,0.7)' : 'rgba(255,255,255,0.85)' }}
                >
                  {s.l}
                </p>
              </FadeIn>
            )
          })}
        </div>
      </div>
    </section>
  )
}
