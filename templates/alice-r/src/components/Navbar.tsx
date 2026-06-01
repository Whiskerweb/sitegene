import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSite } from '../site/PageContext'
import { Link } from '../site/router'

const EASE = [0.22, 1, 0.36, 1] as const

export default function Navbar() {
  const { brand, nav = [] } = useSite()
  const [open, setOpen] = useState(false)

  return (
    <nav className="relative z-40 flex items-center justify-between px-6 py-6 md:absolute md:inset-x-0 md:top-0 md:px-10">
      <Link
        to="/"
        data-sg-path="hero.brand"
        data-sg-edit="panel"
        className="text-xl font-medium tracking-tight text-white/90"
      >
        {brand}
      </Link>

      {/* Menu desktop — liens internes + menus déroulants (children) */}
      <ul className="hidden items-center gap-9 md:flex">
        {nav.map((item) => (
          <li key={item.label} className="group relative">
            {item.to ? (
              <Link
                to={item.to}
                className="text-sm font-medium text-white/75 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ) : (
              <span className="cursor-default text-sm font-medium text-white/75 transition-colors group-hover:text-white">
                {item.label}
              </span>
            )}
            {item.children?.length ? (
              <ul className="absolute left-1/2 top-full hidden min-w-[180px] -translate-x-1/2 rounded-2xl border border-white/15 bg-[#1a1108]/95 p-2 shadow-2xl backdrop-blur-md group-hover:block">
                {item.children.map((c) => (
                  <li key={c.label}>
                    <Link
                      to={c.to!}
                      className="flex min-h-[40px] items-center rounded-xl px-4 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>

      {/* Hamburger (mobile) — touch target 44px */}
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="-mr-2 flex h-11 w-11 flex-col items-center justify-center gap-1.5 text-white/90 md:hidden"
      >
        <motion.span
          animate={open ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
          className="h-0.5 w-6 bg-white"
        />
        <motion.span
          animate={open ? { opacity: 0 } : { opacity: 1 }}
          className="h-0.5 w-6 bg-white"
        />
        <motion.span
          animate={open ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
          className="h-0.5 w-6 bg-white"
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
            className="absolute inset-x-4 top-[calc(100%+8px)] z-40 rounded-3xl border border-white/15 bg-[#1a1108]/95 p-3 shadow-2xl backdrop-blur-md md:hidden"
          >
            <div className="flex flex-col">
              {nav.flatMap((item) => {
                const links = item.to
                  ? [{ label: item.label, to: item.to }]
                  : []
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
                  className="flex min-h-[48px] items-center rounded-2xl px-4 text-base font-medium text-white/85 transition-colors hover:bg-white/5"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
