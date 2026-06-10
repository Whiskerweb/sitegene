// (Plumber Pro) Footer sombre (var(--c-ink)) : marque + tagline à gauche,
// 3 colonnes de liens, copyright centré.
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";

interface FooterColumn { heading: string; links: string[] }

export default function PlumberProFooter({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const columns: FooterColumn[] = Array.isArray(content?.columns) ? content.columns : [
    { heading: "Entreprise", links: ["Accueil", "À propos", "Blog"] },
    { heading: "Services", links: ["Urgence 24/7", "Débouchage", "Installation"] },
    { heading: "Légal", links: ["Politique de confidentialité", "Conditions générales"] },
  ];
  return (
    <footer className="ppfoot px-6 pb-8 pt-16" style={{ background: "var(--c-ink)", ...root }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-12 md:grid-cols-4">
          {/* Marque */}
          <div className="md:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--c-accent)" }}>
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c3 4.5 6 8 6 11a6 6 0 11-12 0c0-3 3-6.5 6-11z"/></svg>
              </span>
              <span className="text-xl font-extrabold text-white">{content?.brand ?? "Aqualis"}</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-white/50">
              {content?.tagline ?? "Une plomberie professionnelle, soignée et fiable au quotidien."}
            </p>
          </div>

          {/* Colonnes */}
          {columns.map((col, ci) => (
            <div key={ci}>
              <h4 className="mb-4 text-sm font-bold text-white/80">{col.heading}</h4>
              <ul className="space-y-2">
                {col.links.map((l, li) => (
                  <li key={li}><a href="#" className="text-sm text-white/50 transition-colors hover:text-white">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-xs text-white/30">{content?.copyright ?? "© 2026 Tous droits réservés."}</p>
        </div>
      </div>
    </footer>
  );
}
