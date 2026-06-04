import {
  escapeFxHtml,
  type EffectConfig,
  type EffectModule,
} from "./types";

/**
 * « Témoignages en carrousel 3D » — adaptation vanilla du CircularTestimonials
 * (React/framer-motion) : 3 visuels empilés en perspective (centre net, voisins
 * inclinés rotateY ±15° et surélevés), citation révélée MOT À MOT (blur→net,
 * délai 25 ms/mot), autoplay 5 s, flèches + clavier. Les useTransform/
 * AnimatePresence sont réimplémentés en transitions CSS + reconstruction des
 * spans à chaque changement.
 */

const ARROW_LEFT =
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
  `<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>`;
const ARROW_RIGHT =
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
  `<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;

export const circularTestimonials: EffectModule = {
  id: "circular-testimonials",
  name: "Témoignages carrousel 3D",
  description:
    "Trois avis clients haut de gamme : portraits en perspective, citation qui se révèle mot à mot, navigation fluide.",
  kind: "component",
  spaCompatible: false,
  defaultPosition: "replace",
  configSchema: [
    { key: "nameColor", label: "Couleur des noms", type: "color", default: "#0a0a0a" },
    { key: "mutedColor", label: "Couleur des sous-titres", type: "color", default: "#454545" },
    { key: "textColor", label: "Couleur des citations", type: "color", default: "#171717" },
    { key: "accent", label: "Couleur d'accent (flèches)", type: "color", default: "#00a6fb" },
    { key: "autoplay", label: "Défilement automatique", type: "boolean", default: true },
    { key: "quote1", label: "Avis 1", type: "text", default: "Des images d'une justesse rare — chaque détail de la journée est là, sublimé.", maxLen: 220 },
    { key: "name1", label: "Nom 1", type: "text", default: "Tamar M.", maxLen: 30 },
    { key: "role1", label: "Contexte 1", type: "text", default: "Mariage", maxLen: 40 },
    { key: "img1", label: "Photo 1", type: "url", default: "" },
    { key: "quote2", label: "Avis 2", type: "text", default: "Une expérience au-delà de nos attentes, une équipe attentive du début à la fin.", maxLen: 220 },
    { key: "name2", label: "Nom 2", type: "text", default: "Joe C.", maxLen: 30 },
    { key: "role2", label: "Contexte 2", type: "text", default: "Portrait", maxLen: 40 },
    { key: "img2", label: "Photo 2", type: "url", default: "" },
    { key: "quote3", label: "Avis 3", type: "text", default: "Le service et l'attention portée aux détails ont rendu ce moment inoubliable.", maxLen: 220 },
    { key: "name3", label: "Nom 3", type: "text", default: "Martina E.", maxLen: 30 },
    { key: "role3", label: "Contexte 3", type: "text", default: "Événement", maxLen: 40 },
    { key: "img3", label: "Photo 3", type: "url", default: "" },
  ],
  htmlSnippet: (cfg: EffectConfig) => {
    const s = (k: string) => escapeFxHtml(String(cfg[k] ?? ""));
    const data = [1, 2, 3].map((i) => ({
      quote: String(cfg[`quote${i}`] ?? ""),
      name: String(cfg[`name${i}`] ?? ""),
      role: String(cfg[`role${i}`] ?? ""),
      img: String(cfg[`img${i}`] ?? ""),
    }));
    const payload = escapeFxHtml(JSON.stringify(data));
    return (
      `<div class="sg-fx-circular-testimonials" data-fx-items="${payload}" aria-label="Témoignages">` +
      `<div class="sg-fx-ct-grid">` +
      `<div class="sg-fx-ct-images">` +
      `<img src="${s("img1")}" alt="${s("name1")}" draggable="false">` +
      `<img src="${s("img2")}" alt="${s("name2")}" draggable="false">` +
      `<img src="${s("img3")}" alt="${s("name3")}" draggable="false">` +
      `</div>` +
      `<div class="sg-fx-ct-content">` +
      `<div class="sg-fx-ct-text">` +
      `<h3 class="sg-fx-ct-name"></h3>` +
      `<p class="sg-fx-ct-role"></p>` +
      `<p class="sg-fx-ct-quote"></p>` +
      `</div>` +
      `<div class="sg-fx-ct-arrows">` +
      `<button type="button" class="sg-fx-ct-btn sg-fx-ct-prev" aria-label="Témoignage précédent">${ARROW_LEFT}</button>` +
      `<button type="button" class="sg-fx-ct-btn sg-fx-ct-next" aria-label="Témoignage suivant">${ARROW_RIGHT}</button>` +
      `</div></div></div></div>`
    );
  },
  css: [
    ".sg-fx-circular-testimonials{width:100%;max-width:56rem;padding:2rem;margin:0 auto;box-sizing:border-box}",
    ".sg-fx-ct-grid{display:grid;gap:3rem}",
    "@media (min-width:768px){.sg-fx-ct-grid{grid-template-columns:1fr 1fr;gap:5rem}}",
    ".sg-fx-ct-images{position:relative;width:100%;height:20rem;perspective:1000px}",
    "@media (min-width:768px){.sg-fx-ct-images{height:24rem}}",
    ".sg-fx-ct-images img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:1.5rem;",
    "box-shadow:0 10px 30px rgba(0,0,0,.2);opacity:0;pointer-events:none;",
    "transition:all .8s cubic-bezier(.4,2,.3,1);will-change:transform,opacity}",
    ".sg-fx-ct-content{display:flex;flex-direction:column;justify-content:space-between;gap:1.5rem}",
    ".sg-fx-ct-name{font-weight:700;margin:0 0 .25rem;font-size:1.75rem;color:var(--fx-circular-testimonials-nameColor,#0a0a0a)}",
    ".sg-fx-ct-role{margin:0 0 1.4rem;font-size:1rem;color:var(--fx-circular-testimonials-mutedColor,#454545)}",
    ".sg-fx-ct-quote{line-height:1.75;margin:0;font-size:1.15rem;color:var(--fx-circular-testimonials-textColor,#171717)}",
    ".sg-fx-ct-quote span{display:inline-block;opacity:0;transform:translateY(5px);filter:blur(10px);",
    "animation:sg-fx-ct-word .22s ease-in-out forwards}",
    "@keyframes sg-fx-ct-word{to{opacity:1;transform:none;filter:blur(0)}}",
    ".sg-fx-ct-text.is-in .sg-fx-ct-name,.sg-fx-ct-text.is-in .sg-fx-ct-role{animation:sg-fx-ct-fade .3s ease-in-out}",
    "@keyframes sg-fx-ct-fade{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}",
    ".sg-fx-ct-arrows{display:flex;gap:1.5rem}",
    ".sg-fx-ct-btn{width:2.7rem;height:2.7rem;border-radius:50%;display:flex;align-items:center;justify-content:center;",
    "cursor:pointer;border:none;padding:0;background:#141414;color:#f1f1f7;transition:background-color .3s}",
    ".sg-fx-ct-btn:hover{background:var(--fx-circular-testimonials-accent,#00a6fb)}",
    ".sg-fx-ct-btn svg{width:1.45rem;height:1.45rem}",
    "@media (prefers-reduced-motion:reduce){.sg-fx-ct-images img{transition:opacity .3s ease}",
    ".sg-fx-ct-quote span{animation:none;opacity:1;transform:none;filter:none}}",
  ].join("\n"),
  js: String.raw`
