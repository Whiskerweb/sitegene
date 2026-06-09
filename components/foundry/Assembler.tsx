// components/foundry/Assembler.tsx
import type { CSSProperties } from "react";
import type { Recipe } from "@/lib/foundry/types";
import { getVibe, vibeToCssVars } from "@/lib/foundry/vibes";
import { validateRecipe } from "@/lib/foundry/recipe";
import { COMPONENTS } from "./registry";

export default function Assembler({ recipe }: { recipe: Recipe }) {
  const vibe = getVibe(recipe.vibe);
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
      {v.resolved.map((s, i) => {
        const C = COMPONENTS[s.manifest.id];
        return C ? <C key={i} content={s.content} skin={s.skin} /> : null;
      })}
    </div>
  );
}
