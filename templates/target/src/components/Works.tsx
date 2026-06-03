import FadeIn from './FadeIn'
import type { Work } from '../data/content'

export default function Works({ items = [] }: { items?: Work[] }) {
  const works = items
  if (!works || works.length === 0) return null
  return (
    <section id="works" className="mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28">
      <FadeIn as="h2" className="tg-head mb-12 text-4xl font-bold md:text-6xl">
        My Works
      </FadeIn>
      <div className="grid gap-8 sm:grid-cols-2">
        {works.map((w, i) => (
          <FadeIn key={w.title} delay={(i % 2) * 0.1} className="group">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <img
                src={w.img}
                alt={w.title}
                data-sg-img={`works[${i}].img`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span data-sg-path={`works[${i}].date`} className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-tg-ink shadow-sm">
                {w.date}
              </span>
            </div>
            <span data-sg-path={`works[${i}].category`} className="mt-4 inline-flex rounded-full bg-tg-ink/5 px-3 py-1 text-xs font-medium text-tg-mut">
              {w.category}
            </span>
            <h3 data-sg-path={`works[${i}].title`} className="tg-head mt-3 text-2xl font-medium">{w.title}</h3>
            <p data-sg-path={`works[${i}].desc`} className="mt-2 max-w-md text-sm leading-relaxed text-tg-mut">{w.desc}</p>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
