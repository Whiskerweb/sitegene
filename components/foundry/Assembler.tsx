// components/foundry/Assembler.tsx
import type { CSSProperties } from "react";
import type { Recipe } from "@/lib/foundry/types";
import { getVibe, vibeToCssVars } from "@/lib/foundry/vibes";
import { validateRecipe } from "@/lib/foundry/recipe";
import { COMPONENTS } from "./registry";
import SmartNav from "./SmartNav";

export default function Assembler({
  recipe,
  highlightIndex,
}: {
  recipe: Recipe;
  /** Aperçu marketplace : section mise en avant (anneau accent + scroll auto). */
  highlightIndex?: number;
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

  return (
    <div style={{ ...vars, fontFamily: "var(--font-body)", background: "var(--c-surface)", color: "var(--c-ink)", minHeight: "100vh" }}>
      {/* Fonts de la vibe — React hisse et déduplique ces <link> dans le <head>. */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={vibe.fontHref} precedence="foundry-fonts" />
      {v.resolved.map((s, i) => {
        const C = COMPONENTS[s.manifest.id];
        if (!C) return null;
        if (i === highlightIndex) {
          return (
            <div
              key={i}
              id="sg-preview-target"
              style={{ outline: "3px solid var(--c-accent)", outlineOffset: "-3px", scrollMarginTop: "24px" }}
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
        return <C key={i} content={s.content} skin={s.skin} />;
      })}
      {highlightIndex !== undefined ? (
        <script
          dangerouslySetInnerHTML={{
            __html:
              'window.addEventListener("load",function(){var t=document.getElementById("sg-preview-target");if(t)t.scrollIntoView({behavior:"smooth",block:"start"})});',
          }}
        />
      ) : null}
    </div>
  );
}
