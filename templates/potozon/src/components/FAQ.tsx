import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import FadeIn from './FadeIn'
import { faqs } from '../data/content'

const EASE = [0.22, 1, 0.36, 1] as const

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  if (!faqs || faqs.length === 0) return null
  return (
    <section className="mx-auto max-w-3xl py-20 md:py-28">
      <FadeIn
        as="h2"
        className="mb-12 text-center text-4xl font-extrabold tracking-tight text-poto-ink md:text-6xl"
      >
        FAQ
      </FadeIn>

      <div className="border-y-2 border-poto-ink/10">
        {faqs.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={f.q} className="border-b-2 border-poto-ink/10 last:border-b-0">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left"
              >
                <span data-sg-path={`faqs[${i}].q`} className="text-lg font-bold text-poto-ink md:text-xl">{f.q}</span>
                <Plus
                  size={22}
                  className={`shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-45 text-poto-orange' : 'text-poto-ink/40'
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <p data-sg-path={`faqs[${i}].a`} className="pb-5 pr-8 text-base font-medium leading-relaxed text-poto-ink/70">
                      {f.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </section>
  )
}
