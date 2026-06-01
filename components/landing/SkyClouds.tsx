// Banc de transition 100 % vectoriel : nuages FRACTALS (feTurbulence) — texture
// organique douce (vraie brume nuageuse), pas de formes dures ni de boîte. Le banc
// se fond dans le bleu en haut (= bas du hero) et dans le blanc en bas (= formulaire),
// si bien que le formulaire émerge des nuages. Aucune photo, aucun PNG.

type Props = { className?: string };

export default function SkyClouds({ className = "" }: Props) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-x-0 overflow-hidden ${className}`}>
      <svg viewBox="0 0 1440 460" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <defs>
          {/* Nuages : bruit fractal → blanc avec alpha seuillé (puffs doux) */}
          <filter id="cloudA" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.009 0.015" numOctaves="5" seed="7" stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix"
              values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.7 -0.42" />
          </filter>
          {/* 2e couche, fréquence différente → relief / variété */}
          <filter id="cloudB" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.018 0.03" numOctaves="4" seed="19" stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix"
              values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.7 -0.72" />
          </filter>

          {/* Fondu vertical des nuages : transparents en haut (→ bleu), pleins au milieu */}
          <linearGradient id="vfade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="34%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#fff" stopOpacity="1" />
          </linearGradient>
          <mask id="vmask"><rect x="0" y="0" width="1440" height="460" fill="url(#vfade)" /></mask>

          {/* Sol blanc : le bas du banc devient blanc plein (la mer de nuages → le blanc) */}
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="52%" stopColor="#fff" stopOpacity="0" />
            <stop offset="78%" stopColor="#fff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#fff" stopOpacity="1" />
          </linearGradient>
        </defs>

        <g mask="url(#vmask)">
          {/* couche large (drift lent) */}
          <g className="float-x-2">
            <rect x="-240" y="0" width="1920" height="460" filter="url(#cloudA)" />
          </g>
          {/* couche de détail (drift inverse plus lent) */}
          <g className="float-x-3" opacity="0.7">
            <rect x="-240" y="0" width="1920" height="460" filter="url(#cloudB)" />
          </g>
        </g>

        {/* sol blanc par-dessus → dissolution en blanc */}
        <rect x="0" y="0" width="1440" height="460" fill="url(#floor)" />
      </svg>
    </div>
  );
}
