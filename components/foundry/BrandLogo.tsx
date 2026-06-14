"use client";
// components/foundry/BrandLogo.tsx
// Logo de marque du client. Quand le site a un logo (recipe.brand.logo), il
// REMPLACE le bloc marque par défaut (symbole + wordmark) partout : en haut à
// gauche des navbars et dans les footers. Sans logo → le `fallback` d'origine
// est rendu tel quel (zéro régression visuelle).
//
// Le logo descend par CONTEXTE, jamais par prop traversant 17 composants :
//  - `Assembler`  (site live /a/, aperçu, marketplace) fournit recipe.brand.logo
//  - `Themed`     (canvas de l'Atelier + tous les aperçus de l'éditeur) le fournit
// Les navbars/footers le consomment via <BrandLogo fallback={…} />.
import { createContext, useContext, type ReactNode } from "react";

type BrandCtx = { logo: string | null; brand?: string; scale: number };
const BrandContext = createContext<BrandCtx>({ logo: null, scale: 1 });

/** Fournit le logo (nom + échelle) du site à tout le sous-arbre de sections. */
export function BrandProvider({
  logo,
  brand,
  scale,
  children,
}: {
  logo?: string | null;
  brand?: string;
  /** Multiplicateur de taille du logo (défaut 1). */
  scale?: number | null;
  children: ReactNode;
}) {
  const s = typeof scale === "number" && scale > 0 ? scale : 1;
  return <BrandContext.Provider value={{ logo: logo ?? null, brand, scale: s }}>{children}</BrandContext.Provider>;
}

/** URL du logo courant (ou null) — pratique pour un rendu sur mesure. */
export function useBrandLogo(): string | null {
  return useContext(BrandContext).logo;
}

/**
 * Marque en haut à gauche (navbar) ou dans le footer. Avec un logo client, rend
 * l'image (hauteur contrainte, largeur auto, contain) ; sinon le `fallback`
 * d'origine (symbole + nom). Discret mais présent — il prend la place de la marque,
 * sans jamais déborder (maxWidth borné).
 */
export function BrandLogo({
  fallback,
  alt,
  height = 30,
  maxWidth = 168,
  className,
}: {
  fallback: ReactNode;
  alt?: string;
  /** Hauteur de rendu en px (cale sur la hauteur du wordmark d'origine). */
  height?: number;
  /** Largeur max en px — empêche un logo très large de casser la barre. */
  maxWidth?: number;
  className?: string;
}) {
  const { logo, brand, scale } = useContext(BrandContext);
  if (!logo) return <>{fallback}</>;
  const s = scale || 1;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt={alt ?? brand ?? "Logo"}
      className={className}
      style={{ height: height * s, width: "auto", maxWidth: maxWidth * s, objectFit: "contain", display: "block" }}
    />
  );
}
