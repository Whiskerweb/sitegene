"use client";

import Link from "next/link";
import { ChevronUp } from "lucide-react";
import { AkyraMark } from "@/components/ui/Logo";
import ThemeToggle from "./ThemeToggle";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Navigation",
    links: [
      { label: "Créer", href: "/#demo" },
      { label: "Modèles", href: "/modeles" },
      { label: "Tarifs", href: "/tarifs" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Akyra",
    links: [
      { label: "Connexion", href: "/login" },
      { label: "Mon tableau de bord", href: "/dashboard" },
      { label: "Voir un exemple", href: "/s/alice-r" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Mentions légales", href: "/mentions-legales" },
      { label: "Confidentialité", href: "/confidentialite" },
      { label: "CGV", href: "/cgv" },
    ],
  },
];

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Behance", href: "https://behance.net" },
  { label: "Pinterest", href: "https://pinterest.com" },
  { label: "X", href: "https://x.com" },
];

export default function MarketingFooter() {
  return (
    <footer className="relative z-10 mt-auto w-full border-t border-[rgb(var(--m-line))] bg-[rgb(var(--m-elevated))]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 lg:gap-8">
          <div className="flex flex-col justify-between md:col-span-4 md:min-h-[220px]">
            <div>
              <div className="mb-4 flex items-center gap-2 text-[rgb(var(--m-ink))]">
                <AkyraMark size={26} />
                <span className="text-[17px] font-semibold tracking-tight">Akyra</span>
              </div>
              <p className="max-w-[300px] text-[14px] leading-relaxed text-[rgb(var(--m-ink))]">
                Votre prochain client vous cherche ce soir.{" "}
                <span className="font-medium text-[rgb(var(--m-accent))]">Soyez en ligne.</span>
              </p>
              <p className="mt-4 max-w-[300px] text-[13px] leading-relaxed text-[rgb(var(--m-muted))]">
                Le site pro des indépendants, déjà construit. Quelques photos, une description, et
                vous êtes en ligne en 30 secondes — tout compris, 50 €/an.
              </p>
              {/* [1.1] Réassurance Made in France */}
              <p className="mt-3 max-w-[300px] text-[12.5px] font-medium text-[rgb(var(--m-muted))]">
                🇫🇷 100 % français — conçu en France, données hébergées en Europe, support en
                français.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-[12px] text-[rgb(var(--m-faint))]">
              <span>© 2026 Akyra. Votre site, déjà construit.</span>
              <div className="flex items-center gap-2">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="grid h-7 w-7 place-items-center rounded-full border border-[rgb(var(--m-line))] text-[11px] font-semibold text-[rgb(var(--m-muted))] transition-all hover:border-[rgb(var(--m-overlay)/0.25)] hover:text-[rgb(var(--m-ink))]"
                  >
                    {s.label[0]}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:flex sm:flex-wrap sm:justify-end sm:gap-12 md:col-span-8 lg:gap-20">
            {COLUMNS.map((col) => (
              <div key={col.title} className="flex flex-col gap-3">
                <h4 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--m-faint))]">
                  {col.title}
                </h4>
                {col.links.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="text-[13px] text-[rgb(var(--m-muted))] transition-colors hover:text-[rgb(var(--m-ink))]"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-[rgb(var(--m-line))] pt-6">
          <ThemeToggle size={12} />
          <a
            href="#top"
            aria-label="Revenir en haut"
            className="grid h-8 w-8 place-items-center rounded-full border border-[rgb(var(--m-line))] text-[rgb(var(--m-faint))] transition-all hover:bg-[rgb(var(--m-overlay)/0.04)] hover:text-[rgb(var(--m-ink))]"
          >
            <ChevronUp size={14} />
          </a>
        </div>
      </div>
    </footer>
  );
}
