import { motion } from 'framer-motion'
import Navbar from './Navbar'
import PhotoArc from './PhotoArc'
import { hero, features, arcPhotos } from '../data/content'

const EASE = [0.22, 1, 0.36, 1] as const

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[640px] flex-col overflow-hidden md:h-screen"
    >
      {/* Traînée arc-en-ciel diffuse (scopée au hero) */}
      <div className="rainbow-streak" />

      <Navbar />

      {/* Zone centrale : dôme de photos AU-DESSUS du texte, l'ensemble centré */}
      <div className="relative flex flex-1 flex-col items-center justify-center">
        <PhotoArc />

        {/* Contenu central — ancré (desktop) pour tomber au centre du cercle */}
        <div className="relative z-20 flex flex-col items-center px-6 py-10 text-center md:absolute md:bottom-[26%] md:left-[48%] md:w-[720px] md:max-w-[88vw] md:-translate-x-1/2 md:px-0 md:py-0">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
            className="max-w-3xl text-4xl font-medium leading-[1.1] text-white sm:text-5xl md:text-6xl"
          >
            {hero.title[0]}
            <br />
            {hero.title[1]}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
            className="mt-5 max-w-md text-sm font-normal leading-relaxed text-white/70 md:text-base"
          >
            {hero.subtitle}
          </motion.p>

          <motion.a
            href="#contact"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65, ease: EASE }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="mt-9 inline-flex min-h-[48px] items-center rounded-full border border-white/40 px-9 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/10 md:text-base"
          >
            {hero.cta}
          </motion.a>

          {/* Galerie mobile (l'arc est masqué) */}
          <div className="mt-10 grid grid-cols-3 gap-2.5 md:hidden">
            {arcPhotos.slice(0, 6).map((p) => (
              <div
                key={p.img}
                className="aspect-square overflow-hidden rounded-2xl ring-1 ring-white/10"
              >
                <img src={p.img} alt="" loading="lazy" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features (en bas ; absolu sur desktop pour centrer le rond sur le viewport) */}
      <div className="relative z-20 px-6 pb-10 md:absolute md:inset-x-0 md:bottom-0 md:px-10 md:pb-12">
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-0">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 + i * 0.1, ease: EASE }}
              className={`px-6 text-center ${i > 0 ? 'sm:border-l sm:border-white/15' : ''}`}
            >
              <h3 className="text-lg font-medium text-white">{f.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-white/55 md:text-sm">
                {f.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
