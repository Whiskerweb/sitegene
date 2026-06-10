import {
  escapeFxHtml,
  type EffectConfig,
  type EffectModule,
} from "./types";

/**
 * « Image au scroll » — l'effet vu sur reyou.life : une photo dans un cadre
 * fixe (la fenêtre ne bouge pas dans la page) tandis que l'image GLISSE
 * verticalement à l'intérieur pendant le défilement, révélant tour à tour le
 * haut puis le bas du cliché. L'équivalent React serait un useScroll +
 * useTransform sur translateY ; ici un listener scroll passif + rAF recalcule
 * la traversée du bloc dans le viewport et applique le déplacement.
 *
 * L'image est sur-dimensionnée (scale = 1 + amount/100) : le déplacement est
 * borné à cette marge de débordement, donc aucune zone vide n'apparaît jamais
 * dans le cadre, quelle que soit l'amplitude.
 */

/**
 * Vraie photo servie en local par l'app : un photographe au sommet d'une
 * montagne (ciel dégagé en haut, mer de nuages au milieu, rocher détaillé en
 * bas) — forte profondeur verticale, donc le glissement de l'image est
 * immédiatement lisible. Sujet pertinent pour la cible (photographes), aucune
 * dépendance réseau externe.
 */
const DEMO_IMG = "/landing/showcase.jpg";

