/**
 * Marque Akyra — un soleil / halo lumineux.
 * « Akyra » évoque la lumière (jap. Akira 明 = clarté, éclat), et la photographie
 * est l'art d'« écrire avec la lumière ». Le symbole reprend le halo solaire de la
 * DA Cloud (cf. .sun-halo / .glow). Rendu net sur fond clair (navbar) comme sur
 * fond bleu (footer).
 */
export function AkyraMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* Shutter aperture and photography grid in currentColor */}
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.2" />
      <circle cx="16" cy="16" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 2v6M16 24v6M2 16h6M24 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7.5 7.5l4.5 4.5M20 20l4.5 4.5M24.5 7.5L20 12M12 20l-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
    </svg>
  );
}

/** Logo complet : symbole + mot-marque. La couleur du texte s'hérite du parent. */
export function AkyraLogo({
  size = 28,
  textClassName = "text-lg",
}: {
  size?: number;
  textClassName?: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <AkyraMark size={size} className="text-violet-400" />
      <span
        className={`font-display font-semibold tracking-tight ${textClassName}`}
      >
        Akyra
      </span>
    </span>
  );
}
