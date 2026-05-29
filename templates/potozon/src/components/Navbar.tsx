import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { navItems } from '../data/content'

const EASE = [0.22, 1, 0.36, 1] as const

function LogoMark() {
  // Petit losange/croix stylisé.
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 5l6 7-6 7M19 5l-6 7 6 7"
        stroke="#111111"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="relative z-50 flex items-center justify-between gap-4 py-1"
    >
      {/* Logo */}
      <a href="#about" className="flex items-center gap-1.5">
        <LogoMark />
        <span className="text-2xl font-extrabold tracking-tight text-poto-ink">
          Potozon
        </span>
      </a>

      {/* Menu desktop */}
      <div className="hidden items-center gap-8 md:flex">
        {navItems.map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase()}`}
            className="text-base font-semibold text-poto-ink transition-opacity hover:opacity-60"
          >
            {item}
          </a>
        ))}
      </div>

      {/* Hamburger (mobile) — touch target 44px */}
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="-mr-2 flex h-11 w-11 flex-col items-center justify-center gap-1.5 md:hidden"
      >
        <motion.span
          animate={open ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
          className="h-0.5 w-7 bg-poto-ink"
        />
        <motion.span
          animate={open ? { opacity: 0 } : { opacity: 1 }}
          className="h-0.5 w-7 bg-poto-ink"
        />
        <motion.span
          animate={open ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
          className="h-0.5 w-7 bg-poto-ink"
        />
      </button>

      {/* Overlay menu mobile */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="absolute left-0 right-0 top-[calc(100%+12px)] z-50 rounded-3xl border-2 border-poto-ink/10 bg-white p-3 shadow-2xl md:hidden"
          >
            <div className="flex flex-col">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[48px] items-center rounded-2xl px-4 text-lg font-bold text-poto-ink transition-colors hover:bg-poto-ink/5"
                >
                  {item}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
