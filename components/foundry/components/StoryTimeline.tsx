"use client";
// components/foundry/components/StoryTimeline.tsx
// Parcours : frise verticale (année, jalon, récit) qui se dévoile au scroll,
// fil accent et pastilles. Raconte une histoire — page « à propos », méthode,
// avant/après d'un projet.
import type { Skin } from "@/lib/foundry/types";
import { Eyebrow } from "../primitives";
import { Reveal } from "../fx";

interface TimelineStep {
  year: string;
  title: string;
  text: string;
}

interface StoryTimelineContent {
  eyebrow: string;
  title: string;
  items: TimelineStep[];
}

export default function StoryTimeline({ content }: { content: StoryTimelineContent; skin: Skin }) {
  const items = content.items ?? [];
  return (
    <section className="px-5 py-16 md:py-24" style={{ background: "var(--c-surface)" }}>
      <div className="mx-auto max-w-[880px]">
        <Reveal>
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 className="mt-4 max-w-xl text-[2rem] md:text-[2.8rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.2px", lineHeight: 1.1 }}>
            {content.title}
          </h2>
        </Reveal>
        <ol className="relative mt-12 flex flex-col gap-10 pl-8" style={{ borderLeft: "2px solid color-mix(in srgb, var(--c-accent) 30%, transparent)" }}>
          {items.map((s, i) => (
            <li key={`${s.year}-${i}`} className="relative">
              <span
                className="absolute -left-[39px] top-1 grid h-4 w-4 place-items-center rounded-full"
                style={{ background: "var(--c-surface)", border: "2px solid var(--c-accent)" }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--c-accent)" }} />
              </span>
              <Reveal delay={i * 90} y={18}>
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--c-accent)" }}>{s.year}</p>
                <h3 className="mt-1.5 text-xl font-semibold" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)" }}>{s.title}</h3>
                <p className="mt-2 max-w-xl leading-relaxed" style={{ color: "color-mix(in srgb, var(--c-ink) 66%, transparent)" }}>{s.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
