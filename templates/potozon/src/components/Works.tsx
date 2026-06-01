import FadeIn from './FadeIn'
import type { Work } from '../data/content'

export default function Works({ items: works = [] }: { items?: Work[] }) {
  if (!works || works.length === 0) return null
  return (
    <section id="projects" className="mx-auto max-w-6xl py-20 md:py-28">
      <FadeIn
        as="h2"
        className="mb-12 flex items-center gap-3 text-4xl font-extrabold tracking-tight text-poto-ink md:text-6xl"
      >
        Selected works
        <span className="h-3.5 w-3.5 rounded-sm bg-poto-yellow" />
      </FadeIn>

      <div className="grid gap-8 sm:grid-cols-2">
        {works.map((w, i) => (
          <FadeIn key={w.title} delay={(i % 2) * 0.1} className="group">
            <div
              className="relative overflow-hidden rounded-[20px]"
              style={{ backgroundColor: w.color }}
            >
              <img
                src={w.img}
                data-sg-img={`works[${i}].img`}
                alt={w.title}
                className="aspect-[4/3] w-full object-cover mix-blend-luminosity transition-transform duration-700 group-hover:scale-105"
              />
              <span data-sg-path={`works[${i}].category`} className="absolute left-4 top-4 rounded-full bg-poto-ink px-3 py-1 text-xs font-bold text-white">
                {w.category}
              </span>
            </div>
            <p data-sg-path={`works[${i}].date`} className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-poto-ink/55">
              {w.date}
            </p>
            <h3 data-sg-path={`works[${i}].title`} className="mt-1 text-2xl font-extrabold tracking-tight text-poto-ink">
              {w.title}
            </h3>
            <p data-sg-path={`works[${i}].desc`} className="mt-2 max-w-md text-sm font-medium leading-relaxed text-poto-ink/70">
              {w.desc}
            </p>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
