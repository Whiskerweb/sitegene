"use client";

import { useEffect, useRef, useState } from "react";

/** Largeur logique « desktop » à laquelle on rend le site dans l'iframe. */
const DESIGN_WIDTH = 1440;
/** Hauteur logique correspondante (ratio 16:10 = celui du cadre). */
const DESIGN_HEIGHT = 900;

/**
 * Aperçu d'un site en iframe qui remplit toujours son cadre.
 * On rend le site à sa largeur desktop (1440px) puis on applique un
 * `scale` calculé à partir de la largeur réelle du conteneur, de sorte
 * que l'aperçu occupe 100 % du cadre quelle que soit sa taille.
 */
export function SitePreview({ slug }: { slug: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width > 0) setScale(width / DESIGN_WIDTH);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      className="relative aspect-[16/10] w-full overflow-hidden bg-white"
    >
      <iframe
        src={`/s/${slug}`}
        title="Aperçu de votre site"
        loading="lazy"
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 origin-top-left border-0 transition-opacity duration-300"
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
          opacity: scale > 0 ? 1 : 0,
        }}
      />
    </div>
  );
}
