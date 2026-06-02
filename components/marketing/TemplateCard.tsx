import { Eye, ExternalLink, Star } from "lucide-react";
import type { Realisation } from "@/lib/showcase";

/** Carte de réalisation — fidèle au clone aura, tokens marketing scopés. */
export default function TemplateCard({ r }: { r: Realisation }) {
  return (
    <a
      href={r.link}
      target={r.external ? "_blank" : undefined}
      rel={r.external ? "noreferrer" : undefined}
      className="group relative flex h-[340px] flex-col overflow-hidden rounded-xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] transition-all duration-300 hover:-translate-y-[2px] hover:border-[rgb(var(--m-overlay)/0.2)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.18)]"
    >
      <div className="relative h-[240px] w-full overflow-hidden border-b border-[rgb(var(--m-line))] bg-[rgb(var(--m-elevated))]">
        <img
          src={r.thumb}
          alt={r.title}
          loading="lazy"
          className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />
        {r.featured && (
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-[rgb(var(--m-accent))] px-2 py-0.5 text-[10px] font-semibold text-[rgb(var(--m-on-accent))] shadow-sm">
            <Star size={10} className="fill-current" /> À la une
          </div>
        )}
        {!r.featured && r.badge === "Nouveau" && (
          <div className="absolute left-2.5 top-2.5 rounded-full bg-[rgb(var(--m-accent))] px-2 py-0.5 text-[10px] font-semibold text-[rgb(var(--m-on-accent))] shadow-sm">
            Nouveau
          </div>
        )}
        {r.badge === "PRO" && (
          <div className="absolute bottom-2.5 right-2.5 rounded border border-[rgb(var(--m-line))] bg-[rgb(var(--m-page)/0.8)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--m-ink)/0.9)] backdrop-blur-sm">
            PRO
          </div>
        )}
      </div>
      <div className="flex flex-grow flex-col justify-between p-4">
        <h3 className="truncate pr-2 text-[13px] font-medium text-[rgb(var(--m-ink))]">{r.title}</h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[rgb(var(--m-accent))] text-[8px] font-bold text-[rgb(var(--m-on-accent))]">
              A
            </span>
            <span className="text-[11px] font-medium text-[rgb(var(--m-muted))]">Akyra</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-[rgb(var(--m-faint))]">
            <span className="flex items-center gap-1 transition-colors group-hover:text-[rgb(var(--m-ink))]">
              <ExternalLink size={12} /> Aperçu
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye size={12} /> {r.views}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
