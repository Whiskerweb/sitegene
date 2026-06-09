import { escapeFxHtml, type EffectConfig, type EffectModule } from "./types";

/**
 * « Halo organique » — repris de la tache lumineuse derrière les témoignages des
 * sites bien-être (Framer « Shape ») : un grand aplat de couleur translucide,
 * FLOUTÉ et de forme organique, posé en fond d'une section pour réchauffer
 * l'ambiance sans jamais gêner la lecture.
 *
 * L'original masque un aplat jaune (#f3de8a ~40%) à travers une PNG de halo
 * radial. Ici, zéro dépendance image : la forme organique est obtenue par un
 * radial-gradient (closest-side, couleur → transparent) + un flou généreux. Une
 * pulsation lente (scale + opacité) donne la respiration « vivante » sans bruit.
 * Pur CSS → compatible toutes lignées, désactivé en prefers-reduced-motion.
 */

export const softGlow: EffectModule = {
  id: "soft-glow",
  name: "Halo organique",
  description:
    "Une tache de lumière douce, floue et organique posée en fond de section — réchauffe l'ambiance derrière des cartes ou un titre, sans gêner la lecture.",
  kind: "component",
  spaCompatible: true,
  defaultPosition: "inside",
  configSchema: [
    { key: "color", label: "Couleur du halo", type: "color", default: "#f3de8a" },
    { key: "opacity", label: "Intensité (%)", type: "number", default: 42, min: 8, max: 85 },
    { key: "size", label: "Largeur (% de la section)", type: "number", default: 86, min: 30, max: 130 },
    { key: "blur", label: "Flou (px)", type: "number", default: 64, min: 0, max: 160 },
    { key: "posY", label: "Position verticale (%)", type: "number", default: 50, min: 0, max: 100 },
    { key: "pulse", label: "Pulsation lente", type: "boolean", default: true },
  ],
  htmlSnippet: (cfg: EffectConfig) => {
    const color = escapeFxHtml(String(cfg.color ?? "#f3de8a"));
    const op = Number(cfg.opacity) || 42;
    const size = Number(cfg.size) || 86;
    const blur = Number(cfg.blur);
    const posY = Number(cfg.posY);
    const vars =
      `--glow:${color};--op:${op};--size:${size};` +
      `--blur:${isFinite(blur) ? blur : 64};--y:${isFinite(posY) ? posY : 50}`;
    const cls = "sg-fx-glow" + (cfg.pulse ? " sg-fx-glow--pulse" : "");
    return `<div class="${cls}" style="${vars}" aria-hidden="true"></div>`;
  },
  css: [
    /* la section hôte doit être en position:relative ; le halo se glisse derrière le contenu */
    ".sg-fx-glow{position:absolute;left:50%;top:calc(var(--y,50)*1%);",
    "transform:translate(-50%,-50%);width:calc(var(--size,86)*1%);aspect-ratio:2/1;",
    "pointer-events:none;z-index:0;border-radius:50%;",
    "background:radial-gradient(closest-side,var(--glow,#f3de8a),transparent 72%);",
    "filter:blur(calc(var(--blur,64)*1px));opacity:calc(var(--op,42)/100)}",
    ".sg-fx-glow--pulse{animation:sg-glow-pulse 9s ease-in-out infinite}",
    "@keyframes sg-glow-pulse{0%,100%{transform:translate(-50%,-50%) scale(1)}",
    "50%{transform:translate(-50%,-50%) scale(1.08)}}",
    "@media (prefers-reduced-motion:reduce){.sg-fx-glow--pulse{animation:none}}",
  ].join("\n"),
  aiGuide: [
    "Halo organique : un grand aplat de couleur translucide, flou, posé EN FOND d'une section pour réchauffer l'ambiance (repris de la tache lumineuse derrière les témoignages des sites bien-être).",
    "Position : presque toujours 'inside' la section à réchauffer (témoignages, citation, CTA, chiffres). La section hôte doit être position:relative ; le halo est en z-index:0, le contenu passe au-dessus. Si le contenu disparaît derrière, ajouter position:relative + z-index:1 au contenu.",
    "color : prendre un accent CHAUD et clair de la DA du site (jaune doux, pêche, sauge pâle) — jamais une couleur froide ni saturée. Sur DA terracotta/crème, #f3de8a (jaune) ou un pêche pâle marchent très bien.",
    "opacity : 30-50 pour un fond discret ; >65 seulement si la section est sombre et qu'on veut un vrai point lumineux.",
    "size : 70-100 pour occuper la largeur de la section ; blur : 50-90 px pour rester organique et flou (jamais net).",
    "posY : 50 (centré) par défaut ; 20-30 pour un halo qui monte derrière un titre, 70-80 derrière une rangée de cartes.",
    "pulse : laisser activé pour une respiration lente et vivante ; désactiver sur une page déjà très animée. Sans effet en prefers-reduced-motion.",
    "Ne pas empiler deux halos dans la même section ; un seul suffit à créer l'ambiance.",
  ].join("\n"),
  demo: {
    bg: "#fcfaf7",
    html:
      `<section style="position:relative;overflow:hidden;max-width:1100px;margin:0 auto;` +
      `padding:6rem 1.5rem;display:grid;place-items:center;text-align:center">` +
      `<!--FX-->` +
      `<div style="position:relative;z-index:1;display:grid;gap:1.5rem;place-items:center">` +
      `<p style="font:600 13px system-ui;letter-spacing:.12em;text-transform:uppercase;color:#8d6959;margin:0">Témoignages</p>` +
      `<h2 style="font:400 clamp(2rem,4vw,3rem)/1.2 Georgia,serif;color:#0d0503;max-width:14em;margin:0;letter-spacing:-1px">Vous n'êtes pas seul — écoutez celles et ceux qui sont passés par là.</h2>` +
      `<div style="display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;margin-top:1rem">` +
      `<div style="width:220px;height:130px;border-radius:24px;background:#fff;box-shadow:0 20px 50px -30px rgba(13,5,3,.3)"></div>` +
      `<div style="width:220px;height:130px;border-radius:24px;background:#fff;box-shadow:0 20px 50px -30px rgba(13,5,3,.3)"></div>` +
      `<div style="width:220px;height:130px;border-radius:24px;background:#fff;box-shadow:0 20px 50px -30px rgba(13,5,3,.3)"></div>` +
      `</div></div></section>`,
  },
  accent: { from: "#f3de8a", to: "#e1937d" },
};

/** Valeurs de démo (page /api/fx-demo). */
export const softGlowDemoConfig: EffectConfig = {
  color: "#f3de8a",
  opacity: 45,
  size: 92,
  blur: 70,
  posY: 50,
  pulse: true,
};
