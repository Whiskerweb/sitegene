// components/foundry/Assembler.tsx
import type { CSSProperties, ReactNode } from "react";
import type { Recipe } from "@/lib/foundry/types";
import { getVibe, vibeToCssVars } from "@/lib/foundry/vibes";
import { validateRecipe } from "@/lib/foundry/recipe";
import { heroTreatmentOf } from "@/lib/foundry/treatment";
import { textureLayerStyle } from "@/lib/foundry/texture";
import { COMPONENTS } from "./registry";
import SmartNav from "./SmartNav";

/**
 * Cadre + badge « données d'exemple » autour d'une section que Mistral a remplie
 * de contenu à personnaliser (avis, chiffres, galerie). Aperçu/éditeur UNIQUEMENT
 * — jamais sur le site publié (placeholderMode absent côté /a/[slug]).
 */
function PlaceholderFrame({ reason, children }: { reason: string; children: ReactNode }) {
  return (
    <div style={{ position: "relative", outline: "2px dashed var(--c-accent)", outlineOffset: "-2px" }}>
      <span
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 20,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          maxWidth: "calc(100% - 20px)",
          padding: "6px 11px",
          font: "600 12px/1.2 system-ui,-apple-system,Segoe UI,sans-serif",
          color: "#0f172a",
          background: "rgba(255,255,255,.94)",
          border: "1px solid var(--c-accent)",
          borderRadius: 999,
          boxShadow: "0 4px 16px rgba(15,23,42,.14)",
          backdropFilter: "blur(8px)",
          pointerEvents: "none",
        }}
      >
        <span aria-hidden style={{ fontSize: 13, lineHeight: 1 }}>✨</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{reason}</span>
      </span>
      {children}
    </div>
  );
}

export default function Assembler({
  recipe,
  highlightIndex,
  showBranding,
  placeholderMode,
  fit,
}: {
  recipe: Recipe;
  /** Aperçu marketplace : section mise en avant (anneau accent + scroll auto). */
  highlightIndex?: number;
  /** Badge « Propulsé par Akyra » (sites non abonnés). */
  showBranding?: boolean;
  /**
   * Aperçu/éditeur : entoure d'un cadre + badge les sections marquées
   * `meta.placeholder` (données d'exemple à personnaliser). Jamais sur le live.
   */
  placeholderMode?: boolean;
  /**
   * Aperçu vignette : rend la recette à sa HAUTEUR NATURELLE (pas de 100vh) — un
   * composant court (navbar, footer) n'occupe alors qu'une fine bande, sans vide.
   */
  fit?: boolean;
}) {
  // Charte sur mesure embarquée dans la recette, sinon vibe curée du registre.
  const vibe = recipe.customVibe ?? getVibe(recipe.vibe);
  if (!vibe) return <div style={{ padding: 40 }}>Vibe inconnue : {recipe.vibe}</div>;

  const v = validateRecipe(recipe);
  if (!v.ok) {
    return (
      <pre style={{ padding: 24, color: "#b00", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
        Recette invalide :{"\n"}{v.errors.join("\n")}
      </pre>
    );
  }

  const vars = vibeToCssVars(vibe, recipe.brand) as unknown as CSSProperties;
  const tex = textureLayerStyle(vibe.texture);

  return (
    <div style={{ ...vars, fontFamily: "var(--font-body)", background: "var(--c-surface)", color: "var(--c-ink)", minHeight: fit ? undefined : "100vh", position: "relative", isolation: "isolate" }}>
      {/* Atmosphère de fond pilotée par la DA (grain/grille/halo/mesh) — derrière le contenu. */}
      {tex ? (
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", ...tex }} />
      ) : null}
      {/* Fonts de la vibe — React hisse et déduplique ces <link> dans le <head>. */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={vibe.fontHref} precedence="foundry-fonts" />
      {/* `sg-fit-root` : repère mesuré par la vignette du catalogue pour caler la
          carte sur la hauteur RÉELLE des sections (et non celle de la page). */}
      <div id={fit ? "sg-fit-root" : undefined} style={{ position: "relative", zIndex: 1 }}>
      {v.resolved.map((s, i) => {
        const C = COMPONENTS[s.manifest.id];
        if (!C) return null;
        const heroAttr = s.manifest.role === "hero" ? { "data-hero": heroTreatmentOf(vibe) } : {};
        // Section « à personnaliser » (données d'exemple) : cadre + badge en
        // aperçu/éditeur seulement. Ni navbar ni hero ne sont concernés.
        if (placeholderMode && s.meta?.placeholder && i !== highlightIndex && s.manifest.role !== "navbar" && s.manifest.role !== "hero") {
          return (
            <PlaceholderFrame key={i} reason={s.meta.reason ?? "Données d'exemple — personnalisez en 30 s"}>
              <C content={s.content} skin={s.skin} />
            </PlaceholderFrame>
          );
        }
        if (i === highlightIndex) {
          return (
            <div
              key={i}
              id="sg-preview-target"
              style={{ outline: "3px solid var(--c-accent)", outlineOffset: "-3px", scrollMarginTop: "24px" }}
              {...heroAttr}
            >
              <C content={s.content} skin={s.skin} />
            </div>
          );
        }
        // Navbar : défile avec la page mais revient dès que le visiteur
        // remonte — accessible partout sans être collée en permanence.
        if (s.manifest.role === "navbar") {
          return (
            <SmartNav key={i}>
              <C content={s.content} skin={s.skin} />
            </SmartNav>
          );
        }
        if (s.manifest.role === "hero") {
          return (
            <div key={i} {...heroAttr}>
              <C content={s.content} skin={s.skin} />
            </div>
          );
        }
        return <C key={i} content={s.content} skin={s.skin} />;
      })}
      </div>
      {highlightIndex !== undefined ? (
        <script
          dangerouslySetInnerHTML={{
            __html:
              'window.addEventListener("load",function(){var t=document.getElementById("sg-preview-target");if(t)t.scrollIntoView({behavior:"smooth",block:"start"})});',
          }}
        />
      ) : null}
      {showBranding ? (
        <a
          href="https://akyra.io?utm_source=badge"
          target="_blank"
          rel="noopener"
          style={{
            position: "fixed",
            right: 14,
            bottom: 14,
            zIndex: 2147483000,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            font: "600 12px/1 system-ui,-apple-system,Segoe UI,sans-serif",
            color: "#0f172a",
            textDecoration: "none",
            background: "rgba(255,255,255,.86)",
            border: "1px solid rgba(15,23,42,.10)",
            borderRadius: 999,
            boxShadow: "0 4px 16px rgba(15,23,42,.12)",
            backdropFilter: "blur(8px)",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: "linear-gradient(135deg,#2563eb,#22d3ee)",
            }}
          />
          Propulsé par Akyra
        </a>
      ) : null}
    </div>
  );
}
