import { initialAvatarRound } from "./avatar";
import {
  escapeFxHtml,
  type EffectConfig,
  type EffectModule,
} from "./types";

/**
 * « Témoignages à mélanger » — adaptation vanilla du ShuffleCards
 * (React/framer-motion drag) : pile de 3 cartes en éventail (rotate -6/0/6°,
 * décalées de 33 %/66 %). La carte de devant se fait GLISSER : jetée vers la
 * gauche (> 150 px), elle passe derrière la pile. Le drag élastique de
 * framer-motion est réimplémenté en Pointer Events (translation amortie,
 * retour animé par transition CSS).
 */

function card(quote: string, author: string, avatar: string): string {
  return (
    `<figure class="sg-fx-st-card">` +
    `<img src="${avatar}" alt="" draggable="false">` +
    `<blockquote>«&nbsp;${quote}&nbsp;»</blockquote>` +
    `<cite>${author}</cite>` +
    `</figure>`
  );
}

export const shuffleTestimonials: EffectModule = {
  id: "shuffle-testimonials",
  name: "Témoignages à mélanger",
  description:
    "Trois avis clients en éventail : on attrape la carte du dessus et on la jette à gauche pour découvrir la suivante.",
  kind: "component",
  spaCompatible: false,
  defaultPosition: "replace",
  configSchema: [
    { key: "accent", label: "Couleur d'accent (auteur, avatars)", type: "color", default: "#818cf8" },
    { key: "border", label: "Couleur des bordures", type: "color", default: "#334155" },
    { key: "text", label: "Couleur de la citation", type: "color", default: "#94a3b8" },
    { key: "quote1", label: "Avis 1", type: "text", default: "Des photos qui nous ressemblent, on revit la journée à chaque regard.", maxLen: 150 },
    { key: "author1", label: "Auteur 1", type: "text", default: "Camille R. — Mariage", maxLen: 40 },
    { key: "quote2", label: "Avis 2", type: "text", default: "Un regard unique, une équipe discrète : le résultat est superbe.", maxLen: 150 },
    { key: "author2", label: "Auteur 2", type: "text", default: "Julien M. — Portrait", maxLen: 40 },
    { key: "quote3", label: "Avis 3", type: "text", default: "Réactif, créatif, et des images livrées plus belles qu'espérées.", maxLen: 150 },
    { key: "author3", label: "Auteur 3", type: "text", default: "Sarah L. — Entreprise", maxLen: 40 },
  ],
  htmlSnippet: (cfg: EffectConfig) => {
    const accent = String(cfg.accent ?? "#818cf8");
    const s = (k: string) => escapeFxHtml(String(cfg[k] ?? ""));
    return (
      `<div class="sg-fx-shuffle-testimonials" aria-label="Témoignages">` +
      `<div class="sg-fx-st-stage">` +
      card(s("quote1"), s("author1"), initialAvatarRound(String(cfg.author1 ?? ""), accent)) +
      card(s("quote2"), s("author2"), initialAvatarRound(String(cfg.author2 ?? ""), accent)) +
      card(s("quote3"), s("author3"), initialAvatarRound(String(cfg.author3 ?? ""), accent)) +
      `</div></div>`
    );
  },
  css: [
    ".sg-fx-shuffle-testimonials{display:grid;place-content:center;overflow:hidden;padding:5rem 2rem;min-height:34rem}",
    ".sg-fx-st-stage{position:relative;height:450px;width:350px;margin-left:-100px}",
    "@media (min-width:768px){.sg-fx-st-stage{margin-left:-175px}}",
    "@media (max-width:480px){.sg-fx-st-stage{width:272px;height:400px;margin-left:-64px}}",
    ".sg-fx-st-card{position:absolute;left:0;top:0;display:grid;height:100%;width:100%;box-sizing:border-box;place-content:center;gap:1.5rem;margin:0;",
    "border-radius:1rem;border:2px solid var(--fx-shuffle-testimonials-border,#334155);",
    "background:color-mix(in srgb,var(--fx-shuffle-testimonials-border,#334155) 20%,transparent);",
    "padding:1.5rem;box-shadow:0 20px 25px -5px rgba(0,0,0,.25),0 8px 10px -6px rgba(0,0,0,.25);",
    "backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);user-select:none;-webkit-user-select:none;",
    "transition:transform .35s ease;will-change:transform}",
    ".sg-fx-st-card img{pointer-events:none;margin:0 auto;height:8rem;width:8rem;border-radius:9999px;",
    "border:2px solid var(--fx-shuffle-testimonials-border,#334155);background:#e2e8f0;object-fit:cover}",
    "@media (max-width:480px){.sg-fx-st-card img{height:6.5rem;width:6.5rem}}",
    ".sg-fx-st-card blockquote{text-align:center;font-size:1.08rem;font-style:italic;margin:0;",
    "color:var(--fx-shuffle-testimonials-text,#94a3b8)}",
    ".sg-fx-st-card cite{text-align:center;font-size:.9rem;font-weight:500;font-style:normal;",
    "color:var(--fx-shuffle-testimonials-accent,#818cf8)}",
    ".sg-fx-st-card.is-front{z-index:2;cursor:grab;touch-action:none}",
    ".sg-fx-st-card.is-front:active{cursor:grabbing}",
    ".sg-fx-st-card.is-middle{z-index:1}",
    ".sg-fx-st-card.is-back{z-index:0}",
  ].join("\n"),
  js: String.raw`
(function(){
  window.__SG_FX_INIT__ = window.__SG_FX_INIT__ || [];
  window.__SG_FX_INIT__.push({ id: 'shuffle-testimonials', init: function(){
    document.querySelectorAll('.sg-fx-shuffle-testimonials').forEach(function(root){
      if (root.__sgFx) return; root.__sgFx = 1;
      var cards = Array.prototype.slice.call(root.querySelectorAll('.sg-fx-st-card'));
      if (cards.length < 2) return;
      var order = cards.map(function(_, i){ return i; }); // order[pos] = index carte
      var POS = [
        { cls: 'is-front',  t: 'translateX(0%) rotate(-6deg)' },
        { cls: 'is-middle', t: 'translateX(33%) rotate(0deg)' },
        { cls: 'is-back',   t: 'translateX(66%) rotate(6deg)' }
      ];
      function apply(){
        for (var pos = 0; pos < order.length; pos++){
          var el = cards[order[pos]], p = POS[Math.min(pos, POS.length - 1)];
          el.classList.remove('is-front', 'is-middle', 'is-back');
          el.classList.add(p.cls);
          el.style.transform = p.t;
        }
      }
      function shuffle(){
        // la carte de devant passe derrière, les autres avancent d'un cran
        order.push(order.shift());
        apply();
      }
      // Drag de la carte de devant (Pointer Events, élastique ~framer 0.35).
      var drag = null;
      root.addEventListener('pointerdown', function(e){
        var el = e.target && e.target.closest ? e.target.closest('.sg-fx-st-card.is-front') : null;
        if (!el) return;
        drag = { el: el, x0: e.clientX, y0: e.clientY };
        el.style.transition = 'none';
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
        e.preventDefault();
      });
      root.addEventListener('pointermove', function(e){
        if (!drag) return;
        var dx = (e.clientX - drag.x0), dy = (e.clientY - drag.y0);
        drag.el.style.transform = 'translate(' + (dx * 0.6).toFixed(1) + 'px,' + (dy * 0.35).toFixed(1) + 'px) rotate(' + (-6 + dx * 0.03).toFixed(2) + 'deg)';
      });
      function release(e){
        if (!drag) return;
        var dx = e.clientX - drag.x0;
        drag.el.style.transition = '';
        if (dx < -150) shuffle(); else apply();
        drag = null;
      }
      root.addEventListener('pointerup', release);
      root.addEventListener('pointercancel', release);
      apply();
    });
  }});
})();
`,
  aiGuide: [
    "Témoignages à mélanger (ShuffleCards) : pile de 3 cartes d'avis en éventail ; l'utilisateur attrape la carte de devant et la jette vers la gauche pour révéler la suivante. Interaction ludique et mémorable.",
    "Position idéale : 'replace' le contenu d'une section témoignages/avis existante ; sinon 'after' la section services ou galerie. Hauteur ~34rem : ne pas l'insérer dans une colonne étroite ni 'inside' le hero.",
    "quote1..3 : reprendre les VRAIS avis présents sur le site s'il y en a (raccourcis à ≤ 140 caractères) ; sinon rédiger des avis plausibles en français, ton client naturel, spécifiques au métier du site (jamais de lorem ipsum).",
    "author1..3 : format « Prénom I. — contexte » (ex. « Camille R. — Mariage à Lyon »). Les avatars sont générés automatiquement (initiale colorée) : ne rien fournir.",
    "Couleurs : accent = couleur d'accent du site (signe les auteurs + avatars) ; border/text : cartes translucides sombres par défaut — superbes sur sections sombres ou photo. Sur un site très clair, éclaircir border (#cbd5e1) et foncer text (#475569).",
    "Le responsive et le drag tactile sont intégrés au composant : ne rien adapter.",
  ].join("\n"),
  demo: {
    bg: "#0f172a",
    html:
      `<div style="min-height:100vh;display:grid;place-items:center">` +
      `<div style="width:100%"><!--FX--></div>` +
      `</div>`,
  },
  accent: { from: "#6366f1", to: "#a855f7" },
};

/** Valeurs de démo (page /api/fx-demo) : les défauts du schéma suffisent. */
export const shuffleTestimonialsDemoConfig: EffectConfig = {};
