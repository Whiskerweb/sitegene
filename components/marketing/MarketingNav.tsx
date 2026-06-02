"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AkyraMark } from "@/components/ui/Logo";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { label: "Créer", href: "/#demo" },
  { label: "Modèles", href: "/modeles" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "FAQ", href: "/faq" },
];

export default function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[rgb(var(--m-overlay)/0.06)] bg-[rgb(var(--m-page)/0.8)] backdrop-blur-md">
      <div className="mx-auto flex h-[60px] w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2 text-[rgb(var(--m-ink))]" aria-label="Akyra">
          <AkyraMark size={24} className="opacity-90 transition-opacity group-hover:opacity-100" />
          <span className="text-[15px] font-semibold tracking-tight">Akyra</span>
        </Link>

        <nav className="hidden items-center gap-6 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--m-muted))] md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-[rgb(var(--m-ink))]">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--m-muted))] transition-colors hover:text-[rgb(var(--m-ink))] sm:inline"
          >
            Connexion
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="flex h-8 w-8 items-center justify-center text-[rgb(var(--m-ink))] md:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[rgb(var(--m-line))] bg-[rgb(var(--m-page)/0.95)] backdrop-blur-md md:hidden">
          <nav className="flex flex-col px-4 py-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2 text-[13px] font-medium text-[rgb(var(--m-muted))] hover:text-[rgb(var(--m-ink))]"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="py-2 text-[13px] font-semibold text-[rgb(var(--m-ink))]"
            >
              Connexion
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
