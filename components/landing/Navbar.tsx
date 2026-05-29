"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";

const links = [
  { label: "Modèles", href: "#templates" },
  { label: "Comment ça marche", href: "#how" },
  { label: "Tarif", href: "#tarif" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
      className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
    >
      <nav className="flex w-full max-w-[1000px] items-center justify-between rounded-full border border-line bg-paper/85 px-3 py-2 pl-5 backdrop-blur-md">
        <a href="#top" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-terracotta text-xs font-bold text-paper">
            S
          </span>
          <span className="font-display text-lg font-medium tracking-tight text-ink">
            Sitegene
          </span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm text-ink-soft transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="#templates"
            className="btn-terra hidden rounded-full px-5 py-2.5 text-sm font-semibold text-paper transition-transform hover:scale-[1.03] active:scale-[0.97] sm:inline-block"
          >
            Voir les modèles
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="grid h-9 w-9 place-items-center rounded-full text-ink md:hidden"
          >
            <span className="text-xl leading-none">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </nav>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="absolute top-[64px] w-[calc(100%-2rem)] max-w-[1000px] rounded-3xl border border-line bg-card p-4 shadow-lg md:hidden"
        >
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-ink/90 hover:bg-paper-2"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#templates"
              onClick={() => setOpen(false)}
              className="btn-terra mt-2 rounded-2xl px-4 py-3 text-center font-semibold text-paper"
            >
              Voir les modèles
            </a>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
