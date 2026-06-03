import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Star, StarHalf } from 'lucide-react'
import type { Testimonial } from '../data/content'

const EASE = [0.22, 1, 0.36, 1] as const

function Stars({ rating }: { rating: string }) {
  const value = parseFloat(rating)
  const full = Math.floor(value)
  const half = value - full >= 0.5
  return (
    <div className="flex items-center gap-2 text-sm text-white/80">
      <span>{rating}</span>
      <div className="flex gap-0.5 text-tg-accent">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={i} size={16} className="fill-tg-accent" />
        ))}
        {half && <StarHalf size={16} className="fill-tg-accent" />}
      </div>
    </div>
  )
}

export default function Testimonials({ items = [] }: { items?: Testimonial[] }) {
  const testimonials = items
  const [i, setI] = useState(0)
  if (!testimonials || testimonials.length === 0) return null
  const idx = i % testimonials.length
  const go = (dir: number) => setI((p) => (p + dir + testimonials.length) % testimonials.length)
  const t = testimonials[idx]

  return (
    <section className="bg-tg-dark py-20 text-white md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-10">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="tg-head mb-12 text-4xl font-bold md:text-6xl"
        >
          Don’t Trust Me, Trust Them
        </motion.h2>

        <div className="grid gap-8 md:grid-cols-[0.9fr_1.4fr] md:items-end">
          {/* Avatar + nav */}
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <img src={t.avatar} alt={t.name} data-sg-img={`testimonials[${idx}].avatar`} className="h-12 w-12 rounded-lg object-cover" />
              <div>
                <p className="text-sm font-semibold" data-sg-path={`testimonials[${idx}].name`}>{t.name}</p>
                <p className="text-sm text-white/55" data-sg-path={`testimonials[${idx}].role`}>{t.role}</p>
              </div>
            </div>
            {testimonials.length > 1 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => go(-1)}
                  aria-label="Previous testimonial"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 transition-colors hover:bg-white/10"
                >
                  <ArrowLeft size={18} />
                </button>
                <button
                  onClick={() => go(1)}
                  aria-label="Next testimonial"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 transition-colors hover:bg-white/10"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Grande citation */}
          <div className="relative min-h-[220px] md:min-h-[200px]">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="tg-head text-2xl font-medium leading-[1.3] md:text-4xl"
              >
                “<span data-sg-path={`testimonials[${idx}].text`}>{t.text}</span>”
                <div className="mt-6">
                  <Stars rating={t.rating} />
                </div>
              </motion.blockquote>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
