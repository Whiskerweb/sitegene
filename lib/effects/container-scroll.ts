import {
  escapeFxHtml,
  type EffectConfig,
  type EffectModule,
} from "./types";

/**
 * « Mise en scène au scroll » — adaptation vanilla du ContainerScroll
 * d'Aceternity (React/framer-motion) : un grand cadre type écran, incliné à
 * 20° en perspective, se redresse et se cale (scale 1.05→1 desktop, 0.7→0.9
 * mobile) pendant le défilement, tandis que le titre remonte (-100px).
 * L'original pilote rotateX/scale/translateY via useScroll+useTransform ;
 * ici un listener scroll passif + rAF recalcule la progression du bloc dans
 * le viewport et applique les mêmes interpolations.
 */

/** Visuel paysage neutre pour la démo (aucune dépendance réseau). */
const DEMO_IMG =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="720">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="#2b3a67"/><stop offset=".55" stop-color="#5a3a7a"/>` +
      `<stop offset="1" stop-color="#1a1d2e"/></linearGradient></defs>` +
      `<rect width="1400" height="720" fill="url(#g)"/>` +
      `<circle cx="1100" cy="170" r="90" fill="#f7e8b5" opacity=".85"/>` +
      `<path d="M0 560 L340 340 L620 520 L900 300 L1400 560 L1400 720 L0 720 Z" fill="#10131f" opacity=".8"/>` +
      `</svg>`,
  );

export const containerScroll: EffectModule = {
  id: "container-scroll",
  name: "Mise en scène au scroll",
  description:
    "Une grande photo dans un cadre 3D qui se redresse élégamment pendant le défilement, surmontée d'un titre.",
  kind: "component",
  spaCompatible: false,
  defaultPosition: "after",
  configSchema: [
    { key: "title", label: "Petite ligne du titre", type: "text", default: "Découvrez", maxLen: 60 },
    { key: "subtitle", label: "Grande ligne du titre", type: "text", default: "Mon univers", maxLen: 40 },
    { key: "titleColor", label: "Couleur du titre", type: "color", default: "#111111" },
    { key: "imageUrl", label: "Photo mise en scène", type: "url", default: "" },
  ],
  htmlSnippet: (cfg: EffectConfig) => {
    const title = escapeFxHtml(String(cfg.title ?? ""));
    const subtitle = escapeFxHtml(String(cfg.subtitle ?? ""));
    const img = String(cfg.imageUrl ?? "");
    return (
      `<div class="sg-fx-container-scroll" aria-label="${subtitle || title}">` +
      `<div class="sg-fx-cs-inner">` +
      `<div class="sg-fx-cs-title">` +
      (title ? `<h2 class="sg-fx-cs-t1">${title}</h2>` : "") +
      (subtitle ? `<div class="sg-fx-cs-t2">${subtitle}</div>` : "") +
      `</div>` +
      `<div class="sg-fx-cs-card"><div class="sg-fx-cs-screen">` +
      `<img class="sg-fx-cs-img" src="${escapeFxHtml(img)}" alt="" draggable="false">` +
      `</div></div>` +
      `</div></div>`
    );
  },
  css: [
    // Conteneur haut : c'est la traversée du bloc qui pilote l'animation.
    ".sg-fx-container-scroll{height:60rem;display:flex;align-items:center;justify-content:center;position:relative;padding:.5rem;overflow:visible}",
    "@media (min-width:768px){.sg-fx-container-scroll{height:80rem;padding:5rem}}",
    ".sg-fx-cs-inner{padding:2.5rem 0;width:100%;position:relative;perspective:1000px}",
    "@media (min-width:768px){.sg-fx-cs-inner{padding:10rem 0}}",
    ".sg-fx-cs-title{max-width:64rem;margin:0 auto;text-align:center;will-change:transform;color:var(--fx-container-scroll-titleColor,#111)}",
    ".sg-fx-cs-t1{font-size:1.6rem;font-weight:600;margin:0;color:inherit}",
    ".sg-fx-cs-t2{font-size:clamp(2.4rem,6vw,6rem);font-weight:800;line-height:1.05;margin-top:.25rem;color:inherit}",
    ".sg-fx-cs-card{max-width:64rem;margin:-3rem auto 0;height:30rem;width:100%;border:4px solid #6c6c6c;padding:.5rem;background:#222;border-radius:30px;",
    "box-shadow:0 0 #0000004d,0 9px 20px #0000004a,0 37px 37px #00000042,0 84px 50px #00000026,0 149px 60px #0000000a,0 233px 65px #00000003;",
    "transform:rotateX(20deg) scale(1.05);will-change:transform}",
    "@media (min-width:768px){.sg-fx-cs-card{height:40rem;padding:1.5rem}}",
    "@media (max-width:768px){.sg-fx-cs-card{transform:rotateX(20deg) scale(.7)}}",
    ".sg-fx-cs-screen{height:100%;width:100%;overflow:hidden;border-radius:1rem;background:#18181b}",
    "@media (min-width:768px){.sg-fx-cs-screen{padding:1rem}}",
    ".sg-fx-cs-img{width:100%;height:100%;object-fit:cover;object-position:left top;border-radius:.8rem;display:block}",
    "@media (prefers-reduced-motion:reduce){.sg-fx-cs-card{transform:none!important}.sg-fx-cs-title{transform:none!important}}",
  ].join("\n"),
  js: String.raw`
