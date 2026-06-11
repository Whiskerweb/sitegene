"use client";
// components/foundry/components/FxContainerScroll.tsx
// Portage foundry de « Mise en scène au scroll » (container-scroll, Aceternity) :
// un grand cadre type écran, incliné à 20° en perspective, se redresse et se
// cale (scale 1.05→1 desktop, 0.7→0.9 mobile) pendant le défilement, pendant
// que le titre remonte (-100 px). Écouteurs en capture → animé aussi dans le
// canvas de L'Atelier.
import { useEffect, useRef, useState } from "react";
import type { Skin } from "@/lib/foundry/types";

interface FxContainerScrollContent {
  eyebrow: string;
  title: string;
  image: string;
}

export default function FxContainerScroll({ content }: { content: FxContainerScrollContent; skin: Skin }) {
  const rootRef = useRef<HTMLElement>(null);
  const [p, setP] = useState(0); // progression 0 → 1 de la traversée

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setP(1); return; }
    let raf = 0;
    const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const total = r.height - vh;
      setP(total > 60 ? clamp01(-r.top / total) : clamp01((vh - r.top) / (vh + r.height)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const rot = 20 - 20 * p;
  const mobile = typeof window !== "undefined" && window.innerWidth <= 768;
  const sc = mobile ? 0.7 + 0.2 * p : 1.05 - 0.05 * p;

  return (
    <section ref={rootRef} className="relative flex items-center justify-center overflow-visible p-2 md:p-20" style={{ height: "min(170vh, 1100px)", background: "var(--c-surface)" }}>
      <div className="relative w-full py-10 md:py-32" style={{ perspective: 1000 }}>
        <div className="mx-auto max-w-4xl text-center" style={{ transform: `translateY(${(-100 * p).toFixed(1)}px)`, willChange: "transform", color: "var(--c-ink)" }}>
          <h2 className="text-[1.6rem] font-semibold" style={{ fontFamily: "var(--font-body)" }}>{content.eyebrow}</h2>
          <div className="mt-1 font-extrabold leading-[1.05]" style={{ fontSize: "clamp(2.4rem, 6vw, 6rem)", fontFamily: "var(--font-heading)", letterSpacing: "-2px" }}>
            {content.title}
          </div>
        </div>
        <div
          className="mx-auto -mt-12 h-[30rem] w-full max-w-4xl rounded-[30px] border-4 p-2 md:h-[40rem] md:p-6"
          style={{
            borderColor: "#6c6c6c",
            background: "#222",
            boxShadow: "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a",
            transform: `rotateX(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`,
            willChange: "transform",
          }}
        >
          <div className="h-full w-full overflow-hidden rounded-2xl md:p-4" style={{ background: "#18181b" }}>
            <img src={content.image} alt="" draggable={false} className="h-full w-full rounded-xl object-cover object-left-top" />
          </div>
        </div>
      </div>
    </section>
  );
}
