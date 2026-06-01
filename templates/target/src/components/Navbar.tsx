import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSite } from '../site/PageContext'
import { Link } from '../site/router'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Navbar éditoriale Target. `overlay` = posée par-dessus le hero sombre (home) :
 * texte clair, fond transparent. Sinon : sticky clair sur le fond crème.
 */
export default function Navbar({ overlay = false }: { overlay?: boolean }) {
  const { brand, nav = [] } = useSite()
  const [open, setOpen] = useState(false)

  const tone = overlay ? 'text-white' : 'text-tg-ink'
  const wrap = overlay
    ? 'absolute inset-x-0 top-0 z-50'
    : 'sticky top-0 z-50 border-b border-tg-line bg-tg-bg/85 backdrop-blur'

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={wrap}
    >
      <div className={`flex items-center justify-between gap-4 px-5 py-5 md:px-10 md:py-6 ${tone}`}>
        {/* Logo / marque */}
        <Link to="/" className={`tg-head text-lg font-bold tracking-[0.25em] ${tone}`}>
          <span data-sg-path="brand" data-sg-edit="panel">{brand}</span>
        </Link>

        {/* Menu desktop — liens internes + déroulants (children) */}
        <div className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <div key={item.label} className="group relative">
              {item.to ? (
                <Link
                  to={item.to}
                  className="text-sm font-medium uppercase tracking-wide underline underline-offset-4 transition-opacity hover:opacity-70"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="cursor-default text-sm font-medium uppercase tracking-wide transition-opacity group-hover:opacity-70">
                  {item.label}
                </span>
              )}
              {item.children?.length ? (
                <div className="absolute left-1/2 top-full hidden min-w-[180px] -translate-x-1/2 rounded-2xl border border-tg-line bg-white p-2 text-tg-ink shadow-2xl group-hover:block">
                  {item.children.map((c) => (
                    <Link
                      key={c.label}
                      to={c.to!}
                      className="flex min-h-[40px] items-center rounded-xl px-4 text-sm font-medium transition-colors hover:bg-tg-ink/5"
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
          <motion.span animate={open ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }} className={`h-0.5 w-7 ${overlay ? 'bg-white' : 'bg-tg-ink'}`} />
          <motion.span animate={open ? { opacity: 0 } : { opacity: 1 }} className={`h-0.5 w-7 ${overlay ? 'bg-white' : 'bg-tg-ink'}`} />
          <motion.span animate={open ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }} className={`h-0.5 w-7 ${overlay ? 'bg-white' : 'bg-tg-ink'}`} />
        </button>
      </div>

      {/* Overlay menu mobile */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="absolute inset-x-4 top-[calc(100%+8px)] z-50 rounded-3xl border border-tg-line bg-white p-3 text-tg-ink shadow-2xl md:hidden"
          >
            <div className="flex flex-col">
              {nav.flatMap((item) => {
                const links = item.to ? [{ label: item.label, to: item.to }] : []
                const children = (item.children ?? []).map((c) => ({ label: c.label, to: c.to! }))
                return [...links, ...children]
              }).map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[48px] items-center rounded-2xl px-4 text-lg font-medium transition-colors hover:bg-tg-ink/5"
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
