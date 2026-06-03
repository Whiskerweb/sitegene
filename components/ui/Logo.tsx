/**
 * Marque Akyra — le « A »-faisceau de lumière (logo officiel).
 * « Akyra » évoque la lumière : le symbole est un A dont le sommet émet un
 * faisceau lumineux. Deux variantes détourées (fond transparent) :
 *   - claire  (A bleu)            → surfaces claires
 *   - sombre  (A lumineux + halo) → surfaces sombres
 *
 * tone="auto" (défaut) bascule automatiquement selon un ancêtre `.akyra.dark`
 * (thème marketing / dashboard). Forcer tone="dark" ou tone="light" sur les
 * surfaces qui ne portent pas la classe de thème (ex. pages app `bg-ink-900`).
 */
type Tone = "auto" | "light" | "dark";

const LIGHT_SRC = "/brand/akyra-light.png";
const DARK_SRC = "/brand/akyra-dark.png";

export function AkyraMark({
  size = 28,
  className = "",
  tone = "auto",
}: {
  size?: number;
  className?: string;
  tone?: Tone;
}) {
  const base = {
    width: size,
    height: size,
    display: "inline-block",
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    flexShrink: 0,
  } as const;

  // Un seul élément, jamais deux : l'image claire est posée en inline (toujours
  // visible) ; en mode auto, `.akyra.dark .akyra-mark` la remplace par la sombre.
  const src = tone === "dark" ? DARK_SRC : LIGHT_SRC;
  const markClass = tone === "auto" ? `akyra-mark ${className}` : className;

  return (
    <span
      aria-hidden
      className={markClass}
      style={{ ...base, backgroundImage: `url(${src})` }}
    />
  );
}

/** Logo complet : symbole + mot-marque. La couleur du texte s'hérite du parent. */
export function AkyraLogo({
  size = 28,
  textClassName = "text-lg",
  tone = "auto",
}: {
  size?: number;
  textClassName?: string;
  tone?: Tone;
}) {
  return (
    <span className="flex items-center gap-2">
      <AkyraMark size={size} tone={tone} />
      <span
        className={`font-display font-semibold tracking-tight ${textClassName}`}
      >
        Akyra
      </span>
    </span>
  );
}
