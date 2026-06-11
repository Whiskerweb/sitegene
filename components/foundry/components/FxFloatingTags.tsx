// components/foundry/components/FxFloatingTags.tsx
// Portage foundry de « Slogan flottant » (floating-tags) : une phrase-manifeste
// centrée, entourée de pastilles de valeurs et de petits points dispersés sur
// les bords, qui flottent doucement en continu. Pur CSS, désactivé en
// prefers-reduced-motion. Couleurs/typos pilotées par la charte.
import type { Skin } from "@/lib/foundry/types";

interface FxFloatingTagsContent {
  text: string;
  tags: string[];
}

// Motif de dispersion autour de la phrase (bords seulement, jamais le centre).
const SPOTS = [
  { left: "3%", top: "20%" }, { right: "5%", top: "14%" }, { left: "9%", bottom: "18%" },
  { right: "7%", bottom: "22%" }, { left: "1%", top: "54%" }, { right: "2%", top: "60%" },
  { left: "14%", top: "8%" }, { right: "16%", bottom: "10%" },
] as const;
const DOTS = [
  { left: "24%", top: "30%", width: 10, height: 10 }, { right: "22%", top: "26%", width: 14, height: 14 },
  { left: "30%", bottom: "26%", width: 8, height: 8 }, { right: "28%", bottom: "30%", width: 12, height: 12 },
] as const;

export default function FxFloatingTags({ content }: { content: FxFloatingTagsContent; skin: Skin }) {
  const tags = (content.tags ?? []).filter(Boolean).slice(0, SPOTS.length);
  return (
    <section className="relative" style={{ background: "var(--c-surface)" }}>
      <div className="relative mx-auto max-w-[1100px] text-center" style={{ padding: "clamp(4rem, 9vw, 9rem) 1.5rem" }}>
        {tags.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="sg-fx-ftag absolute z-[1] inline-flex items-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold text-white"
            style={{
              ...SPOTS[i],
              background: "var(--c-accent)",
              fontFamily: "var(--font-body)",
              willChange: "transform",
              animation: `sgFloat ${(6 + (i % 4) * 0.9).toFixed(1)}s ease-in-out infinite`,
              animationDelay: `${((i % 5) * 0.6).toFixed(1)}s`,
            }}
          >
            {t}
          </span>
        ))}
        {DOTS.map((d, i) => (
          <span
            key={i}
            className="sg-fx-fdot absolute z-[1] rounded-full"
            style={{
              ...d,
              background: "color-mix(in srgb, var(--c-accent) 45%, transparent)",
              willChange: "transform",
              animation: `sgFloat ${(7 + i).toFixed(1)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.4).toFixed(1)}s`,
            }}
          />
        ))}
        <p
          className="relative z-[2] mx-auto"
          style={{
            maxWidth: "16em",
            fontFamily: "var(--font-heading)",
            fontWeight: 400,
            letterSpacing: "-1px",
            fontSize: "clamp(1.5rem, 3.2vw, 2.5rem)",
            lineHeight: 1.3,
            color: "var(--c-ink)",
          }}
        >
          {content.text}
        </p>
      </div>
      <style>{`
        @keyframes sgFloat { 0%, 100% { transform: translateY(-7px); } 50% { transform: translateY(7px); } }
        @media (prefers-reduced-motion: reduce) { .sg-fx-ftag, .sg-fx-fdot { animation: none !important; } }
      `}</style>
    </section>
  );
}
