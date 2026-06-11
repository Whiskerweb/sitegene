// components/foundry/components/MarqueeWords.tsx
// Bandeau de mots en défilement continu (CSS pur, aucun JS) : grands mots en
// typo de titre séparés par des étoiles accent. Pure respiration design entre
// deux sections — valeurs, services, villes desservies…
import type { Skin } from "@/lib/foundry/types";

interface MarqueeWordsContent {
  words: string[];
}

export default function MarqueeWords({ content }: { content: MarqueeWordsContent; skin: Skin }) {
  const words = (content.words ?? []).filter(Boolean);
  if (words.length === 0) return null;
  // Deux copies de la séquence → boucle parfaite à -50%.
  const seq = [...words, ...words];
  return (
    <section className="overflow-hidden py-7" style={{ background: "var(--c-card)", borderBlock: "1px solid color-mix(in srgb, var(--c-ink) 8%, transparent)" }}>
      <style>{`
        @keyframes sgMarqueeWords { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .sg-marquee-words:hover { animation-play-state: paused; }
      `}</style>
      <div className="sg-marquee-words flex w-max items-center" style={{ animation: "sgMarqueeWords 26s linear infinite" }}>
        {seq.map((w, i) => (
          <span key={`${w}-${i}`} className="flex items-center whitespace-nowrap">
            <span className="px-6 text-[1.6rem] md:text-[2.1rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-0.5px" }}>{w}</span>
            <span aria-hidden className="text-lg" style={{ color: "var(--c-accent)" }}>✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}
