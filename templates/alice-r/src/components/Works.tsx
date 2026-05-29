import FadeIn from './FadeIn'
import { works } from '../data/content'

export default function Works() {
  return (
    <section id="work" className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
      <FadeIn
        as="h2"
        className="mb-12 text-3xl font-medium leading-tight text-white sm:text-4xl md:text-5xl"
      >
        Selected work
      </FadeIn>

      <div className="grid gap-8 sm:grid-cols-2">
        {works.map((w, i) => (
          <FadeIn key={w.title} delay={(i % 2) * 0.1} className="group">
            <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/10">
              <img
                src={w.img}
                alt={w.title}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                {w.category}
              </span>
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/45">{w.date}</p>
            <h3 className="mt-1.5 text-2xl font-medium text-white">{w.title}</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/60">{w.desc}</p>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