(function(){
  window.__SG_FX_INIT__ = window.__SG_FX_INIT__ || [];
  window.__SG_FX_INIT__.push({ id: 'circular-testimonials', init: function(cfg){
    var autoplay = !cfg || cfg.autoplay !== false;
    document.querySelectorAll('.sg-fx-circular-testimonials').forEach(function(root){
      if (root.__sgFx) return; root.__sgFx = 1;
      var items = [];
      try { items = JSON.parse(root.getAttribute('data-fx-items') || '[]'); } catch (e) {}
      var imgs = Array.prototype.slice.call(root.querySelectorAll('.sg-fx-ct-images img'));
      var wrap = root.querySelector('.sg-fx-ct-images');
      var textBox = root.querySelector('.sg-fx-ct-text');
      var nameEl = root.querySelector('.sg-fx-ct-name');
      var roleEl = root.querySelector('.sg-fx-ct-role');
      var quoteEl = root.querySelector('.sg-fx-ct-quote');
      if (!imgs.length || !items.length) return;
      // Photos absentes → réutilise les plus grandes images du site.
      var missing = imgs.filter(function(im){ return !im.getAttribute('src'); });
      if (missing.length){
        var pool = [];
        document.querySelectorAll('img').forEach(function(im){
          if (imgs.indexOf(im) > -1) return;
          var a = (im.naturalWidth || 0) * (im.naturalHeight || 0);
          if (a > 40000) pool.push({ a: a, src: im.currentSrc || im.src });
        });
        pool.sort(function(x, y){ return y.a - x.a; });
        missing.forEach(function(im, i){ if (pool[i]) im.src = pool[i].src; });
      }
      var n = imgs.length, active = 0, timer = null;
      var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      function gap(){
        var w = wrap.offsetWidth || 1200;
        if (w <= 1024) return 60;
        if (w >= 1456) return Math.max(60, 86 + 0.06018 * (w - 1456));
        return 60 + 26 * ((w - 1024) / 432);
      }
      function layout(){
        var g = gap(), up = g * 0.8;
        for (var i = 0; i < n; i++){
          var im = imgs[i], st = im.style;
          var isActive = i === active;
          var isLeft = (active - 1 + n) % n === i;
          var isRight = (active + 1) % n === i;
          if (isActive){ st.zIndex = 3; st.opacity = 1; st.transform = 'translateX(0) translateY(0) scale(1) rotateY(0)'; }
          else if (isLeft){ st.zIndex = 2; st.opacity = 1; st.transform = 'translateX(-' + g + 'px) translateY(-' + up + 'px) scale(.85) rotateY(15deg)'; }
          else if (isRight){ st.zIndex = 2; st.opacity = 1; st.transform = 'translateX(' + g + 'px) translateY(-' + up + 'px) scale(.85) rotateY(-15deg)'; }
          else { st.zIndex = 1; st.opacity = 0; }
        }
      }
      function renderText(){
        var it = items[active] || {};
        nameEl.textContent = it.name || '';
        roleEl.textContent = it.role || '';
        while (quoteEl.firstChild) quoteEl.removeChild(quoteEl.firstChild);
        String(it.quote || '').split(' ').forEach(function(word, i){
          var sp = document.createElement('span');
          sp.textContent = word + ' ';
          if (!reduced) sp.style.animationDelay = (0.025 * i).toFixed(3) + 's';
          quoteEl.appendChild(sp);
        });
        textBox.classList.remove('is-in');
        void textBox.offsetWidth; // retrigger l'animation name/role
        textBox.classList.add('is-in');
      }
      function go(dir){
        active = (active + dir + n) % n;
        layout(); renderText();
      }
      function stop(){ if (timer){ clearInterval(timer); timer = null; } }
      root.querySelector('.sg-fx-ct-prev').addEventListener('click', function(){ stop(); go(-1); });
      root.querySelector('.sg-fx-ct-next').addEventListener('click', function(){ stop(); go(1); });
      window.addEventListener('keydown', function(e){
        var r = root.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return; // hors écran
        if (e.key === 'ArrowLeft'){ stop(); go(-1); }
        if (e.key === 'ArrowRight'){ stop(); go(1); }
      });
      window.addEventListener('resize', layout);
      if (autoplay && !reduced) timer = setInterval(function(){ go(1); }, 5000);
      layout(); renderText();
    });
  }});
})();
`,
  aiGuide: [
    "Témoignages carrousel 3D (CircularTestimonials) : 3 visuels empilés en perspective (le central net, les voisins inclinés et surélevés), citation révélée mot à mot, flèches de navigation + autoplay 5 s. Rendu très haut de gamme.",
    "Position idéale : 'replace' la section témoignages/avis existante, sinon 'after' la galerie ou les services. Le bloc fait ~34rem de haut en desktop (2 colonnes) et passe en 1 colonne en mobile automatiquement.",
    "img1..3 : ÉLÉMENT CLÉ — choisir parmi les photos existantes du site (liste fournie) : portraits, couples ou photos de prestation, idéalement verticales ou carrées. Si on n'a pas la liste, laisser vide : le script réutilise automatiquement les plus grandes photos de la page.",
    "quote1..3 : avis réels du site si présents (≤ 200 caractères), sinon avis plausibles en français, spécifiques au métier. name = « Prénom I. », role = contexte de la prestation (ex. « Mariée — Château de Vair »).",
    "Couleurs selon le FOND de la section ciblée : fond clair → nameColor #0a0a0a, textColor #171717, mutedColor #454545 ; fond sombre → nameColor #f7f7ff, textColor #f1f1f7, mutedColor #e1e1e1. accent = couleur d'accent du site (hover des flèches).",
    "autoplay : true par défaut, mettre false uniquement si l'utilisateur le demande. Le responsive est intégré : ne rien adapter.",
  ].join("\n"),
  demo: {
    bg: "#f7f7fa",
    html:
      `<div style="min-height:100vh;display:grid;place-items:center;padding:2rem 0">` +
      `<!--FX-->` +
      `</div>`,
  },
  accent: { from: "#0582ca", to: "#00a6fb" },
};

/** Démo : photos remplacées par des dégradés neutres (aucun réseau). */
function demoImg(a: string, b: string, label: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="760">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>` +
    `</linearGradient></defs><rect width="680" height="760" fill="url(#g)"/>` +
    `<circle cx="340" cy="300" r="110" fill="#ffffff" opacity=".25"/>` +
    `<rect x="190" y="430" width="300" height="210" rx="105" fill="#ffffff" opacity=".18"/>` +
    `<text x="50%" y="92%" text-anchor="middle" font-family="system-ui" font-size="34" fill="#ffffff" opacity=".6">${label}</text></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

export const circularTestimonialsDemoConfig: EffectConfig = {
  img1: demoImg("#2b3a67", "#5a3a7a", "Tamar"),
  img2: demoImg("#7a4d3a", "#b08968", "Joe"),
  img3: demoImg("#3a6b5a", "#88b04b", "Martina"),
};
