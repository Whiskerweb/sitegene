/**
 * Catalogue STATIQUE de teasers de formules (marketplace à venir).
 * Aucune logique d'application ici : c'est uniquement vitrine « Bientôt »,
 * pour créer le désir et orienter vers l'abonnement illimité.
 */

export type FormulaCategory = "design" | "seo";

export type FormulaTeaser = {
  id: string;
  title: string;
  category: FormulaCategory;
  blurb: string;
  /** Dégradé d'accent pour la vignette. */
  accent: { from: string; to: string };
  featured?: boolean;
};

export const FORMULA_CATEGORIES: { id: FormulaCategory | "all"; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "design", label: "Design" },
  { id: "seo", label: "SEO" },
];

export const FORMULAS: FormulaTeaser[] = [
  {
    id: "editorial-mariage",
    title: "Éditorial Mariage",
    category: "design",
    blurb: "Typographie sérif, grandes photos plein cadre, ambiance romantique premium.",
    accent: { from: "#7c3aed", to: "#22d3ee" },
    featured: true,
  },
  {
    id: "galerie-cinema",
    title: "Galerie Cinématique",
    category: "design",
    blurb: "Galerie immersive plein écran, transitions douces, noir profond élégant.",
    accent: { from: "#2563eb", to: "#22d3ee" },
  },
  {
    id: "studio-minimal",
    title: "Studio Minimal",
    category: "design",
    blurb: "Blanc, espace, et une mise en avant nette de vos meilleures images.",
    accent: { from: "#0ea5e9", to: "#a78bfa" },
  },
  {
    id: "seo-local",
    title: "SEO Local Photographe",
    category: "seo",
    blurb: "Optimisé pour « photographe + ville » : métas, titres et structure prêts à ranker.",
    accent: { from: "#10b981", to: "#22d3ee" },
    featured: true,
  },
  {
    id: "seo-mariage",
    title: "Pack SEO Mariage",
    category: "seo",
    blurb: "Mots-clés mariage haute intention, balisage et textes optimisés conversion.",
    accent: { from: "#f59e0b", to: "#ef4444" },
  },
  {
    id: "boost-vitesse",
    title: "Boost Core Web Vitals",
    category: "seo",
    blurb: "Images optimisées et chargement éclair pour un meilleur référencement.",
    accent: { from: "#6366f1", to: "#22d3ee" },
  },
];
