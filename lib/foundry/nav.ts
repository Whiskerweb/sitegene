// lib/foundry/nav.ts
// Helpers PURS (client-safe) pour les liens de navbar. Un lien peut être une
// chaîne héritée ("Accueil"), un objet {label, target} (stocké) ou {label, href}
// (résolu au rendu public). Les composants navbar lisent via navLabel/navHref.

export function navLabel(l: unknown): string {
  if (typeof l === "string") return l;
  if (l && typeof l === "object") {
    const o = l as Record<string, unknown>;
    if (typeof o.label === "string") return o.label;
  }
  return "";
}

export function navHref(l: unknown): string {
  if (l && typeof l === "object") {
    const o = l as Record<string, unknown>;
    if (typeof o.href === "string" && o.href) return o.href;
  }
  return "#";
}
