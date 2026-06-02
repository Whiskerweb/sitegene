"use client";

import { motion } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import { IconPhoto, IconSpark, IconCheck } from "@/components/ui/icons";

export default function Features() {
  return (
    <section className="bg-ink-900 px-6 py-24 relative overflow-hidden">
      {/* Decorative radial glows */}
      <div aria-hidden className="absolute -left-10 top-1/4 h-[300px] w-[300px] bg-violet-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div aria-hidden className="absolute -right-10 bottom-1/4 h-[300px] w-[300px] bg-gold-400/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-[1240px]">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-violet-400">
            FONCTIONNALITÉS
          </p>
          <h2 className="font-display text-[32px] font-bold leading-tight tracking-[-0.02em] text-paper md:text-[48px] max-w-[20ch] mx-auto text-balance">
            La simplicité d&apos;un outil. La qualité d&apos;un studio.
          </h2>
          <p className="mt-4 text-muted text-[15px] md:text-[17px] max-w-[52ch] mx-auto">
            Pas de plateformes propriétaires lourdes ou de réglages fastidieux. Notre IA s&apos;occupe de l&apos;intégration technique pour vous laisser vous concentrer sur l&apos;essentiel.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1: Color Extractor */}
          <div
            className="animate-on-scroll delay-1 rounded-[28px] border border-[var(--line)] bg-ink-800 p-8 flex flex-col justify-between overflow-hidden relative group hover:border-violet-500/20 transition-all duration-300"
          >
            <div className="absolute right-0 top-0 -z-10 h-32 w-32 bg-violet-500/5 blur-[40px] pointer-events-none group-hover:bg-violet-500/10 transition-colors" />
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-700 border border-[var(--line)] mb-6 text-violet-400">
                <IconPhoto size={22} />
              </div>
              <h3 className="font-display text-[20px] font-bold text-paper mb-3">
                De vos photos à votre portfolio
              </h3>
              <p className="text-muted text-[14px] leading-relaxed">
                Notre IA extrait les dominantes colorées de vos clichés pour adapter automatiquement les fonds, les contours et les contrastes de votre site. Votre univers visuel dicte le design.
              </p>
            </div>
            
            {/* Visual Swatch Demo */}
            <div className="mt-8 flex gap-2 justify-center border border-white/5 bg-ink-900/50 p-4 rounded-2xl">
              <div className="h-8 w-8 rounded-full bg-[#08080C] border border-white/10 flex items-center justify-center text-[10px] text-faint">bg</div>
              <div className="h-8 w-8 rounded-full bg-[#8B6BFF] shadow-[0_0_10px_rgba(139,107,255,0.4)]" />
              <div className="h-8 w-8 rounded-full bg-[#E8B468]" />
              <div className="h-8 w-8 rounded-full bg-[#3DE0A0]" />
              <div className="h-8 w-8 rounded-full bg-[#16161F]" />
            </div>
          </div>

          {/* Card 2: Simple Editor */}
          <div
            className="animate-on-scroll delay-2 rounded-[28px] border border-[var(--line)] bg-ink-800 p-8 flex flex-col justify-between overflow-hidden relative group hover:border-violet-500/20 transition-all duration-300"
          >
            <div className="absolute right-0 top-0 -z-10 h-32 w-32 bg-gold-400/5 blur-[40px] pointer-events-none group-hover:bg-gold-400/10 transition-colors" />
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-700 border border-[var(--line)] mb-6 text-gold-400">
                <IconSpark size={22} />
              </div>
              <h3 className="font-display text-[20px] font-bold text-paper mb-3">
                Zéro code, modifications directes
              </h3>
              <p className="text-muted text-[14px] leading-relaxed">
                Modifiez vos textes en cliquant directement dessus. Réordonnez vos galeries par simple glisser-déposer. Pour tout le reste, demandez à l&apos;IA en une phrase, elle s&apos;occupe du travail.
              </p>
            </div>

            {/* Simulated Live WYSIWYG element */}
            <div className="mt-8 border border-white/5 bg-ink-900/50 p-4 rounded-2xl flex flex-col gap-2 relative">
              <div className="flex items-center gap-1.5 text-[11px] text-gold-400">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-pulse" />
                <span>Double-cliquez pour éditer</span>
              </div>
              <div className="rounded-lg bg-ink-800 p-2.5 text-[13px] border border-violet-500/30 text-paper font-serif italic">
                Aurelia Studio, écrire avec la lumière.
              </div>
            </div>
          </div>

          {/* Card 3: Domain & Hosting */}
          <div
            className="animate-on-scroll delay-3 rounded-[28px] border border-[var(--line)] bg-ink-800 p-8 flex flex-col justify-between overflow-hidden relative group hover:border-violet-500/20 transition-all duration-300"
          >
            <div className="absolute right-0 top-0 -z-10 h-32 w-32 bg-mint-400/5 blur-[40px] pointer-events-none group-hover:bg-mint-400/10 transition-colors" />
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-700 border border-[var(--line)] mb-6 text-mint-400">
                <span className="text-[13px] font-bold uppercase tracking-wider">PRO</span>
              </div>
              <h3 className="font-display text-[20px] font-bold text-paper mb-3">
                Export HTML & Figma
              </h3>
              <p className="text-muted text-[14px] leading-relaxed">
                Hébergement inclus sous `vous.akyra.com` et connexion de votre propre domaine. Exportez aussi l&apos;intégralité de vos sites en code HTML ou vers Figma avec calques organisés en un clic.
              </p>
            </div>

            {/* Simulated Browser Address Bar & Export CTA */}
            <div className="mt-8 flex flex-col gap-3">
              {/* Address bar */}
              <div className="border border-white/5 bg-ink-900/50 p-2.5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-2.5 py-1 text-[10px] text-muted border border-white/5 w-full mr-2">
                  <span className="text-mint-400">🔒</span>
                  <span className="text-paper truncate">camille.akyra.com</span>
                </div>
                <span className="flex items-center gap-1 text-[9px] font-bold text-mint-400 uppercase tracking-wider bg-mint-400/10 px-1.5 py-0.5 rounded-md">
                  <span className="h-1 w-1 rounded-full bg-mint-400 animate-pulse" />
                  Live
                </span>
              </div>
              
              {/* Export Buttons mockup */}
              <div className="flex gap-2">
                <div className="flex-1 rounded-xl bg-ink-700 hover:bg-ink-600 border border-white/5 py-1.5 text-center text-[11px] font-bold text-paper transition flex items-center justify-center gap-1">
                  <span>📥 Code HTML</span>
                </div>
                <div className="flex-1 rounded-xl bg-ink-700 hover:bg-ink-600 border border-white/5 py-1.5 text-center text-[11px] font-bold text-violet-400 transition flex items-center justify-center gap-1">
                  <span>🎨 Figma Export</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
