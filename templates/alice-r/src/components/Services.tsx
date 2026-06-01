import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import FadeIn from './FadeIn'
import type { Service } from '../data/content'

const EASE = [0.22, 1, 0.36, 1] as const

export default function Services({ intro: servicesIntro, items: services = [] }: { intro?: string; items?: Service[] }) {
  const [active, setActive] = useState(0)
  if (!services.length) return null
  return (
    <section id="services" className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
      <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <FadeIn
          as="h2"
          className="text-3xl font-medium leading-tight text-white sm:text-4xl md:text-5xl"
        >
          Services I offer
        </FadeIn>
        <FadeIn delay={0.1} data-sg-path="servicesIntro" className="max-w-xs text-sm leading-relaxed text-white/55">
          {servicesIntro}
        </FadeIn>
      </div>

      <div className="border-t border-white/12">
        {services.map((s, i) => {
          const isOpen = active === i
          return (
            <FadeIn key={s.n} delay={i * 0.05} className="border-b border-white/12">
              <button
                onClick={() => setActive(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-5 py-7 text-left md:gap-10 md:py-8"
              >
                <span
                  data-sg-path={`services[${i}].n`}
                  className={`text-2xl font-medium tabular-nums transition-colors md:text-4xl ${
                    isOpen ? 'text-white' : 'text-white/30'
                  }`}
                >
                  {s.n}
                </span>
                <span data-sg-path={`services[${i}].name`} className="text-xl font-medium text-white sm:text-2xl md:text-3xl">
                  {s.name}
                </span>
                <span
                  className={`ml-auto h-2.5 w-2.5 shrink-0 rounded-full transition-all ${
                    isOpen ? 'scale-150 bg-white' : 'bg-white/25'
                  }`}
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
                    <div className="grid items-end gap-6 pb-9 md:grid-cols-2 md:pl-[4.4rem]">
                      <div>
                        <p data-sg-path={`services[${i}].desc`} className="max-w-md text-sm leading-relaxed text-white/65 md:text-base">
                          {s.desc}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {s.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium text-white/80"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <img
                        src={s.img}
                        alt={s.name}
                        loading="lazy"
                        data-sg-img={`services[${i}].img`}
                        className="ml-auto aspect-[16/10] w-full max-w-sm rounded-2xl object-cover ring-1 ring-white/10"
                      />
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
