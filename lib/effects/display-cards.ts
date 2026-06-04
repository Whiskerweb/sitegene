import {
  escapeFxHtml,
  type EffectConfig,
  type EffectModule,
} from "./types";

/**
 * « Cartes en éventail » — adaptation vanilla du DisplayCards (React/Tailwind/
 * shadcn) : pile de 3 cartes inclinées (skewY -8°) empilées en escalier
 * (grid-area unique + translate). Les deux cartes du fond sont en niveaux de
 * gris sous un voile ; au survol chaque carte glisse et reprend ses couleurs.
 * Un dégradé latéral (::after) fond la pile dans l'arrière-plan de la section.
 * 100 % CSS (aucun JS) : les utilitaires Tailwind de l'original sont
 * matérialisés en classes sg-fx-dc*.
 */

const SPARKLES_SVG =
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
  `<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936` +
  `A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937` +
  `l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135` +
  `a.5.5 0 0 1-.963 0z"/></svg>`;

function card(title: string, desc: string, meta: string): string {
  return (
    `<div class="sg-fx-dc">` +
    `<div><span class="sg-fx-dc-icon">${SPARKLES_SVG}</span>` +
    `<p class="sg-fx-dc-title">${title}</p></div>` +
    `<p class="sg-fx-dc-desc">${desc}</p>` +
    `<p class="sg-fx-dc-meta">${meta}</p>` +
    `</div>`
  );
}

