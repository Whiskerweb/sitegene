"use client";
// components/foundry/components/TeamCards.tsx
// L'équipe : cartes portrait (photo, nom, rôle, mot personnel) en entrée
// cascade. Humanise une page « à propos » — visages avant les discours.
import type { Skin } from "@/lib/foundry/types";
import { Eyebrow } from "../primitives";
import { Reveal } from "../fx";

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  avatar: string;
}

interface TeamCardsContent {
  eyebrow: string;
  title: string;
  items: TeamMember[];
}

export default function TeamCards({ content }: { content: TeamCardsContent; skin: Skin }) {
  const items = content.items ?? [];
  return (
    <section className="px-5 py-16 md:py-24" style={{ background: "var(--c-card)" }}>
      <div className="mx-auto max-w-[1280px]">
        <Reveal className="text-center">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 className="mx-auto mt-4 max-w-xl text-[2rem] md:text-[2.8rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.2px", lineHeight: 1.1 }}>
            {content.title}
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m, i) => (
            <Reveal key={`${m.name}-${i}`} delay={i * 120}>
              <article className="group overflow-hidden rounded-[var(--r-card)]" style={{ background: "var(--c-surface)", boxShadow: "0 10px 36px color-mix(in srgb, var(--c-ink) 7%, transparent)" }}>
                <div className="overflow-hidden">
                  <img src={m.avatar} alt={m.name} loading="lazy" className="h-[300px] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)" }}>{m.name}</h3>
                  <p className="mt-0.5 text-sm font-medium" style={{ color: "var(--c-accent)" }}>{m.role}</p>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: "color-mix(in srgb, var(--c-ink) 64%, transparent)" }}>{m.bio}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
