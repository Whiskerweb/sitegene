import { motion } from 'framer-motion'
import FadeIn from './FadeIn'
import { gallery } from '../data/content'

const EASE = [0.22, 1, 0.36, 1] as const

export default function Gallery() {
  return (
    <section id="gallery" className="mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28">
      <FadeIn as="h2" className="tg-head mb-12 text-4xl font-bold md:text-6xl">
        See Through My Lens
      </FadeIn>
      <div className="columns-2 gap-4 md:columns-4">
        {gallery.map((src, i) => (
          <motion.div
            key={src + i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, delay: (i % 4) * 0.06, ease: EASE }}
            className="group mb-4 break-inside-avoid overflow-hidden rounded-xl"
          >
            <img
              src={src}
              alt=""
              className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ aspectRatio: i % 3 === 0 ? '3/4' : i % 3 === 1 ? '1/1' : '4/5' }}
            />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
