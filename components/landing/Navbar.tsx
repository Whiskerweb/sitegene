"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import { AkyraMark } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";

const links = [
  { label: "Créer", href: "#demo" },
  { label: "Modèles", href: "#templates" },
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
      <nav className="flex w-full max-w-[1040px] items-center justify-between rounded-full border border-black/[0.07] bg-white/80 py-2 pl-4 pr-2 shadow-[0_8px_30px_-12px_rgba(20,30,80,0.18)] backdrop-blur-xl">
        <a href="#top" className="flex items-center gap-2 text-night">
          <AkyraMark size={28} className="text-brand" />
          <span className="font-display text-lg font-semibold tracking-tight">
            Akyra
          </span>
        </a>

        <div className="hidden items-center gap-0.5 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate transition-colors hover:bg-black/[0.04] hover:text-night"
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
          className="absolute top-[64px] w-[calc(100%-2rem)] max-w-[1040px] rounded-3xl border border-black/[0.08] bg-white/95 p-4 shadow-[0_18px_50px_-12px_rgba(20,30,80,0.18)] backdrop-blur md:hidden"
        >
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-slate hover:bg-black/[0.04] hover:text-night"
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
