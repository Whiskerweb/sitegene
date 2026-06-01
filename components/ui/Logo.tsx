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
      <defs>
        <radialGradient id="akyra-core" cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="#fff7da" />
          <stop offset="46%" stopColor="#f8cf55" />
          <stop offset="100%" stopColor="#f0b429" />
        </radialGradient>
      </defs>
      {/* halo concentrique */}
      <circle cx="16" cy="16" r="15" fill="#f8cf55" opacity="0.16" />
      <circle cx="16" cy="16" r="11" fill="#f8cf55" opacity="0.26" />
      {/* disque solaire */}
      <circle cx="16" cy="16" r="7.4" fill="url(#akyra-core)" />
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
      <AkyraMark size={size} />
      <span
        className={`font-display font-semibold tracking-tight ${textClassName}`}
      >
        Akyra
      </span>
    </span>
  );
}
