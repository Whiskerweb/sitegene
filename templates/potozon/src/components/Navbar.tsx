import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSite } from '../site/PageContext'
import { Link } from '../site/router'

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
  const { brand, nav = [] } = useSite()
  const [open, setOpen] = useState(false)

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="relative z-50 flex items-center justify-between gap-4 py-1"
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-1.5">
        <LogoMark />
        <span className="text-2xl font-extrabold tracking-tight text-poto-ink">
          <span data-sg-path="brand" data-sg-edit="panel">{brand}</span>
        </span>
      </Link>

      {/* Menu desktop — liens internes + menus déroulants (children) */}
      <div className="hidden items-center gap-8 md:flex">
        {nav.map((item) => (
          <div key={item.label} className="group relative">
            {item.to ? (
              <Link
                to={item.to}
                className="text-base font-semibold text-poto-ink transition-opacity hover:opacity-60"
              >
                {item.label}
              </Link>
            ) : (
              <span className="cursor-default text-base font-semibold text-poto-ink transition-opacity group-hover:opacity-60">
                {item.label}
              </span>
            )}
            {item.children?.length ? (
              <div className="absolute left-1/2 top-full hidden min-w-[180px] -translate-x-1/2 rounded-2xl border-2 border-poto-ink/10 bg-white p-2 shadow-2xl group-hover:block">
                {item.children.map((c) => (
                  <Link
                    key={c.label}
                    to={c.to!}
                    className="flex min-h-[40px] items-center rounded-xl px-4 text-sm font-bold text-poto-ink transition-colors hover:bg-poto-ink/5"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
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
              {nav.flatMap((item) => {
                const links = item.to ? [{ label: item.label, to: item.to }] : []
                const children = (item.children ?? []).map((c) => ({
                  label: c.label,
                  to: c.to!,
                }))
                return [...links, ...children]
              }).map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[48px] items-center rounded-2xl px-4 text-lg font-bold text-poto-ink transition-colors hover:bg-poto-ink/5"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