(function(){
  window.__SG_FX_INIT__ = window.__SG_FX_INIT__ || [];
  window.__SG_FX_INIT__.push({ id: 'container-scroll', init: function(){
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches){
      document.querySelectorAll('.sg-fx-cs-card').forEach(function(c){ c.style.transform = 'none'; });
      return;
    }
    var blocks = [];
    document.querySelectorAll('.sg-fx-container-scroll').forEach(function(root){
      if (root.__sgFx) return; root.__sgFx = 1;
      var img = root.querySelector('.sg-fx-cs-img');
      // Filet : pas d'image configurée → réutilise la plus grande photo du site.
      if (img && !img.getAttribute('src')){
        var best = null, bestArea = 0;
        document.querySelectorAll('img').forEach(function(im){
          if (im === img || !im.currentSrc && !im.src) return;
          var a = (im.naturalWidth||0) * (im.naturalHeight||0);
          if (a > bestArea){ bestArea = a; best = im; }
        });
        if (best) img.src = best.currentSrc || best.src;
      }
      blocks.push({ root: root, title: root.querySelector('.sg-fx-cs-title'), card: root.querySelector('.sg-fx-cs-card') });
    });
    if (!blocks.length) return;
    function clamp01(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }
    var ticking = false;
    function update(){
      ticking = false;
      var vh = window.innerHeight || 1;
      var mobile = window.innerWidth <= 768;
      for (var i = 0; i < blocks.length; i++){
        var b = blocks[i], r = b.root.getBoundingClientRect();
        var total = r.height - vh;
        // Progression de la traversée du bloc (équiv. useScroll target start/end).
        var p = total > 60 ? clamp01(-r.top / total) : clamp01((vh - r.top) / (vh + r.height));
        var rot = 20 - 20 * p;
        var sc = mobile ? (0.7 + 0.2 * p) : (1.05 - 0.05 * p);
        if (b.card) b.card.style.transform = 'rotateX(' + rot.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
        if (b.title) b.title.style.transform = 'translateY(' + (-100 * p).toFixed(1) + 'px)';
      }
    }
    function onScroll(){ if (!ticking){ ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }});
})();
`,
  aiGuide: [
    "Mise en scène au scroll (ContainerScroll) : un grand cadre type écran contenant UNE photo, incliné à 20°, se redresse pendant que l'utilisateur défile ; un titre en deux lignes surplombe le cadre et remonte doucement.",
    "Bloc TRÈS HAUT (60rem mobile / 80rem desktop) : il a besoin de piste de scroll. Ne JAMAIS l'insérer 'inside' une petite section.",
    "Position idéale : 'after' la section hero (cas le plus courant) ou 'replace' une section qui ne contient qu'une grande image/galerie simple.",
    "title = accroche courte au-dessus (3-6 mots, ex. « Découvrez mon travail ») ; subtitle = 1-3 mots forts en très grand (ex. « Lumière naturelle ») — reprendre le ton et le vocabulaire du site, en français.",
    "imageUrl : choisir parmi les photos existantes du site (liste fournie) une image LARGE/paysage représentative (hero ou meilleure photo de galerie). Si aucune liste n'est fournie, laisser vide : le script réutilise automatiquement la plus grande photo de la page.",
    "titleColor : doit contraster avec le fond de la page à l'endroit d'insertion (fond clair → couleur sombre du site ; fond sombre → blanc cassé). Le cadre lui-même est sombre (#222) et fonctionne sur tout fond.",
  ].join("\n"),
  demo: {
    bg: "#f5f3ee",
    html:
      `<div style="height:38vh;display:grid;place-items:center;color:#8a8577;font:500 14px system-ui">` +
      `↓ Faites défiler — l'écran se redresse ↓</div>` +
      `<!--FX-->` +
      `<div style="height:30vh"></div>`,
  },
  accent: { from: "#2b3a67", to: "#7a4d8f" },
};

/** Valeurs de démo (page /api/fx-demo) : l'effet réel, avec un visuel neutre. */
export const containerScrollDemoConfig: EffectConfig = {
  title: "Découvrez",
  subtitle: "Mon univers",
  titleColor: "#23201a",
  imageUrl: DEMO_IMG,
};
