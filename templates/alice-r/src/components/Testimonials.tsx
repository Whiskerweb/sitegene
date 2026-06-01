import { Star } from 'lucide-react'
import FadeIn from './FadeIn'
import { testimonials } from '../data/content'

export default function Testimonials() {
  if (!testimonials || testimonials.length === 0) return null
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
      <FadeIn
        as="h2"
        className="mb-12 text-3xl font-medium leading-tight text-white sm:text-4xl md:text-5xl"
      >
        Kind words
      </FadeIn>

      <div className="grid gap-5 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <FadeIn
            key={t.name}
            delay={i * 0.08}
            className="flex flex-col rounded-3xl border border-white/12 bg-white/[0.04] p-6 backdrop-blur"
          >
            <div className="mb-4 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star key={s} size={15} className="fill-white/80 text-white/80" />
              ))}
            </div>
            <p data-sg-path={`testimonials[${i}].text`} className="flex-1 text-sm leading-relaxed text-white/80">{t.text}</p>
            <div className="mt-6 flex items-center gap-3">
              <img
                src={t.avatar}
                alt={t.name}
                loading="lazy"
                data-sg-img={`testimonials[${i}].avatar`}
                className="h-10 w-10 rounded-full object-cover ring-1 ring-white/15"
              />
              <div>
                <p data-sg-path={`testimonials[${i}].name`} className="text-sm font-medium text-white">{t.name}</p>
                <p data-sg-path={`testimonials[${i}].role`} className="text-xs text-white/50">{t.role}</p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
