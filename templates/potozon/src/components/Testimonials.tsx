import { Star } from 'lucide-react'
import FadeIn from './FadeIn'
import { testimonials } from '../data/content'

const AVATAR_COLORS = ['#E5412A', '#8B7CF6', '#F15A24']

export default function Testimonials() {
  if (!testimonials || testimonials.length === 0) return null
  return (
    <section className="mx-auto max-w-6xl py-20 md:py-28">
      <FadeIn
        as="h2"
        className="mb-12 text-4xl font-extrabold tracking-tight text-poto-ink md:text-6xl"
      >
        Don’t trust us, trust them
      </FadeIn>

      <div className="grid gap-5 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <FadeIn
            key={t.name}
            delay={i * 0.08}
            className="flex flex-col rounded-2xl border-2 border-poto-ink/10 bg-white p-6"
          >
            <div className="mb-4 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star key={s} size={16} className="fill-poto-yellow text-poto-yellow" />
              ))}
            </div>
            <p data-sg-path={`testimonials[${i}].text`} className="flex-1 text-base font-medium leading-relaxed text-poto-ink/90">
              {t.text}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span
                className="h-10 w-10 shrink-0 overflow-hidden rounded-full"
                style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              >
                <img
                  src={t.avatar}
                  data-sg-img={`testimonials[${i}].avatar`}
                  alt={t.name}
                  className="h-full w-full object-cover mix-blend-luminosity"
                />
              </span>
              <div>
                <p data-sg-path={`testimonials[${i}].name`} className="text-sm font-bold text-poto-ink">{t.name}</p>
                <p data-sg-path={`testimonials[${i}].role`} className="text-xs font-medium text-poto-ink/60">{t.role}</p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
