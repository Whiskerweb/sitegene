"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import { AkyraMark } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";

const links = [
  { label: "Commencer", href: "#demo" },
  { label: "Comment ça marche", href: "#how" },
  { label: "Tarif", href: "#tarif" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  // CTA : vers le dashboard si connecté, sinon login. /login renvoie déjà vers
  // le dashboard après connexion, donc /login est un repli sûr avant hydratation.
  const [ctaHref, setCtaHref] = useState("/login");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCtaHref("/dashboard");
    });
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
      className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
    >
      <nav className="glass flex w-full max-w-[1040px] items-center justify-between rounded-full py-2 pl-4 pr-2">
        <a href="#top" className="flex items-center gap-2 text-paper hover:text-white">
          <AkyraMark size={28} className="text-violet-400" />
          <span className="font-display text-lg font-semibold tracking-tight">
            Akyra
          </span>
        </a>

        <div className="hidden items-center gap-0.5 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-white/10 hover:text-paper"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={ctaHref}
            className="btn-violet hidden rounded-full px-5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.97] sm:inline-block"
          >
            Mettre mon site en ligne
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
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
          className="absolute top-[64px] w-[calc(100%-2rem)] max-w-[1040px] rounded-3xl border border-[var(--line)] bg-ink-800/95 p-4 shadow-[0_18px_50px_-12px_rgba(82,38,224,0.3)] backdrop-blur md:hidden"
        >
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-muted hover:bg-white/5 hover:text-paper"
              >
                {l.label}
              </a>
            ))}
            <a
              href={ctaHref}
              onClick={() => setOpen(false)}
              className="btn-violet mt-2 rounded-2xl px-4 py-3 text-center font-bold text-white"
            >
              Mettre mon site en ligne
            </a>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
