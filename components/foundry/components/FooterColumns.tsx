// components/foundry/components/FooterColumns.tsx
import type { Skin } from "@/lib/foundry/types";

interface FooterCol { title: string; links: string[] }
interface FooterContent { brand: string; tagline: string; columns: FooterCol[]; copyright: string }

export default function FooterColumns({ content }: { content: FooterContent; skin: Skin }) {
  return (
    <footer className="px-5 pt-16 pb-8" style={{ background: "var(--c-card)" }}>
      <div className="mx-auto grid max-w-[1280px] gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <span className="text-xl" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)" }}>{content.brand}</span>
          <p className="mt-5 max-w-xs" style={{ color: "var(--c-accent)" }}>{content.tagline}</p>
        </div>
        {content.columns.map((c, i) => (
          <div key={i}>
            <p className="text-lg font-bold" style={{ color: "var(--c-ink)" }}>{c.title}</p>
            <ul className="mt-5 flex flex-col gap-3" style={{ color: "var(--c-accent)" }}>
              {c.links.map((l, j) => (<li key={j}>{l}</li>))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-14 max-w-[1280px] border-t pt-6 text-xs" style={{ borderColor: "color-mix(in srgb, var(--c-accent) 18%, transparent)", color: "var(--c-accent)" }}>{content.copyright}</div>
    </footer>
  );
}
