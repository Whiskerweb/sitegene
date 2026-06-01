import { motion } from 'framer-motion'
import { hero } from '../data/content'

const EASE = [0.22, 1, 0.36, 1] as const

function Sparkle() {
  // Astérisque/étincelle jaune à 4 branches.
  return (
    <svg viewBox="0 0 24 24" fill="#FFC400" className="h-full w-full" aria-hidden>
      <path d="M12 0C12 6 6 12 0 12c6 0 12 6 12 12 0-6 6-12 12-12-6 0-12-6-12-12z" />
    </svg>
  )
}

const titleClass =
  'text-center text-[15vw] font-extrabold leading-[0.92] tracking-tighter text-poto-ink md:text-left md:text-[12vw] md:leading-[0.9] lg:text-[10.5vw]'

export default function Hero() {
  return (
    <section id="about" className="relative pt-6 md:pt-10">
      {/* Ligne 1 */}
      <div className="relative">
        <motion.h1
          data-sg-path="hero.line1"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
          className={titleClass}
        >
          {hero.line1}
        </motion.h1>

        {/* Sticker « A new dimension » — desktop : à cheval sur le titre */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: -3 }}
          transition={{ duration: 0.55, delay: 0.45, ease: EASE }}
          className="absolute right-2 top-1/2 hidden -translate-y-1/2 md:block"
        >
          <div className="relative">
            <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl border-2 border-dashed border-poto-purple/40" />
            <div className="relative overflow-hidden rounded-3xl bg-poto-purple px-8 py-5 shadow-xl">
              <span className="text-3xl font-extrabold text-white lg:text-4xl">
                <span data-sg-path="hero.sticker" data-sg-edit="panel">{hero.sticker}</span>
              </span>
              <div className="pointer-events-none absolute -bottom-px -right-px h-9 w-9 rounded-tl-2xl bg-[#fcfcfc] shadow-[-3px_-3px_6px_rgba(0,0,0,0.12)]" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Ligne 2 */}
      <div className="relative md:-mt-2">
        <motion.h1
          data-sg-path="hero.line2"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
          className={titleClass}
        >
          {hero.line2}
        </motion.h1>

        {/* Ruban « BEAUTIFULL » — desktop uniquement (cachait le titre sur mobile) */}
        <motion.div
          initial={{ opacity: 0, rotate: -8 }}
          animate={{ opacity: 1, rotate: -4 }}
          transition={{ duration: 0.5, delay: 0.6, ease: EASE }}
          className="absolute left-[24%] top-1/2 hidden -translate-y-1/2 rounded-full bg-poto-orange px-5 py-1.5 shadow-md md:block"
        >
          <span data-sg-path="hero.ribbon" className="text-sm font-bold uppercase tracking-widest text-white md:text-base">
            {hero.ribbon}
          </span>
        </motion.div>

        {/* Astérisque jaune — desktop uniquement */}
        <motion.div
          initial={{ opacity: 0, scale: 0, rotate: -90 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease: EASE }}
          className="absolute right-[12%] top-1/2 hidden h-[7vw] w-[7vw] max-h-20 max-w-20 -translate-y-1/2 md:block"
        >
          <Sparkle />
        </motion.div>
      </div>

      {/* Bloc mobile uniquement : badge + sous-titre, centrés et lisibles */}
      <div className="mt-5 flex flex-col items-center gap-4 md:hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: -3 }}
          transition={{ duration: 0.5, delay: 0.4, ease: EASE }}
          className="rounded-2xl bg-poto-purple px-5 py-2.5 shadow-lg"
        >
          <span className="text-lg font-extrabold text-white"><span data-sg-path="hero.sticker" data-sg-edit="panel">{hero.sticker}</span></span>
        </motion.div>

        <motion.p
          data-sg-path="hero.subtitle"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
          className="max-w-xs text-center text-base font-medium leading-snug text-poto-ink/80"
        >
          {hero.subtitle}
        </motion.p>
      </div>
    </section>
  )
}
