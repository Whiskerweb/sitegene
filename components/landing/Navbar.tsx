"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import { AkyraMark } from "@/components/ui/Logo";

const links = [
  { label: "Commencer", href: "#demo" },
  { label: "Comment ça marche", href: "#how" },
  { label: "Tarif", href: "#tarif" },
  { label: "FAQ", href: "#faq" },
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
      <nav className="glass flex w-full max-w-[1040px] items-center justify-between rounded-full py-2 pl-4 pr-2">
        <a href="#top" className="flex items-center gap-2 text-night">
          <AkyraMark size={28} />
          <span className="font-display text-lg font-semibold tracking-tight">
            Akyra
          </span>
        </a>

        <div className="hidden items-center gap-0.5 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate transition-colors hover:bg-white/60 hover:text-night"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="#demo"
            className="btn-gold hidden rounded-full px-5 py-2.5 text-sm font-bold transition-transform hover:scale-[1.03] active:scale-[0.97] sm:inline-block"
          >
            Voir mon site
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="grid h-9 w-9 place-items-center rounded-full text-night md:hidden"
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
          className="absolute top-[64px] w-[calc(100%-2rem)] max-w-[1040px] rounded-3xl border border-white bg-white/95 p-4 shadow-cloud backdrop-blur md:hidden"
        >
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-night/90 hover:bg-sky-100"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#demo"
              onClick={() => setOpen(false)}
              className="btn-gold mt-2 rounded-2xl px-4 py-3 text-center font-bold"
            >
              Voir mon site
            </a>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
