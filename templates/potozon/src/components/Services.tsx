import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import FadeIn from './FadeIn'
import type { Service } from '../data/content'

const EASE = [0.22, 1, 0.36, 1] as const
const TAG_COLORS = ['#E5412A', '#FFC400', '#8B7CF6']

export default function Services({
  intro: servicesIntro = '',
  items: services = [],
}: {
  intro?: string
  items?: Service[]
}) {
  const [active, setActive] = useState(0)
  if (!services.length) return null
  return (
    <section id="studio" className="mx-auto max-w-6xl py-20 md:py-28">
      <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <FadeIn
          as="h2"
          className="flex items-center gap-3 text-4xl font-extrabold tracking-tight text-poto-ink md:text-6xl"
        >
          <span className="h-3.5 w-3.5 rounded-sm bg-poto-red" />
          Services we offer
        </FadeIn>
        <FadeIn delay={0.1} data-sg-path="servicesIntro" className="max-w-xs text-sm font-medium text-poto-ink/65">
          {servicesIntro}
        </FadeIn>
      </div>

      <div>
        {services.map((s, i) => {
          const isOpen = active === i
          return (
            <FadeIn key={s.n} delay={i * 0.05} className="border-b-2 border-poto-ink/10">
              <button
                onClick={() => setActive(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="flex w-full cursor-pointer items-center gap-5 py-7 text-left md:gap-10 md:py-8"
              >
                <span
                  data-sg-path={`services[${i}].n`}
                  className="text-3xl font-extrabold tabular-nums transition-colors md:text-5xl"
                  style={{
                    color: 'transparent',
                    WebkitTextStroke: isOpen ? `2px ${s.color}` : '2px rgba(17,17,17,0.25)',
                  }}
                >
                  {s.n}
                </span>
                <span data-sg-path={`services[${i}].name`} className="text-2xl font-extrabold tracking-tight text-poto-ink md:text-4xl">
                  {s.name}
                </span>
                <span
                  className="ml-auto h-3 w-3 shrink-0 rounded-full transition-transform"
                  style={{
                    backgroundColor: isOpen ? s.color : 'rgba(17,17,17,0.15)',
                    transform: isOpen ? 'scale(1.4)' : 'scale(1)',
                  }}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <div className="grid items-end gap-6 pb-9 pl-[3.6rem] md:grid-cols-2 md:pl-[6.4rem]">
                      <div>
                        <p data-sg-path={`services[${i}].desc`} className="max-w-md text-base font-medium leading-relaxed text-poto-ink/75">
                          {s.desc}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {s.tags.map((t, ti) => (
                            <span
                              key={t}
                              className="rounded-full px-4 py-1.5 text-xs font-bold text-white"
                              style={{ backgroundColor: TAG_COLORS[ti % TAG_COLORS.length] }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div
                        className="ml-auto w-full max-w-sm overflow-hidden rounded-2xl"
                        style={{ backgroundColor: s.color }}
                      >
                        <img
                          src={s.img}
                          data-sg-img={`services[${i}].img`}
                          alt={s.name}
                          className="aspect-[16/10] w-full object-cover mix-blend-luminosity"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </FadeIn>
          )
        })}
      </div>
    </section>
  )
}
