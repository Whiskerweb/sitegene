import FadeIn from './FadeIn'
import { works } from '../data/content'

export default function Works() {
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
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-xs backdrop-blur">
                {w.category}
              </span>
            </div>
            <p className="mt-4 text-xs uppercase tracking-widest text-tg-mut">{w.date}</p>
            <h3 className="tg-head mt-1 text-2xl font-medium">{w.title}</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-tg-mut">{w.desc}</p>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
