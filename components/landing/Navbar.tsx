"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";

const links = [
  { label: "Templates", href: "#templates" },
  { label: "Tarif", href: "#tarif" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
      className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
    >
      <nav className="glass flex w-full max-w-[1000px] items-center justify-between rounded-full px-3 py-2 pl-5">
        <a href="#top" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full btn-violet text-xs font-bold text-white">
            S
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Sitegene
          </span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-paper"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="#tarif"
            className="btn-violet hidden rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-[0.97] sm:inline-block"
          >
            Mettre en ligne
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="grid h-9 w-9 place-items-center rounded-full text-paper md:hidden"
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
          className="glass absolute top-[64px] w-[calc(100%-2rem)] max-w-[1000px] rounded-3xl p-4 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-paper/90 hover:bg-ink-600"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#tarif"
              onClick={() => setOpen(false)}
              className="btn-violet mt-2 rounded-2xl px-4 py-3 text-center font-semibold text-white"
            >
              Mettre en ligne
            </a>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
