import { initialAvatarRect } from "./avatar";
import {
  escapeFxHtml,
  type EffectConfig,
  type EffectModule,
} from "./types";

/**
 * « Frise de témoignages » — adaptation vanilla du StaggerTestimonials
 * (React/shadcn) : cartes carrées à coin coupé (clip-path + trait diagonal)
 * étalées horizontalement depuis le centre, la centrale en couleur d'accent,
 * surélevée et ombrée « hard ». Clic sur une carte ou chevrons pour faire
 * défiler (rotation d'une liste, le « wrap » saute sans transition comme le
 * remount React de l'original).
 */

const CHEVRON_LEFT =
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>`;
const CHEVRON_RIGHT =
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>`;

export const staggerTestimonials: EffectModule = {
  id: "stagger-testimonials",
  name: "Frise de témoignages",
  description:
    "Une frise de cartes d'avis qui défilent d'un clic — la carte centrale, en couleur, attire l'œil.",
  kind: "component",
  spaCompatible: false,
  defaultPosition: "replace",
  configSchema: [
    { key: "accent", label: "Couleur de la carte centrale", type: "color", default: "#0f766e" },
    { key: "border", label: "Couleur des bordures", type: "color", default: "#cbd5e1" },
    { key: "cardBg", label: "Fond des cartes", type: "color", default: "#ffffff" },
    { key: "quote1", label: "Avis 1", type: "text", default: "Un travail d'une précision rare, livré plus vite que prévu.", maxLen: 120 },
    { key: "by1", label: "Auteur 1", type: "text", default: "Alex, chef d'entreprise", maxLen: 40 },
    { key: "quote2", label: "Avis 2", type: "text", default: "On s'est sentis écoutés du premier rendez-vous à la livraison.", maxLen: 120 },
    { key: "by2", label: "Auteur 2", type: "text", default: "Dana, mariée en 2025", maxLen: 40 },
    { key: "quote3", label: "Avis 3", type: "text", default: "Le résultat dépasse tout ce qu'on avait imaginé.", maxLen: 120 },
    { key: "by3", label: "Auteur 3", type: "text", default: "Stéphanie, directrice com", maxLen: 40 },
    { key: "quote4", label: "Avis 4", type: "text", default: "Réactif, créatif, professionnel : je recommande les yeux fermés.", maxLen: 120 },
    { key: "by4", label: "Auteur 4", type: "text", default: "Marie, organisatrice", maxLen: 40 },
    { key: "quote5", label: "Avis 5", type: "text", default: "Si je pouvais mettre 11 étoiles, j'en mettrais 12.", maxLen: 120 },
    { key: "by5", label: "Auteur 5", type: "text", default: "André, restaurateur", maxLen: 40 },
    { key: "quote6", label: "Avis 6", type: "text", default: "Des souvenirs sublimés, on revit la journée à chaque photo.", maxLen: 120 },
    { key: "by6", label: "Auteur 6", type: "text", default: "Jérémy & Lou, mariés", maxLen: 40 },
  ],
  htmlSnippet: (cfg: EffectConfig) => {
    const accent = String(cfg.accent ?? "#0f766e");
    let cards = "";
    for (let i = 1; i <= 6; i++) {
      const quote = escapeFxHtml(String(cfg[`quote${i}`] ?? ""));
      const byRaw = String(cfg[`by${i}`] ?? "");
      const by = escapeFxHtml(byRaw);
      cards +=
        `<div class="sg-fx-sgt-card" role="button" tabindex="0">` +
        `<span class="sg-fx-sgt-line"></span>` +
        `<img src="${initialAvatarRect(byRaw, accent)}" alt="" draggable="false">` +
        `<h3>«&nbsp;${quote}&nbsp;»</h3>` +
        `<p class="sg-fx-sgt-by">— ${by}</p>` +
        `</div>`;
    }
    return (
      `<div class="sg-fx-stagger-testimonials" aria-label="Témoignages">` +
      cards +
      `<div class="sg-fx-sgt-nav">` +
      `<button type="button" class="sg-fx-sgt-prev" aria-label="Témoignage précédent">${CHEVRON_LEFT}</button>` +
      `<button type="button" class="sg-fx-sgt-next" aria-label="Témoignage suivant">${CHEVRON_RIGHT}</button>` +
      `</div></div>`
    );
  },
  css: [
    ".sg-fx-stagger-testimonials{position:relative;width:100%;overflow:hidden;height:600px;",
    "background:color-mix(in srgb,var(--fx-stagger-testimonials-border,#cbd5e1) 14%,transparent)}",
    ".sg-fx-sgt-card{position:absolute;left:50%;top:50%;cursor:pointer;box-sizing:border-box;padding:2rem;",
    "border:2px solid var(--fx-stagger-testimonials-border,#cbd5e1);",
    "background:var(--fx-stagger-testimonials-cardBg,#fff);color:#1f2937;",
    "transition:all .5s ease-in-out;will-change:transform;",
    "clip-path:polygon(50px 0%,calc(100% - 50px) 0%,100% 50px,100% 100%,calc(100% - 50px) 100%,50px 100%,0 100%,0 0)}",
    ".sg-fx-sgt-card:hover{border-color:color-mix(in srgb,var(--fx-stagger-testimonials-accent,#0f766e) 50%,var(--fx-stagger-testimonials-border,#cbd5e1))}",
    ".sg-fx-sgt-card.is-center{background:var(--fx-stagger-testimonials-accent,#0f766e);color:#fff;",
    "border-color:var(--fx-stagger-testimonials-accent,#0f766e);",
    "box-shadow:0 8px 0 4px var(--fx-stagger-testimonials-border,#cbd5e1)}",
    ".sg-fx-sgt-line{position:absolute;display:block;transform-origin:top right;transform:rotate(45deg);",
    "background:var(--fx-stagger-testimonials-border,#cbd5e1);right:-2px;top:48px;width:70.71px;height:2px}",
    ".sg-fx-sgt-card img{margin:0 0 1rem;height:3.5rem;width:3rem;object-fit:cover;object-position:top;display:block;",
    "box-shadow:3px 3px 0 color-mix(in srgb,var(--fx-stagger-testimonials-border,#cbd5e1) 40%,#fff)}",
    ".sg-fx-sgt-card h3{font-size:1.05rem;font-weight:500;margin:0;line-height:1.45}",
    "@media (min-width:640px){.sg-fx-sgt-card h3{font-size:1.18rem}}",
    ".sg-fx-sgt-by{position:absolute;bottom:2rem;left:2rem;right:2rem;font-size:.875rem;font-style:italic;opacity:.8;margin:0}",
    ".sg-fx-sgt-nav{position:absolute;bottom:1rem;left:50%;transform:translateX(-50%);display:flex;gap:.5rem;z-index:20}",
    ".sg-fx-sgt-nav button{display:flex;height:3.5rem;width:3.5rem;align-items:center;justify-content:center;padding:0;",
    "background:var(--fx-stagger-testimonials-cardBg,#fff);border:2px solid var(--fx-stagger-testimonials-border,#cbd5e1);",
    "color:#1f2937;cursor:pointer;transition:background-color .3s,color .3s}",
    ".sg-fx-sgt-nav button:hover{background:var(--fx-stagger-testimonials-accent,#0f766e);color:#fff;",
    "border-color:var(--fx-stagger-testimonials-accent,#0f766e)}",
    ".sg-fx-sgt-nav button svg{width:1.6rem;height:1.6rem}",
    "@media (prefers-reduced-motion:reduce){.sg-fx-sgt-card{transition:none}}",
  ].join("\n"),
  js: String.raw`
(function(){
  window.__SG_FX_INIT__ = window.__SG_FX_INIT__ || [];
  window.__SG_FX_INIT__.push({ id: 'stagger-testimonials', init: function(){
    document.querySelectorAll('.sg-fx-stagger-testimonials').forEach(function(root){
      if (root.__sgFx) return; root.__sgFx = 1;
      var cards = Array.prototype.slice.call(root.querySelectorAll('.sg-fx-sgt-card'));
      var n = cards.length; if (n < 3) return;
      var order = cards.map(function(_, i){ return i; }); // order[k] = index carte au cran k
      var prevPos = {};
      function cardSize(){ return (window.matchMedia && matchMedia('(min-width:640px)').matches) ? 365 : 290; }
      function apply(){
        var size = cardSize();
        for (var k = 0; k < n; k++){
          var idx = order[k], el = cards[idx];
          var position = (n % 2) ? (k - (n + 1) / 2) : (k - n / 2);
          var isCenter = position === 0;
          var wrapped = prevPos[idx] !== undefined && Math.abs(prevPos[idx] - position) > n / 2;
          if (wrapped) el.style.transition = 'none';
          el.classList.toggle('is-center', isCenter);
          el.style.width = size + 'px';
          el.style.height = size + 'px';
          el.style.zIndex = String(isCenter ? 10 : 5 - Math.min(4, Math.abs(position)));
          el.style.transform = 'translate(-50%,-50%) translateX(' + ((size / 1.5) * position).toFixed(1) + 'px) translateY(' + (isCenter ? -65 : (position % 2 ? 15 : -15)) + 'px) rotate(' + (isCenter ? 0 : (position % 2 ? 2.5 : -2.5)) + 'deg)';
          el.setAttribute('data-position', String(position));
          if (wrapped){ void el.offsetWidth; el.style.transition = ''; }
          prevPos[idx] = position;
        }
      }
      function move(steps){
        if (!steps) return;
        if (steps > 0) for (var i = 0; i < steps; i++) order.push(order.shift());
        else for (var j = 0; j > steps; j--) order.unshift(order.pop());
        apply();
      }
      cards.forEach(function(el){
        el.addEventListener('click', function(){ move(parseInt(el.getAttribute('data-position') || '0', 10)); });
        el.addEventListener('keydown', function(e){
          if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); move(parseInt(el.getAttribute('data-position') || '0', 10)); }
        });
      });
      root.querySelector('.sg-fx-sgt-prev').addEventListener('click', function(){ move(-1); });
      root.querySelector('.sg-fx-sgt-next').addEventListener('click', function(){ move(1); });
      window.addEventListener('resize', apply);
      apply();
    });
  }});
})();
`,
  aiGuide: [
    "Frise de témoignages (StaggerTestimonials) : cartes carrées à coin coupé étalées horizontalement, la centrale en couleur d'accent, surélevée. Clic sur une carte ou chevrons pour faire défiler. Bloc PLEINE LARGEUR, 600px de haut.",
    "Position idéale : 'replace' la section témoignages existante, sinon 'after' une section services/tarifs. Jamais dans une colonne étroite ni 'inside' une petite section.",
    "quote1..6 : SIX avis courts (≤ 110 caractères), français naturel, spécifiques au métier du site — réutiliser les avis réels du site en priorité. by1..6 : « Prénom, contexte » (ex. « Léa, mariée en 2025 »).",
    "accent = couleur d'accent du site (carte centrale + hover). border/cardBg : par défaut clair (cartes blanches, bordures grises) — sur un site sombre, mettre cardBg sombre (ex. #1c1f2a) et border gris foncé (#3a3f52).",
    "Les avatars sont générés automatiquement (initiale colorée) : ne rien fournir. Responsive intégré (cartes 365→290 px) : ne rien adapter.",
    "Mettre l'avis le plus fort en quote3/quote4 (cartes proches du centre au chargement).",
  ].join("\n"),
  demo: {
    bg: "#f8fafc",
    html:
      `<div style="min-height:100vh;display:grid;align-content:center"><!--FX--></div>`,
  },
  accent: { from: "#0f766e", to: "#14b8a6" },
};

/** Démo : les défauts du schéma suffisent. */
export const staggerTestimonialsDemoConfig: EffectConfig = {};
