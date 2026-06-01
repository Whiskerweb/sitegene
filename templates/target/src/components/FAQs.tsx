import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import FadeIn from './FadeIn'
import type { Faq } from '../data/content'

export default function FAQs({ items = [] }: { items?: Faq[] }) {
  const faqs = items
  const [open, setOpen] = useState<number | null>(0)
  if (!faqs || faqs.length === 0) return null
  return (
    <section className="mx-auto max-w-3xl px-5 py-20 md:py-28">
      <FadeIn as="h2" className="tg-head mb-12 text-center text-4xl font-bold md:text-6xl">
        FAQs
      </FadeIn>
      <div className="divide-y divide-tg-line border-y border-tg-line">
        {faqs.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={f.q}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span data-sg-path={`faqs[${i}].q`} className="tg-head text-lg font-medium md:text-xl">{f.q}</span>
                <Plus
                  size={22}
                  className={`shrink-0 text-tg-mut transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p data-sg-path={`faqs[${i}].a`} className="pb-5 pr-8 text-sm leading-relaxed text-tg-mut">{f.a}</p>
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