export const parallaxImage: EffectModule = {
  id: "parallax-image",
  name: "Image au scroll",
  description:
    "Une photo qui glisse en douceur, avec inertie, vers le haut à l'intérieur de son cadre pendant le défilement, sans jamais bouger le cadre lui-même.",
  kind: "component",
  spaCompatible: false,
  defaultPosition: "after",
  configSchema: [
    { key: "imageUrl", label: "Photo", type: "url", default: "" },
    { key: "height", label: "Hauteur du cadre (vh)", type: "number", default: 70, min: 30, max: 95 },
    { key: "amount", label: "Amplitude du mouvement", type: "number", default: 22, min: 8, max: 40 },
    { key: "smoothness", label: "Fluidité du glissement", type: "number", default: 70, min: 0, max: 95 },
    { key: "radius", label: "Arrondi des coins (px)", type: "number", default: 24, min: 0, max: 48 },
    { key: "overlay", label: "Assombrissement (%)", type: "number", default: 0, min: 0, max: 80 },
    { key: "title", label: "Titre superposé (optionnel)", type: "text", default: "", maxLen: 80 },
    { key: "titleColor", label: "Couleur du titre", type: "color", default: "#ffffff" },
    { key: "reverse", label: "Inverser le sens", type: "boolean", default: false },
  ],
  htmlSnippet: (cfg: EffectConfig) => {
    const img = String(cfg.imageUrl ?? "");
    const title = escapeFxHtml(String(cfg.title ?? ""));
    return (
      `<div class="sg-fx-parallax" aria-label="${title || "image"}">` +
      `<img class="sg-fx-parallax-img" src="${escapeFxHtml(img)}" alt="" draggable="false">` +
      `<div class="sg-fx-parallax-overlay"></div>` +
      (title
        ? `<div class="sg-fx-parallax-content"><h2 class="sg-fx-parallax-title">${title}</h2></div>`
        : "") +
      `</div>`
    );
  },
  css: [
    ".sg-fx-parallax{position:relative;overflow:hidden;width:100%;",
    "height:calc(var(--fx-parallax-image-height,70)*1vh);",
    "border-radius:calc(var(--fx-parallax-image-radius,24)*1px)}",
    ".sg-fx-parallax-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;",
    "display:block;will-change:transform;transform-origin:center;",
    "transform:scale(calc(1 + var(--fx-parallax-image-amount,22)/100))}",
    ".sg-fx-parallax-overlay{position:absolute;inset:0;pointer-events:none;",
    "background:rgba(0,0,0,calc(var(--fx-parallax-image-overlay,0)/100))}",
    ".sg-fx-parallax-content{position:relative;z-index:2;display:flex;height:100%;width:100%;",
    "align-items:flex-end;padding:clamp(1.5rem,4vw,3.5rem)}",
    ".sg-fx-parallax-title{margin:0;max-width:16em;font-weight:600;line-height:1.04;",
    "font-size:clamp(2rem,5vw,3.75rem);color:var(--fx-parallax-image-titleColor,#fff);",
    "text-shadow:0 2px 30px rgba(0,0,0,.35)}",
    "@media (prefers-reduced-motion:reduce){.sg-fx-parallax-img{transform:scale(1)!important}}",
  ].join("\n"),
  js: String.raw`
(function(){
  window.__SG_FX_INIT__ = window.__SG_FX_INIT__ || [];
  window.__SG_FX_INIT__.push({ id: 'parallax-image', init: function(cfg){
    cfg = cfg || {};
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var amount = Number(cfg.amount) || 22;
    var rev = !!cfg.reverse;
    var zoom = 1 + amount / 100;
    var overscan = (zoom - 1) / 2;     // marge de débordement (haut/bas)
    var intensity = 0.92;              // garde un cheveu de sécurité anti-vide
    var sm = Number(cfg.smoothness); if (!isFinite(sm)) sm = 70;
    // Plus la fluidité est haute, plus l'image traîne derrière le scroll (lerp).
    // 0 → suit le scroll au pixel ; 70 ≈ 0.13 (soyeux) ; 95 ≈ 0.05 (très planant).
    var ease = Math.max(0.05, Math.pow(1 - sm / 100, 2) * 0.95 + 0.05);
    var blocks = [];
    document.querySelectorAll('.sg-fx-parallax').forEach(function(root){
      if (root.__sgFx) return; root.__sgFx = 1;
      var img = root.querySelector('.sg-fx-parallax-img');
      if (!img) return;
      // Filet : pas d'image configurée → réutilise la plus grande photo du site.
      if (!img.getAttribute('src')){
        var best = null, bestArea = 0;
        document.querySelectorAll('img').forEach(function(im){
          if (im === img) return;
          var a = (im.naturalWidth || 0) * (im.naturalHeight || 0);
          if (a > bestArea){ bestArea = a; best = im; }
        });
        if (best) img.src = best.currentSrc || best.src;
      }
      img.style.transform = 'scale(' + zoom.toFixed(4) + ')';
      blocks.push({ root: root, img: img, cur: NaN });
    });
    if (!blocks.length) return;
    function clamp01(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }
    // translateY cible (px) du bloc selon sa traversée du viewport (start→end).
    function targetOf(b){
      var vh = window.innerHeight || 1;
      var r = b.root.getBoundingClientRect();
      var p = clamp01((vh - r.top) / (vh + r.height));
      var maxPx = overscan * r.height * intensity;
      var base = rev ? -maxPx : maxPx;
      return base - 2 * base * p;       // p=0 → +base, p=1 → -base
    }
    var running = false;
    function frame(){
      running = false;
      var moving = false;
      for (var i = 0; i < blocks.length; i++){
        var b = blocks[i], t = targetOf(b);
        if (isNaN(b.cur)) b.cur = t;                 // chargement → cale sans animer
        else b.cur += (t - b.cur) * ease;            // lerp : l'image rattrape en douceur
        if (Math.abs(t - b.cur) > 0.08) moving = true; else b.cur = t;
        b.img.style.transform = 'translateY(' + b.cur.toFixed(2) + 'px) scale(' + zoom.toFixed(4) + ')';
      }
      if (moving) { running = true; requestAnimationFrame(frame); }
    }
    function kick(){ if (!running){ running = true; requestAnimationFrame(frame); } }
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);
    frame();                            // premier rendu (calage immédiat)
  }});
})();
`,
  aiGuide: [
    "Image au scroll (parallaxe vertical à la reyou.life) : une photo glisse lentement à l'intérieur d'un cadre fixe pendant que l'utilisateur défile — le cadre reste en place dans la mise en page, seule l'image bouge, révélant son haut puis son bas.",
    "Position idéale : 'after' une section (bannière de respiration entre deux blocs de contenu) ou 'replace' une section qui n'est qu'une grande image/bannière statique. Évite 'inside' une petite section au texte dense.",
    "imageUrl : choisir parmi les photos existantes du site une image VERTICALE ou paysage avec du détail en haut ET en bas (ciel/sujet en haut, sol/premier plan en bas) — c'est là que le glissement se voit le mieux. Si aucune liste n'est fournie, laisser vide : le script réutilise la plus grande photo de la page.",
    "height : 60-80 (vh) pour une bannière immersive, 40-50 pour un bandeau plus discret.",
    "amount : 16-24 pour un mouvement élégant et naturel ; >30 devient théâtral. C'est aussi le sur-zoom de l'image, donc plus l'amplitude est forte, plus l'image est recadrée serré.",
    "smoothness (0-95) : le lissage inertiel — l'image traîne en douceur derrière le scroll au lieu d'y coller. 65-75 = le rendu soyeux « reyou » recommandé ; >85 = très planant ; 0 = colle au scroll au pixel (rendu sec). Sans effet en prefers-reduced-motion.",
    "title (optionnel) : courte accroche posée en bas du cadre (3-6 mots, ton du site, en français). Si renseigné, monter overlay à 25-40 (%) pour garder le texte lisible et régler titleColor en blanc cassé sur photo sombre.",
    "reverse : laisser false dans la quasi-totalité des cas (l'image monte au scroll, sens attendu). N'activer que pour un contraste volontaire avec un autre bloc parallaxe au-dessus.",
  ].join("\n"),
  demo: {
    bg: "#1a1410",
    html:
      `<div style="height:42vh;display:grid;place-items:center;color:#b69a82;font:500 14px system-ui">` +
      `↓ Faites défiler — l'image monte dans son cadre ↓</div>` +
      `<!--FX-->` +
      `<div style="height:60vh"></div>`,
  },
  accent: { from: "#e0a36f", to: "#5b4636" },
};

/** Valeurs de démo (page /api/fx-demo) : l'effet réel, visuel neutre. */
export const parallaxImageDemoConfig: EffectConfig = {
  imageUrl: DEMO_IMG,
  height: 72,
  amount: 28,
  smoothness: 72,
  radius: 24,
  overlay: 32,
  title: "Prenez de la hauteur.",
  titleColor: "#ffffff",
  reverse: false,
};
