import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

// Titre « PHOTOGRAPHER » : certaines lettres prennent une teinte spectrale
// (comme la réf. target.framer.media où le titre capte les couleurs du fond).
const TINT = '#5ad7ff'
function HeroTitle({ word, from = 4, to = 8 }: { word: string; from?: number; to?: number }) {
  return (
    <>
      {word.split('').map((c, i) => (
        <span key={i} style={i >= from && i < to ? { color: TINT } : undefined}>
          {c}
        </span>
      ))}
    </>
  )
}

interface HeroData {
  tagline: string
  title: string
  blurb: string
  email: string
  phone: string
  role: string
  location: string
  recentWork: string
  badge: string
  badgeYears: string
  socials: string[]
}

export default function Hero({ data }: { data: HeroData }) {
  const hero = data
  return (
    <section className="relative h-screen min-h-[640px] w-full overflow-hidden bg-tg-dark text-white md:min-h-[720px]">
      {/* Portrait motion-blur + voiles spectrales (réf : rainbow blur très saturé) */}
      <img src="img/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter: 'saturate(1.15) contrast(1.05)' }} />
      <div
        className="absolute inset-0 mix-blend-color"
        style={{ background: 'linear-gradient(100deg, rgba(255,80,0,.85) 0%, rgba(255,0,110,.55) 32%, rgba(150,0,255,.4) 52%, rgba(0,180,255,.7) 74%, rgba(0,255,170,.65) 100%)' }}
      />
      <div
        className="absolute inset-0 mix-blend-screen opacity-50"
        style={{ background: 'linear-gradient(100deg, rgba(255,120,0,.5) 0%, transparent 40%, rgba(0,200,255,.45) 80%, rgba(0,255,180,.4) 100%)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-tg-dark via-transparent to-tg-dark/40" />

      <div className="relative z-10 flex h-full flex-col px-5 py-5 md:px-10 md:py-7">
        {/* Top bar — coordonnées (la navigation est gérée par la Navbar globale) */}
        <motion.div
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="relative flex items-start justify-between pt-14 md:pt-16"
        >
          <div className="hidden text-[11px] leading-tight text-white/85 md:block md:text-sm">
            <p><span data-sg-path="hero.email" data-sg-edit="panel">{hero.email}</span></p>
            <p><span data-sg-path="hero.phone" data-sg-edit="panel">{hero.phone}</span></p>
          </div>
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium"><span data-sg-path="hero.role" data-sg-edit="panel">{hero.role}</span></p>
            <p className="text-sm text-white/70"><span data-sg-path="hero.location" data-sg-edit="panel">{hero.location}</span></p>
          </div>
        </motion.div>

        {/* ---------- MOBILE : contenu centré, hiérarchie nette ---------- */}
        <div className="flex flex-1 flex-col items-center justify-center text-center md:hidden">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
            className="w-36 overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-1.5 backdrop-blur"
          >
            <img src={hero.recentWork} alt="" data-sg-img="hero.recentWork" className="h-24 w-full rounded-xl object-cover" />
            <p className="px-1 py-1 text-[11px] text-white/85">Recent Work</p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
            className="tg-head mt-7 text-2xl font-medium"
          >
            <span data-sg-path="hero.tagline" data-sg-edit="panel">{hero.tagline}</span>
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: EASE }}
            className="tg-head font-bold uppercase leading-[0.9] tracking-tighter text-white"
            style={{ fontSize: 'clamp(2rem, 10.5vw, 4rem)' }}
          >
            <span data-sg-path="hero.title" data-sg-edit="panel"><HeroTitle word={hero.title} /></span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-5 max-w-xs text-sm leading-snug text-white/85"
          >
            <span data-sg-path="hero.blurb" data-sg-edit="panel">{hero.blurb}</span>
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

        {/* ---------- DESKTOP : layout original ---------- */}
        <div className="hidden md:flex md:h-full md:flex-col">
          {/* Recent Work vignette */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: EASE }}
            className="mt-6 w-40 overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-1.5 backdrop-blur"
          >
            <img src={hero.recentWork} alt="" data-sg-img="hero.recentWork" className="h-28 w-full rounded-xl object-cover" />
            <p className="px-1 py-1.5 text-xs text-white/85">Recent Work</p>
          </motion.div>

          {/* Blurb */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 max-w-xs self-start text-sm leading-snug text-white/90 md:ml-[42%]"
          >
            <span data-sg-path="hero.blurb" data-sg-edit="panel">{hero.blurb}</span>
          </motion.p>

          {/* Bas : titre */}
          <div className="mt-auto">
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
              className="tg-head mb-1 text-3xl font-medium md:text-5xl"
            >
              <span data-sg-path="hero.tagline" data-sg-edit="panel">{hero.tagline}</span>
            </motion.p>
            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: '108%' }} animate={{ y: 0 }}
                transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
                className="tg-head font-bold uppercase leading-[0.8] tracking-tighter text-white"
                style={{ fontSize: 'clamp(2.4rem, 11.5vw, 16rem)' }}
              >
                <span data-sg-path="hero.title" data-sg-edit="panel"><HeroTitle word={hero.title} /></span>
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
                <p className="text-sm font-medium">🏆 <span data-sg-path="hero.badge" data-sg-edit="panel">{hero.badge}</span></p>
                <p className="text-xs text-white/60"><span data-sg-path="hero.badgeYears" data-sg-edit="panel">{hero.badgeYears}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