export const displayCards: EffectModule = {
  id: "display-cards",
  name: "Cartes en éventail",
  description:
    "Trois cartes inclinées, empilées comme des cartes à jouer, qui se révèlent au passage de la souris — parfait pour illustrer trois temps forts.",
  kind: "component",
  spaCompatible: false,
  defaultPosition: "replace",
  configSchema: [
    { key: "accent", label: "Couleur d'accent", type: "color", default: "#60a5fa" },
    { key: "bg", label: "Fond de la section (fondu)", type: "color", default: "#0d0f17" },
    { key: "title1", label: "Titre carte 1", type: "text", default: "À l'affiche", maxLen: 24 },
    { key: "desc1", label: "Description carte 1", type: "text", default: "Une sélection signature", maxLen: 40 },
    { key: "meta1", label: "Mention carte 1", type: "text", default: "À l'instant", maxLen: 20 },
    { key: "title2", label: "Titre carte 2", type: "text", default: "Populaire", maxLen: 24 },
    { key: "desc2", label: "Description carte 2", type: "text", default: "Les coups de cœur du moment", maxLen: 40 },
    { key: "meta2", label: "Mention carte 2", type: "text", default: "Cette semaine", maxLen: 20 },
    { key: "title3", label: "Titre carte 3", type: "text", default: "Nouveau", maxLen: 24 },
    { key: "desc3", label: "Description carte 3", type: "text", default: "Les dernières créations", maxLen: 40 },
    { key: "meta3", label: "Mention carte 3", type: "text", default: "Aujourd'hui", maxLen: 20 },
  ],
  htmlSnippet: (cfg: EffectConfig) => {
    const s = (k: string) => escapeFxHtml(String(cfg[k] ?? ""));
    return (
      `<div class="sg-fx-display-cards" aria-label="Cartes en éventail">` +
      card(s("title1"), s("desc1"), s("meta1")) +
      card(s("title2"), s("desc2"), s("meta2")) +
      card(s("title3"), s("desc3"), s("meta3")) +
      `</div>`
    );
  },
  css: [
    ".sg-fx-display-cards{display:grid;grid-template-areas:'stack';place-items:center;padding:4.5rem 1rem 5.5rem;min-height:26rem;overflow:hidden}",
    ".sg-fx-dc{grid-area:stack;position:relative;display:flex;height:9rem;width:22rem;box-sizing:border-box;",
    "transform:skewY(-8deg);user-select:none;flex-direction:column;justify-content:space-between;",
    "border-radius:.75rem;border:2px solid rgba(255,255,255,.08);",
    "background:color-mix(in srgb,var(--fx-display-cards-card,#232634) 72%,transparent);",
    "backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:.75rem 1rem;",
    "transition:transform .7s cubic-bezier(.22,.61,.36,1),border-color .7s,background .7s,filter .7s}",
    ".sg-fx-dc>*{display:flex;align-items:center;gap:.5rem;position:relative;z-index:1;margin:0}",
    ".sg-fx-dc::after{content:'';position:absolute;right:-.25rem;top:-5%;height:110%;width:20rem;",
    "background:linear-gradient(to left,var(--fx-display-cards-bg,#0d0f17),transparent);pointer-events:none;z-index:2}",
    ".sg-fx-dc:hover{border-color:rgba(255,255,255,.2);background:var(--fx-display-cards-card,#232634)}",
    ".sg-fx-dc-icon{display:inline-grid;place-items:center;border-radius:9999px;width:1.7rem;height:1.7rem;flex:none;",
    "background:color-mix(in srgb,var(--fx-display-cards-accent,#3b82f6) 30%,#0b0d14);color:var(--fx-display-cards-accent,#93c5fd)}",
    ".sg-fx-dc-icon svg{width:1rem;height:1rem}",
    ".sg-fx-dc-title{font-size:1.05rem;font-weight:600;color:var(--fx-display-cards-accent,#60a5fa)}",
    ".sg-fx-dc-desc{font-size:1.02rem;color:#e7e9f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block!important}",
    ".sg-fx-dc-meta{font-size:.92rem;color:#8d93a5}",
    // Pile : les 2 cartes du fond sont voilées + désaturées, hover les révèle.
    ".sg-fx-dc:nth-child(1),.sg-fx-dc:nth-child(2){filter:grayscale(1)}",
    ".sg-fx-dc:nth-child(1)::before,.sg-fx-dc:nth-child(2)::before{content:'';position:absolute;inset:0;border-radius:inherit;",
    "background:color-mix(in srgb,var(--fx-display-cards-bg,#0d0f17) 50%,transparent);opacity:1;transition:opacity .7s;z-index:2}",
    ".sg-fx-dc:nth-child(1):hover,.sg-fx-dc:nth-child(2):hover{filter:grayscale(0)}",
    ".sg-fx-dc:nth-child(1):hover::before,.sg-fx-dc:nth-child(2):hover::before{opacity:0}",
    ".sg-fx-dc:nth-child(2){transform:skewY(-8deg) translate(3rem,2.5rem)}",
    ".sg-fx-dc:nth-child(3){transform:skewY(-8deg) translate(6rem,5rem)}",
    ".sg-fx-dc:nth-child(1):hover{transform:skewY(-8deg) translateY(-2.5rem)}",
    ".sg-fx-dc:nth-child(2):hover{transform:skewY(-8deg) translate(3rem,-.25rem)}",
    ".sg-fx-dc:nth-child(3):hover{transform:skewY(-8deg) translate(6rem,2.5rem)}",
    "@media (max-width:640px){",
    ".sg-fx-dc{width:17rem;height:8.25rem}",
    ".sg-fx-dc::after{width:15rem}",
    ".sg-fx-dc:nth-child(2){transform:skewY(-8deg) translate(2rem,2rem)}",
    ".sg-fx-dc:nth-child(3){transform:skewY(-8deg) translate(4rem,4rem)}",
    ".sg-fx-dc:nth-child(1):hover{transform:skewY(-8deg) translateY(-1.5rem)}",
    ".sg-fx-dc:nth-child(2):hover{transform:skewY(-8deg) translate(2rem,0)}",
    ".sg-fx-dc:nth-child(3):hover{transform:skewY(-8deg) translate(4rem,2rem)}",
    "}",
    "@media (prefers-reduced-motion:reduce){.sg-fx-dc{transition:none}}",
  ].join("\n"),
  aiGuide: [
    "Cartes en éventail (DisplayCards) : pile de 3 cartes inclinées façon cartes à jouer ; les 2 du fond sont en niveaux de gris sous un voile et se révèlent au survol. Composant d'ILLUSTRATION DE CONTENU (3 temps forts) — pas une galerie photo.",
    "Position idéale : 'replace' le contenu d'une section texte secondaire (liste de prestations, actualités, points forts) ou 'after' une section à propos. Besoin d'air : ~26rem de hauteur.",
    "Remplir les 3 cartes avec des textes COURTS repris du vocabulaire réel du site : title = catégorie/prestation (≤ 22 car., ex. « Mariage »), desc = bénéfice sur UNE ligne (≤ 38 car., ex. « Reportages intimistes et vrais »), meta = repère temporel ou volume (≤ 18 car., ex. « Depuis 2018 », « 120 mariages »).",
    "bg = couleur de FOND de la section ciblée (le dégradé latéral fond les cartes dans la page — s'il est faux, l'effet semble découpé). accent = couleur d'accent de la DA du site.",
    "Esthétique sombre signature : les cartes restent sombres. Sur un site très clair, privilégier une section à fond sombre, sinon accorder quand même bg au fond clair de la section.",
    "L'ordre des cartes va du fond (1) vers l'avant (3) : mettre l'information la plus forte en carte 3 (la plus visible).",
  ].join("\n"),
  demo: {
    bg: "#0b0d14",
    html:
      `<div style="min-height:100vh;display:grid;place-items:center">` +
      `<div style="width:100%;max-width:48rem"><!--FX--></div>` +
      `</div>`,
  },
  accent: { from: "#3b82f6", to: "#8b5cf6" },
};

/** Valeurs de démo (page /api/fx-demo). */
export const displayCardsDemoConfig: EffectConfig = {
  accent: "#60a5fa",
  bg: "#0b0d14",
  title1: "À l'affiche",
  desc1: "Une sélection signature",
  meta1: "À l'instant",
  title2: "Populaire",
  desc2: "Les coups de cœur du moment",
  meta2: "Cette semaine",
  title3: "Nouveau",
  desc3: "Les dernières créations",
  meta3: "Aujourd'hui",
};
