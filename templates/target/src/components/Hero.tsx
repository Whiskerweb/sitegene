import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { hero, nav, navAnchors } from '../data/content'

const EASE = [0.22, 1, 0.36, 1] as const

export default function Hero() {
  return (
    <section className="relative h-screen min-h-[640px] w-full overflow-hidden bg-tg-dark text-white md:min-h-[720px]">
      {/* Portrait motion-blur + voiles */}
      <img src="img/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div
        className="absolute inset-0 mix-blend-color opacity-90"
        style={{ background: 'linear-gradient(105deg, rgba(255,90,0,.6) 0%, rgba(255,0,90,.3) 40%, rgba(0,190,255,.45) 72%, rgba(0,255,170,.4) 100%)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-tg-dark via-transparent to-tg-dark/40" />

      <div className="relative z-10 flex h-full flex-col px-5 py-5 md:px-10 md:py-7">
        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="relative flex items-start justify-between"
        >
          {/* email/phone : desktop uniquement (évite le chevauchement avec ✦ TARGET) */}
          <div className="hidden text-[11px] leading-tight text-white/85 md:block md:text-sm">
            <p>{hero.email}</p>
            <p>{hero.phone}</p>
          </div>
          <span className="tg-head left-1/2 -translate-x-1/2 text-sm font-bold tracking-[0.2em] max-md:mx-auto md:absolute md:text-lg md:tracking-[0.25em]">✦ TARGET</span>
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium">{hero.role}</p>
            <p className="mb-5 text-sm text-white/70">{hero.location}</p>
            <div className="hidden flex-col items-end gap-3 md:flex">
              {nav.map((n, i) => (
                <a key={n} href={navAnchors[i] ?? '#contact'} className="text-sm font-medium uppercase tracking-wide underline underline-offset-4 transition-opacity hover:opacity-70">
                  {n}
                </a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ---------- MOBILE : contenu centré, hiérarchie nette ---------- */}
        <div className="flex flex-1 flex-col items-center justify-center text-center md:hidden">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
            className="w-36 overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-1.5 backdrop-blur"
          >
            <img src={hero.recentWork} alt="" className="h-24 w-full rounded-xl object-cover" />
            <p className="px-1 py-1 text-[11px] text-white/85">Recent Work</p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
            className="tg-head mt-7 text-2xl font-medium"
          >
            {hero.tagline}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: EASE }}
            className="tg-head font-bold uppercase leading-[0.9] tracking-tighter text-white"
            style={{ fontSize: 'clamp(2rem, 10.5vw, 4rem)' }}
          >
            {hero.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-5 max-w-xs text-sm leading-snug text-white/85"
          >
            {hero.blurb}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7, ease: EASE }}
            className="mt-7 flex items-center gap-6"
          >
            {hero.socials.map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-sm text-white/85 transition-opacity hover:opacity-70">
                <ArrowUpRight size={15} /> {s}
              </span>
            ))}
          </motion.div>
        </div>

        {/* ---------- DESKTOP : layout original (inchangé) ---------- */}
        <div className="hidden md:flex md:h-full md:flex-col">
          {/* Recent Work vignette */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: EASE }}
            className="mt-6 w-40 overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-1.5 backdrop-blur"
          >
            <img src={hero.recentWork} alt="" className="h-28 w-full rounded-xl object-cover" />
            <p className="px-1 py-1.5 text-xs text-white/85">Recent Work</p>
          </motion.div>

          {/* Blurb */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 max-w-xs self-start text-sm leading-snug text-white/90 md:ml-[42%]"
          >
            {hero.blurb}
          </motion.p>

          {/* Bas : titre */}
          <div className="mt-auto">
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
              className="tg-head mb-1 text-3xl font-medium md:text-5xl"
            >
              {hero.tagline}
            </motion.p>
            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: '108%' }} animate={{ y: 0 }}
                transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
                className="tg-head font-bold uppercase leading-[0.8] tracking-tighter text-white"
                style={{ fontSize: 'clamp(2.4rem, 11.5vw, 16rem)' }}
              >
                {hero.title}
              </motion.h1>
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div className="flex flex-col gap-1.5">
                {hero.socials.map((s) => (
                  <span key={s} className="flex items-center gap-1.5 text-sm text-white/85 transition-opacity hover:opacity-70">
                    <ArrowUpRight size={15} /> {s}
                  </span>
                ))}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">🏆 {hero.badge}</p>
                <p className="text-xs text-white/60">{hero.badgeYears}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
