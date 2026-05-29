import { Star } from 'lucide-react'
import FadeIn from './FadeIn'
import { testimonials } from '../data/content'

export default function Testimonials() {
  if (!testimonials || testimonials.length === 0) return null
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28">
      <FadeIn as="h2" className="tg-head mb-12 text-4xl font-bold md:text-6xl">
        Don’t Trust Me, Trust Them
      </FadeIn>
      <div className="grid gap-5 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <FadeIn
            key={t.name}
            delay={i * 0.08}
            className="flex flex-col rounded-2xl border border-tg-line bg-tg-card p-6"
          >
            <div className="mb-4 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star key={s} size={15} className="fill-tg-accent text-tg-accent" />
              ))}
            </div>
            <p className="flex-1 text-sm leading-relaxed text-tg-ink/85">{t.text}</p>
            <div className="mt-6 flex items-center gap-3">
              <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-tg-mut">{t.role}</p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
