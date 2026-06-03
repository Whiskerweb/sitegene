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
  const imgProps = {
    width: size,
    height: size,
    alt: "",
    draggable: false,
    style: { width: size, height: size, objectFit: "contain" as const },
  };

  if (tone === "light") {
    return <img src={LIGHT_SRC} aria-hidden className={className} {...imgProps} />;
  }
  if (tone === "dark") {
    return <img src={DARK_SRC} aria-hidden className={className} {...imgProps} />;
  }

  // auto : les deux variantes, swap géré par CSS (.akyra.dark) dans globals.css
  return (
    <span
      aria-hidden
      className={`akyra-mark ${className}`}
      style={{ display: "inline-flex", width: size, height: size }}
    >
      <img src={LIGHT_SRC} className="akyra-mark__light" {...imgProps} />
      <img src={DARK_SRC} className="akyra-mark__dark" {...imgProps} />
    </span>
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
