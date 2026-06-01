import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import FadeIn from './FadeIn'
import type { Faq } from '../data/content'

const EASE = [0.22, 1, 0.36, 1] as const

export default function FAQ({ items: faqs = [] }: { items?: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0)
  if (!faqs || faqs.length === 0) return null
  return (
    <section className="relative z-10 mx-auto max-w-3xl px-6 py-20 md:py-28">
      <FadeIn
        as="h2"
        className="mb-12 text-center text-3xl font-medium text-white sm:text-4xl md:text-5xl"
      >
        Frequently asked
      </FadeIn>

      <div className="border-t border-white/12">
        {faqs.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={f.q} className="border-b border-white/12">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span data-sg-path={`faqs[${i}].q`} className="text-base font-medium text-white md:text-lg">{f.q}</span>
                <Plus
                  size={22}
                  className={`shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-45 text-white' : 'text-white/40'
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
                    <p data-sg-path={`faqs[${i}].a`} className="pb-5 pr-8 text-sm leading-relaxed text-white/60">{f.a}</p>
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
