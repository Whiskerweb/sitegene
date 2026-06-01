import { motion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const

export default function Gallery({
  images = [],
  heading = 'Through my lens',
}: {
  images?: string[]
  heading?: string
}) {
  if (!images.length) return null
  return (
    <section id="journal" className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
      <h2 className="mb-12 text-3xl font-medium text-white sm:text-4xl md:text-5xl">
        {heading}
      </h2>
      <div className="columns-2 gap-3 md:columns-4 md:gap-4">
        {images.map((src, i) => (
          <motion.div
            key={src + i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, delay: (i % 4) * 0.06, ease: EASE }}
            className="group mb-3 break-inside-avoid overflow-hidden rounded-2xl ring-1 ring-white/10 md:mb-4"
          >
            <img
              src={src}
              alt=""
              loading="lazy"
              data-sg-img={`gallery[${i}]`}
              className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ aspectRatio: i % 3 === 0 ? '3/4' : i % 3 === 1 ? '1/1' : '4/5' }}
            />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
