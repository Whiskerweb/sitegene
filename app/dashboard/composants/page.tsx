import { listManifests } from "@/lib/foundry/manifests";
import type { ComponentManifest, Rarity } from "@/lib/foundry/types";

export const dynamic = "force-dynamic";

// Libellés FR des catégories (= role du manifest)
const CATEGORY_LABEL: Record<string, string> = {
  hero: "En-tête / Hero",
  services: "Services",
  reviews: "Avis clients",
  faq: "FAQ",
  cta: "Appel à l'action",
  footer: "Pied de page",
};
const CATEGORY_ORDER = ["hero", "services", "reviews", "faq", "cta", "footer"];

const RARITY: Record<Rarity, { label: string; bg: string; fg: string; dot: string }> = {
  common: { label: "Commun", bg: "#eef1e7", fg: "#5d6b3f", dot: "#8e9867" },
  rare: { label: "Rare", bg: "#f8e3da", fg: "#b15c3c", dot: "#e1937d" },
  epic: { label: "Épique", bg: "#f3e6c6", fg: "#8a5a14", dot: "#d8a23a" },
};

function prettyName(id: string): string {
  return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ComponentCard({ m }: { m: ComponentManifest }) {
  const r = RARITY[m.rarity];
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
      {/* Aperçu réel (iframe scalée, non interactive) */}
      <div className="relative h-[260px] w-full overflow-hidden border-b border-black/10 bg-[#fcfaf7]">
        <iframe
          src={`/foundry-preview/${m.id}`}
          title={m.id}
          loading="lazy"
          scrolling="no"
          tabIndex={-1}
          aria-hidden
          style={{
            width: "1266px",
            height: "866px",
            border: 0,
            transform: "scale(0.30)",
            transformOrigin: "top left",
            pointerEvents: "none",
          }}
        />
        <span
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ background: r.bg, color: r.fg }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.dot }} />
          {r.label}
        </span>
      </div>
      {/* Méta */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-neutral-900">{prettyName(m.id)}</h3>
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-500">{m.id}</code>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{m.description}</p>
        {m.whenToUse.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {m.whenToUse.slice(0, 3).map((w) => (
              <span key={w} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
                {w}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export default function ComposantsPage() {
  const all = listManifests();
  const byCat = new Map<string, ComponentManifest[]>();
  for (const m of all) {
    const list = byCat.get(m.role) ?? [];
    list.push(m);
    byCat.set(m.role, list);
  }
  // catégories connues d'abord (ordre voulu), puis le reste
  const cats = [
    ...CATEGORY_ORDER.filter((c) => byCat.has(c)),
    ...[...byCat.keys()].filter((c) => !CATEGORY_ORDER.includes(c)).sort(),
  ];
  const counts = {
    common: all.filter((m) => m.rarity === "common").length,
    rare: all.filter((m) => m.rarity === "rare").length,
    epic: all.filter((m) => m.rarity === "epic").length,
  };

  return (
    <div className="mx-auto max-w-[1280px] px-1 py-2">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Composants</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {all.length} composants · {cats.length} catégories · triés par section. Les pièces de site
          que l'IA assemble. Survol = aperçu réel sous la DA « warm-serif ».
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {(["common", "rare", "epic"] as Rarity[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold" style={{ background: RARITY[k].bg, color: RARITY[k].fg }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: RARITY[k].dot }} />
              {RARITY[k].label} · {counts[k]}
            </span>
          ))}
        </div>
      </header>

      {cats.map((cat) => {
        const items = byCat.get(cat)!;
        return (
          <section key={cat} className="mb-10">
            <div className="mb-4 flex items-baseline gap-3 border-b border-black/10 pb-2">
              <h2 className="text-lg font-semibold text-neutral-900">{CATEGORY_LABEL[cat] ?? cat}</h2>
              <span className="text-sm text-neutral-400">{items.length} forme{items.length > 1 ? "s" : ""}</span>
            </div>
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))" }}>
              {items.map((m) => (
                <ComponentCard key={m.id} m={m} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
