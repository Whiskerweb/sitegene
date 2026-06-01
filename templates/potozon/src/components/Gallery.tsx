import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cards, textLeft, textRight, type GalleryCard } from '../data/content'

const EASE = [0.22, 1, 0.36, 1] as const

function Card({ card, delay, index }: { card: GalleryCard; delay: number; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className="relative z-0 h-[260px] w-[42vw] shrink-0 overflow-hidden rounded-[20px] sm:h-[300px] sm:w-[180px] md:h-[340px] md:w-[210px]"
      style={{
        backgroundColor: card.color,
        marginTop: card.marginTop,
        rotate: card.rotate,
      }}
    >
      <img
        src={card.img}
        data-sg-img={`cards[${index}].img`}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover mix-blend-luminosity"
      />
    </motion.div>
  )
}

export default function Gallery() {
  if (!cards || cards.length === 0) return null
  return (
    <section id="portfolio" className="relative mt-6 md:mt-10">
      {/* Rangée cartes + textes — 2×2 sur mobile (order), rangée intercalée desktop */}
      <div className="relative flex flex-wrap items-start justify-center gap-4 md:flex-nowrap md:gap-6">
        <Card card={cards[0]} delay={0.1} index={0} />

        <motion.p
          data-sg-path="textLeft"
          initial={{ opacity: 0, y: 24, rotate: -5 }}
          whileInView={{ opacity: 1, y: 0, rotate: -5 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
          className="order-first mt-2 w-full shrink-0 text-base font-medium leading-snug text-poto-ink md:order-none md:mt-6 md:w-[200px]"
        >
          {textLeft}
        </motion.p>

        <Card card={cards[1]} delay={0.25} index={1} />
        <Card card={cards[2]} delay={0.35} index={2} />

        <motion.div
          initial={{ opacity: 0, y: 24, rotate: -4 }}
          whileInView={{ opacity: 1, y: 0, rotate: -4 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
          className="order-last mt-2 w-full shrink-0 md:order-none md:mt-6 md:w-[220px]"
        >
          <p data-sg-path="textRight.body" className="text-base font-medium leading-snug text-poto-ink">
            {textRight.body}
          </p>
          <a
            href="#projects"
            className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-sm font-bold tracking-wide text-poto-ink transition-colors hover:text-poto-orange"
          >
            <span data-sg-path="textRight.cta">{textRight.cta}</span>
            <ArrowRight size={16} />
          </a>
        </motion.div>

        <Card card={cards[3]} delay={0.5} index={3} />

        {/* Texte contour « ourGallery » — PAR-DESSUS les cartes */}
        <span className="outline-text pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[20vw] font-extrabold leading-none tracking-tight md:top-[56%] md:text-[18vw]">
          ourGallery
        </span>
      </div>
    </section>
  )
}
