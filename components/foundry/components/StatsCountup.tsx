"use client";
// components/foundry/components/StatsCountup.tsx
import { useEffect, useRef, useState } from "react";
import { Eyebrow } from "../primitives";
import type { Skin } from "@/lib/foundry/types";

interface Stat { value: number; suffix?: string; label: string }
interface StatsContent { eyebrow: string; title: string; items: Stat[] }

function useCountUp(target: number, run: boolean) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1500;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target]);
  return v;
}

function StatItem({ s, run }: { s: Stat; run: boolean }) {
  const v = useCountUp(s.value, run);
  return (
    <div className="text-center">
      {/* Chiffre = contenu fort (--c-ink) ; légende = texte doux (--c-muted). */}
      <div className="text-5xl md:text-6xl" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)" }}>
        {v.toLocaleString("fr-FR")}{s.suffix ?? ""}
      </div>
      <p className="mx-auto mt-2 max-w-[180px] text-sm" style={{ color: "var(--c-muted)" }}>{s.label}</p>
    </div>
  );
}

export default function StatsCountup({ content }: { content: StatsContent; skin: Skin }) {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setRun(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section ref={ref} className="px-5 py-16 md:py-24" style={{ background: "var(--c-surface)" }}>
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex justify-center"><Eyebrow>{content.eyebrow}</Eyebrow></div>
          <h2 className="mt-4 text-[2rem] md:text-[3rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.5px", lineHeight: 1.15 }}>
            {content.title}
          </h2>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-8">
          {content.items.map((s, i) => (
            <div key={i} className="max-w-[300px] flex-1 basis-[180px]">
              <StatItem s={s} run={run} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
