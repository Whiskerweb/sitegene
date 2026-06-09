import { escapeFxHtml, type EffectConfig, type EffectModule } from "./types";

/**
 * « Slogan flottant » — repris de la Slogan Section des sites bien-être : une
 * phrase-manifeste centrée, entourée de PASTILLES de valeurs (Compassion,
 * Écoute…) et de petits points, dispersés sur les bords et qui FLOTTENT
 * doucement en continu (l'original porte will-change:transform sur chaque
 * pastille). Effet ambiant, vivant, sans bruit.
 *
 * Pur CSS : chaque pastille/point est posé en absolu à une position du motif de
 * dispersion et animé par un float vertical lent, décalé par index → mouvement
 * organique non synchronisé. Désactivé en prefers-reduced-motion.
 */

// Motif de dispersion autour de la phrase centrale (bords seulement, jamais le centre).
const SPOTS = [
  "left:3%;top:20%", "right:5%;top:14%", "left:9%;bottom:18%",
  "right:7%;bottom:22%", "left:1%;top:54%", "right:2%;top:60%",
  "left:14%;top:8%", "right:16%;bottom:10%",
];
const DOTS = [
  "left:24%;top:30%;width:10px;height:10px", "right:22%;top:26%;width:14px;height:14px",
  "left:30%;bottom:26%;width:8px;height:8px", "right:28%;bottom:30%;width:12px;height:12px",
];

export const floatingTags: EffectModule = {
  id: "floating-tags",
  name: "Slogan flottant",
  description:
    "Une phrase-manifeste centrée entourée de pastilles de valeurs et de points qui flottent doucement — la section « valeurs » signature des sites bien-être.",
  kind: "component",
  spaCompatible: true,
  defaultPosition: "replace",
  configSchema: [
    { key: "text", label: "Phrase centrale", type: "text", default: "Mon approche est profondément humaine. Mes valeurs guident chaque échange.", maxLen: 200 },
    { key: "tags", label: "Valeurs (séparées par des virgules)", type: "text", default: "Compassion, Connexion, Écoute, Autonomie, Bienveillance", maxLen: 160 },
    { key: "tagColor", label: "Couleur des pastilles", type: "color", default: "#8d6959" },
    { key: "textColor", label: "Couleur de la phrase", type: "color", default: "#0d0503" },
    { key: "amount", label: "Amplitude du flottement (px)", type: "number", default: 14, min: 4, max: 30 },
  ],
  htmlSnippet: (cfg: EffectConfig) => {
    const text = escapeFxHtml(String(cfg.text ?? ""));
    const tagColor = escapeFxHtml(String(cfg.tagColor ?? "#8d6959"));
    const textColor = escapeFxHtml(String(cfg.textColor ?? "#0d0503"));
    const amount = Number(cfg.amount) || 14;
    const tags = String(cfg.tags ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, SPOTS.length);
    const pills = tags
      .map((t, i) => {
        const dur = (6 + (i % 4) * 0.9).toFixed(1);
        const delay = ((i % 5) * 0.6).toFixed(1);
        return (
          `<span class="sg-fx-ftag" style="${SPOTS[i]};animation-duration:${dur}s;animation-delay:${delay}s">` +
          `${escapeFxHtml(t)}</span>`
        );
      })
      .join("");
    const dots = DOTS.map((d, i) => {
      const dur = (7 + i).toFixed(1);
      return `<span class="sg-fx-fdot" style="${d};animation-duration:${dur}s;animation-delay:${(i * 0.4).toFixed(1)}s"></span>`;
    }).join("");
    return (
      `<section class="sg-fx-slogan" style="--ftag:${tagColor};--ftext:${textColor};--famt:${amount}px">` +
      pills +
      dots +
      `<p class="sg-fx-slogan-text">${text}</p>` +
      `</section>`
    );
  },
  css: [
    ".sg-fx-slogan{position:relative;overflow:visible;max-width:1100px;margin:0 auto;",
    "padding:clamp(4rem,9vw,9rem) 1.5rem;text-align:center}",
    ".sg-fx-slogan-text{position:relative;z-index:2;margin:0 auto;max-width:16em;",
    "font-family:Castoro,Georgia,serif;font-weight:400;letter-spacing:-1px;",
    "font-size:clamp(1.5rem,3.2vw,2.5rem);line-height:1.3;color:var(--ftext,#0d0503)}",
    ".sg-fx-ftag{position:absolute;z-index:1;display:inline-flex;align-items:center;",
    "padding:.34em .9em;border-radius:999px;background:var(--ftag,#8d6959);color:#fff;",
    "font-family:Nunito,system-ui,sans-serif;font-size:14px;font-weight:600;white-space:nowrap;",
    "will-change:transform;animation:sg-float 7s ease-in-out infinite}",
    ".sg-fx-fdot{position:absolute;z-index:1;border-radius:50%;",
    "background:color-mix(in srgb,var(--ftag,#8d6959) 45%,transparent);",
    "will-change:transform;animation:sg-float 8s ease-in-out infinite}",
    "@keyframes sg-float{0%,100%{transform:translateY(calc(var(--famt,14px)*-0.5))}",
    "50%{transform:translateY(calc(var(--famt,14px)*0.5))}}",
    "@media (prefers-reduced-motion:reduce){.sg-fx-ftag,.sg-fx-fdot{animation:none}}",
  ].join("\n"),
  aiGuide: [
    "Slogan flottant : une phrase-manifeste centrée (les valeurs / l'approche du coach ou de la marque) entourée de pastilles de valeurs et de points qui flottent doucement. C'est une SECTION à part entière.",
    "Position : 'replace' une section « valeurs / à propos » purement textuelle, ou 'after' une section de présentation. Ne jamais l'imbriquer 'inside' une section dense — elle a besoin d'espace et de respiration autour.",
    "text : 1 phrase à la 1re personne, ton de la marque, ≤ 160 car. (l'engagement / la philosophie). C'est l'ancre visuelle — la garder courte et forte.",
    "tags : 4 à 8 valeurs d'un mot (Compassion, Écoute, Confiance…), séparées par des virgules. Elles se dispersent automatiquement sur les bords ; au-delà de 8 elles sont ignorées.",
    "tagColor : l'accent terracotta/argile de la DA (texte blanc dessus) ; textColor : l'encre des titres.",
    "amount : 10-16 px pour un flottement délicat ; >20 devient distrayant. Sans effet en prefers-reduced-motion.",
    "Fond conseillé : la couleur de page (crème/clair) — l'effet vit par la dispersion, pas par un fond chargé. Peut très bien se combiner avec un Halo organique (soft-glow) placé derrière.",
  ].join("\n"),
  demo: {
    bg: "#fcfaf7",
    html: `<!--FX-->`,
  },
  accent: { from: "#8d6959", to: "#e1937d" },
};

/** Valeurs de démo (page /api/fx-demo). */
export const floatingTagsDemoConfig: EffectConfig = {
  text: "Mon approche est bien plus que professionnelle — elle est profondément humaine. Mes valeurs guident chaque séance.",
  tags: "Compassion, Connexion, Écoute, Autonomie, Bienveillance",
  tagColor: "#8d6959",
  textColor: "#0d0503",
  amount: 14,
};
