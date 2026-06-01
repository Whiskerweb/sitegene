import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

/**
 * Faisceau lumineux qui parcourt la bordure d'un conteneur.
 *
 * Technique cross-browser (Chrome / Safari / Firefox) : un dégradé conique
 * posé en `background` de l'élément lui-même, masqué pour ne garder que
 * l'anneau de bordure (même principe que `.glass::before`, déjà utilisé
 * sur ce site), dont l'angle est animé via la custom property `@property
 * --border-beam-angle`. On évite ainsi `offset-path: rect()`, non supporté
 * par Safari/Firefox (d'où le rendu figé de la version d'origine).
 *
 * Le parent doit être `position: relative` avec un `border-radius`
 * (hérité via `rounded-[inherit]`).
 */
export const BorderBeam = ({
  className,
  size = 200,
  duration = 15,
  borderWidth = 1.5,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  delay = 0,
}: BorderBeamProps) => {
  // `size` règle la longueur de l'arc coloré (en % du périmètre), borné.
  const arc = Math.min(28, Math.max(8, size / 18));

  return (
    <div
      style={
        {
          "--duration": duration,
          "--delay": `-${delay}s`,
          padding: `${borderWidth}px`,
          background: `conic-gradient(from var(--border-beam-angle), transparent 0%, ${colorFrom} ${(arc * 0.5).toFixed(2)}%, ${colorTo} ${arc}%, transparent ${(arc + 0.1).toFixed(2)}%)`,
        } as CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit]",
        "animate-border-beam [animation-delay:var(--delay)]",
        // masque : ne garder que l'anneau de bordure (cf. .beam-ring-mask)
        "beam-ring-mask",
        className,
      )}
    />
  );
};
