"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BorderBeam } from "@/components/ui/border-beam";
import { EASE, fadeUp, stagger, viewportOnce } from "@/lib/motion";

function DemoVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            v.currentTime = 0;
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src="/landing/eloctix-demo.mp4"
      poster="/landing/eloctix-demo-poster.jpg"
      muted
      loop
      playsInline
      preload="auto"
      aria-label="Démonstration : créer et modifier un site avec Akyra"
      className="h-full w-full object-cover"
    />
  );
}

const TEMPLATES = [
  {
    id: "alice-r",
    title: "Alice R. — Portrait éditorial",
    category: "Photographe",
    views: 159,
    thumb: "/landing/tpl-alice-r.png",
    link: "/s/alice-r",
  },
  {
    id: "potozon",
    title: "Potozon — Studio créatif",
    category: "Photographe",
    views: 153,
    thumb: "/landing/tpl-potozon.png",
    link: "/s/potozon",
  },
  {
    id: "target",
    title: "Target — Magazine minimal",
    category: "Photographe",
    views: 149,
    thumb: "/landing/tpl-target.png",
    link: "/s/target",
  },
];

const ARTISANS = [
  {
    id: "arelec",
    title: "A-Relec — Électricité & chauffage",
    category: "Artisan",
    views: 132,
    thumb: "/landing/tpl-arelec.png",
    link: "https://a-relec.vercel.app",
  },
  {
    id: "eloctix",
    title: "Eloctix — Installation électrique",
    category: "Artisan",
    views: 118,
    thumb: "/landing/tpl-eloctix.png",
    link: "#demo",
  },
];

type TemplateCard = (typeof TEMPLATES)[number];

function SiteCard({ t, idx }: { t: TemplateCard; idx: number }) {
  const external = t.link.startsWith("http");
  return (
    <a
      href={t.link}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={`animate-on-scroll delay-${idx + 1} group block`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] border border-[var(--line)] bg-ink-800 transition-all duration-300 group-hover:border-violet-500/30 group-hover:shadow-[0_20px_50px_rgba(109,74,255,0.15)]">
        <img
          src={t.thumb}
          alt={`Header du site ${t.title}`}
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <h3 className="truncate text-[15px] font-semibold text-white">{t.title}</h3>
        <span className="flex flex-none items-center gap-1 text-[13px] text-faint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {t.views}
        </span>
      </div>
      <p className="mt-0.5 text-[13px] text-muted">{t.category}</p>
    </a>
  );
}

export default function Showcase() {
  return (
    <section id="templates" className="relative overflow-hidden bg-ink-900 px-6 pb-24 pt-4">
      {/* Halos d'ambiance galerie */}
      <div aria-hidden className="blob blob-blue absolute -left-10 top-1/4 h-80 w-80 opacity-40 blur-[100px]" />
      <div aria-hidden className="blob blob-mint absolute -right-10 top-2/3 h-80 w-80 opacity-40 blur-[100px]" />

      <div className="mx-auto max-w-[1240px]">
        {/* Barre titre minimale (style Aura) */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-display text-[24px] font-bold tracking-tight text-white md:text-[28px]">
            Tendances
          </h2>
          <a
            href="#demo"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-ink-800 px-4 py-2 text-[13px] font-semibold text-muted transition hover:text-white hover:border-violet-500/30"
          >
            Créer le mien <span aria-hidden>→</span>
          </a>
        </div>

        {/* Rangée Photographes */}
        <div className="grid gap-6 md:grid-cols-3">
          {TEMPLATES.map((t, idx) => (
            <SiteCard key={t.id} t={t} idx={idx} />
          ))}
        </div>

        {/* Rangée Artisans */}
        <div className="mt-14 mb-24">
          <h3 className="mb-6 text-[15px] font-semibold uppercase tracking-[0.14em] text-faint">
            Artisans
          </h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ARTISANS.map((t, idx) => (
              <SiteCard key={t.id} t={t} idx={idx} />
            ))}
          </div>
        </div>

        {/* Section Live Demo Video avec l'éditeur */}
        <div className="mx-auto max-w-[960px] rounded-[32px] border border-[var(--line)] bg-ink-800 p-6 md:p-8 relative">
          <div className="grid gap-8 md:grid-cols-5 items-center">
            <div className="md:col-span-2 text-left">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400">L&apos;Éditeur</span>
              <h3 className="font-display text-[26px] font-semibold text-white mt-2 leading-tight tracking-tight">
                Modifiez tout en un clin d&apos;œil.
              </h3>
              <p className="text-[15px] leading-relaxed text-muted mt-3">
                Changez vos textes et photos en cliquant directement dessus. Vous voulez restructurer une page ou changer de couleurs ? Demandez-le à l&apos;IA, elle s&apos;occupe du reste.
              </p>
              <div className="mt-6">
                <a
                  href="#demo"
                  className="btn-violet inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Lancer mon site maintenant
                </a>
              </div>
            </div>
            <div className="md:col-span-3">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[24px] border border-[var(--line-strong)] float-card bg-ink-900 shadow-2xl">
                <BorderBeam
                  size={300}
                  duration={10}
                  colorFrom="#6d4aff"
                  colorTo="#e8b468"
                />
                <DemoVideo />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
