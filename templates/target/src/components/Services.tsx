import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import FadeIn from './FadeIn'
import { services, servicesIntro } from '../data/content'

export default function Services() {
  const [active, setActive] = useState(4) // 05 ouvert par défaut (comme l'original)
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28">
      <div className="mb-14 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <FadeIn as="h2" className="tg-head flex items-center gap-3 text-4xl font-bold md:text-6xl">
          <span className="h-3 w-3 rounded-sm bg-tg-accent" />
          Services I offer
        </FadeIn>
        <FadeIn delay={0.1} className="max-w-xs text-sm text-tg-mut" data-sg-path="servicesIntro">
          {servicesIntro}
        </FadeIn>
      </div>

      <div>
        {services.map((s, i) => {
          const isOpen = active === i
          return (
            <FadeIn key={s.n} delay={i * 0.05} className="border-b border-tg-line">
              <button
                onClick={() => setActive(isOpen ? -1 : i)}
                className="flex w-full items-center gap-5 py-7 text-left md:gap-10 md:py-9"
              >
                <span
                  data-sg-path={`services[${i}].n`}
                  className={`tg-head text-3xl font-bold tabular-nums transition-colors md:text-5xl ${isOpen ? 'text-tg-accent' : 'text-tg-ink/20'}`}
                >
                  {s.n}
                </span>
                <span data-sg-path={`services[${i}].name`} className="tg-head text-2xl font-medium md:text-4xl">{s.name}</span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="grid items-end gap-6 pb-9 pl-[3.6rem] md:grid-cols-2 md:pl-[6.2rem]">
                      <div>
                        <p data-sg-path={`services[${i}].desc`} className="max-w-md text-sm leading-relaxed text-tg-mut">{s.desc}</p>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {s.tags.map((t) => (
                            <span key={t} className="rounded-full bg-tg-ink px-4 py-1.5 text-xs font-medium text-white">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <img src={s.img} alt={s.name} data-sg-img={`services[${i}].img`} className="ml-auto aspect-[16/10] w-full max-w-sm rounded-2xl object-cover" />
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
