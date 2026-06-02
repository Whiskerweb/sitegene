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
      <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] border border-black/[0.08] bg-surface-2 shadow-cloud-sm transition-all duration-300 group-hover:border-brand/30 group-hover:shadow-cloud">
        <img
          src={t.thumb}
          alt={`Header du site ${t.title}`}
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <h3 className="truncate text-[15px] font-semibold text-night">{t.title}</h3>
        <span className="flex flex-none items-center gap-1 text-[13px] text-mist">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {t.views}
        </span>
      </div>
      <p className="mt-0.5 text-[13px] text-slate">{t.category}</p>
    </a>
  );
}

export default function Showcase() {
  return (
    <section id="templates" className="relative overflow-hidden bg-white px-6 pb-24 pt-12">
      <div className="mx-auto max-w-[1240px]">
        {/* Rangée Photographes */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-display text-[22px] font-semibold tracking-tight text-night md:text-[26px]">
            Photographes
          </h2>
          <a
            href="#demo"
            className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-black/[0.02] px-4 py-2 text-[13px] font-semibold text-slate transition hover:text-night hover:border-brand/30"
          >
            Créer le mien <span aria-hidden>→</span>
          </a>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {TEMPLATES.map((t, idx) => (
            <SiteCard key={t.id} t={t} idx={idx} />
          ))}
        </div>

        {/* Rangée Artisans */}
        <div className="mt-14 mb-20">
          <h2 className="mb-6 font-display text-[22px] font-semibold tracking-tight text-night md:text-[26px]">
            Artisans
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ARTISANS.map((t, idx) => (
              <SiteCard key={t.id} t={t} idx={idx} />
            ))}
          </div>
          <p className="mt-6 text-[14px] text-mist">
            Musiciens &amp; autres métiers — <span className="font-medium text-slate">bientôt</span>.
          </p>
        </div>

        {/* Section Live Demo Video avec l'éditeur */}
        <div className="relative mx-auto max-w-[960px] rounded-[32px] border border-black/[0.08] bg-surface-2 p-6 shadow-cloud md:p-8">
          <div className="grid items-center gap-8 md:grid-cols-5">
            <div className="text-left md:col-span-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">L&apos;Éditeur</span>
              <h3 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight text-night">
                Modifiez tout en un clin d&apos;œil.
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-slate">
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
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[24px] border border-black/[0.08] bg-white shadow-cloud">
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
