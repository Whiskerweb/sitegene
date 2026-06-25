/**
 * Défilement fluide (smooth scroll) appliqué PAR DÉFAUT à tout l'univers Akyra :
 * notre site (app) ET chaque site client rendu. C'est la touche « soyeuse » à la
 * reyou.life — la molette glisse au lieu de sauter, ce qui sublime les effets
 * liés au scroll (parallaxe, reveals).
 *
 * Implémentation volontairement NON destructive : on ne wrappe ni ne transforme
 * aucun conteneur (ce qui casserait les navbars position:fixed/sticky). On garde
 * le scroll natif du document et on se contente de lisser la molette (lerp vers
 * une cible + window.scrollTo). Clavier, barre de défilement et ancres restent
 * natifs ; les zones scrollables internes (modales, menus) gardent la main ; le
 * tactile (déjà inertiel) et prefers-reduced-motion désactivent l'effet.
 *
 * Source unique, injectée à deux endroits :
 *  - chaque site client → buildSiteHtml (smoothScrollScript) ;
 *  - notre app → app/layout.tsx (<script> inline).
 * Idempotent (window.__sgSmooth) : sans danger si présent deux fois.
 */
export const SMOOTH_SCROLL_JS = String.raw`
(function(){
  if (window.__sgSmooth) return;
  function boot(){
    if (window.__sgSmooth) return;
    if (window.matchMedia){
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (matchMedia('(hover: none)').matches) return;   // tactile : déjà inertiel
    }
    window.__sgSmooth = 1;
    // Lissage VOLONTAIREMENT léger : current suit target de près (≈ 4 frames),
    // juste assez pour adoucir les crans de molette sans inertie « flottante »
    // ni rattrapage brusque. Plus haut = plus proche du natif.
    var ease = 0.25;
    var target = window.scrollY || window.pageYOffset || 0;
    var current = target;
    var animating = false;
    function maxScroll(){ return Math.max(0, (document.documentElement.scrollHeight || 0) - window.innerHeight); }
    function clamp(v){ var m = maxScroll(); return v < 0 ? 0 : v > m ? m : v; }
    function loop(){
      current += (target - current) * ease;
      if (Math.abs(target - current) < 0.4){ current = target; animating = false; }
      // behavior:'instant' OBLIGATOIRE : la forme positionnelle scrollTo(0,y) hérite
      // du CSS 'scroll-behavior: smooth', ce qui RE-anime le navigateur vers chaque
      // cible pendant que ce lerp en pousse déjà une autre → double lissage qui se
      // bagarre (scroll « qui rame », pire au changement de direction). On force le
      // positionnement instantané ici ; le smooth CSS reste actif pour les ancres.
      window.scrollTo({ top: Math.round(current), left: 0, behavior: 'instant' });
      if (animating) requestAnimationFrame(loop);
    }
    function start(){ if (!animating){ animating = true; requestAnimationFrame(loop); } }
    function scrollableAncestor(node, dir){
      while (node && node.nodeType === 1 && node !== document.body){
        var oy = getComputedStyle(node).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight){
          var up = node.scrollTop > 0;
          var down = node.scrollTop + node.clientHeight < node.scrollHeight - 1;
          if ((dir < 0 && up) || (dir > 0 && down)) return true;   // laisse la zone interne scroller
        }
        node = node.parentNode;
      }
      return false;
    }
    // Appareil à défilement fin/inertiel (trackpad, Magic Mouse) : son scroll
    // natif est DÉJÀ fluide. Le hijacker y superpose une 2e inertie qui s'emballe
    // (« lent puis ça accélère »). On ne lisse QUE les souris à molette crantée,
    // qui sautent par pas secs — c'est là que le smooth sert.
    function isPreciseDevice(e){
      if (e.deltaMode !== 0) return false;        // lignes/pages → molette crantée
      if (e.deltaY % 1 !== 0) return true;        // delta fractionnaire → trackpad
      return Math.abs(e.deltaY) < 50;             // petit pas net → défilement fin
    }
    function onWheel(e){
      if (e.ctrlKey) return;                                  // pinch-zoom
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;    // scroll horizontal natif
      if (isPreciseDevice(e)) return;                         // trackpad/Magic Mouse → natif (déjà smooth)
      if (scrollableAncestor(e.target, e.deltaY)) return;
      var d = e.deltaY;
      if (e.deltaMode === 1) d *= 16;                         // lignes → px
      else if (e.deltaMode === 2) d *= window.innerHeight;    // pages → px
      e.preventDefault();
      target = clamp(target + d);
      start();
    }
    function onScroll(){ if (!animating){ target = current = window.scrollY; } }   // clavier/scrollbar/ancres
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function(){ target = clamp(target); }, { passive: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
`;

/** <script> prêt à injecter dans le HTML d'un site rendu (buildSiteHtml). */
export function smoothScrollScript(): string {
  return `<script>${SMOOTH_SCROLL_JS}</script>`;
}
