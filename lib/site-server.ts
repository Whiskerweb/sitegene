/**
 * Construit le HTML d'un site client : shell du bundle template prébuildé
 * (public/_templates/<id>/index.html) + injection runtime du contenu (v2) et
 * des meta de la page courante AVANT l'exécution du bundle. Aucun rebuild.
 */
import type { AnyContent } from "./site-content";
import { isSpaTemplate } from "./templates";
import { buildEffectsInjection } from "./effects/render";

/** JSON sûr inline (`<` échappé → pas de break-out </script>). */
function safeJson(obj: unknown): string {
  return JSON.stringify(obj ?? {}).replace(/</g, "\\u003c");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export interface HeadMeta {
  title: string;
  description?: string;
  ogImage?: string;
}

/** Bloc à injecter en fin de <head> : contenu (v2 ou plat) + meta + CSS perso éventuel. */
export function buildHeadInjection(content: AnyContent, meta: HeadMeta): string {
  const css =
    content && typeof content === "object" && typeof (content as { __css?: unknown }).__css === "string"
      ? ((content as { __css: string }).__css)
      : "";
  const cssTag = css ? `<style id="sg-custom">${css}</style>` : "";
  const titleTag = `<title>${escapeHtml(meta.title)}</title>`;
  const descTag = meta.description
    ? `<meta name="description" content="${escapeHtml(meta.description)}">`
    : "";
  const ogTags =
    `<meta property="og:title" content="${escapeHtml(meta.title)}">` +
    (meta.ogImage ? `<meta property="og:image" content="${escapeHtml(meta.ogImage)}">` : "");
  return (
    `<script>window.__SITE_CONTENT__=${safeJson(content)};</script>\n` +
    titleTag + descTag + ogTags + cssTag
  );
}

/** Dossiers d'assets relatifs possibles dans un shell de template (lignée HTML). */
const ASSET_DIRS = "(?:img|images|assets|css|js|fonts|media|video|photos)";

/**
 * Absolutise les références d'assets RELATIVES d'un shell HTML vers
 * /_templates/<id>/… La lignée templates-HTML écrit `src="img/hero.jpg"` ou
 * `url(img/bg.jpg)` : servies depuis /s/<slug>, /r/<token> ou un aperçu, ces
 * URLs se résolvent hors du dossier du template → images manquantes. Pas de
 * <base> (casserait les ancres #section) : on réécrit uniquement les chemins
 * d'assets. No-op pour les shells SPA (déjà en chemins absolus).
 */
export function absolutizeTemplateAssets(html: string, templateId: string): string {
  const base = `/_templates/${templateId}/`;
  return html
    .replace(
      new RegExp(`(\\s(?:src|href|poster)=["'])(${ASSET_DIRS}/)`, "gi"),
      `$1${base}$2`,
    )
    .replace(/(\bsrcset=)(["'])([^"']*)\2/gi, (_m, attr, q, val: string) => {
      const fixed = val.replace(
        new RegExp(`(^|,\\s*)(${ASSET_DIRS}/)`, "gi"),
        `$1${base}$2`,
      );
      return `${attr}${q}${fixed}${q}`;
    })
    .replace(
      new RegExp(`(url\\(\\s*['"]?)(${ASSET_DIRS}/)`, "gi"),
      `$1${base}$2`,
    );
}

const REL_IMAGE_VALUE = new RegExp(
  `^${ASSET_DIRS}/.+\\.(?:jpe?g|png|webp|avif|gif|svg)(?:\\?.*)?$`,
  "i",
);

/**
 * Absolutise les valeurs d'images relatives DANS le contenu (ex.
 * "img/blog2.jpg" injecté au runtime sur un [data-sg-img]) vers
 * /_templates/<id>/… Les URLs absolues / Storage restent intactes.
 */
export function absolutizeContentAssets<T>(node: T, templateId: string): T {
  const base = `/_templates/${templateId}/`;
  if (typeof node === "string") {
    return (REL_IMAGE_VALUE.test(node) ? `${base}${node}` : node) as T;
  }
  if (Array.isArray(node)) {
    return node.map((v) => absolutizeContentAssets(v, templateId)) as T;
  }
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = absolutizeContentAssets(v, templateId);
    }
    return out as T;
  }
  return node;
}

export type TemplatePage = { slug?: string; file?: string; title?: string };

const normSlug = (p: string) => {
  const s = (p || "/").trim();
  const withSlash = s.startsWith("/") ? s : `/${s}`;
  return withSlash.length > 1 && withSlash.endsWith("/") ? withSlash.slice(0, -1) : withSlash;
};

/**
 * Fichier de shell à servir pour un chemin de page (lignée HTML multi-pages).
 * `index.html` pour la home ; sinon le fichier déclaré dans `manifest.pages`
 * ({slug:"/portfolio", file:"portfolio.html"}). Chemin inconnu → home (le
 * comportement SPA historique : repli silencieux).
 */
async function pageFileFor(
  origin: string,
  templateId: string,
  pagePath: string,
): Promise<string> {
  const want = normSlug(pagePath);
  if (want === "/") return "index.html";
  const manifest = (await fetchTemplateManifest(origin, templateId)) as {
    pages?: TemplatePage[];
  } | null;
  const page = manifest?.pages?.find((p) => normSlug(p?.slug ?? "") === want);
  const file = page?.file ?? "";
  // Sanitisation stricte : un nom de fichier plat, pas de traversée.
  return /^[a-z0-9][a-z0-9._-]*\.html$/i.test(file) ? file : "index.html";
}

export interface BuildSiteOpts {
  /** Chemin de page demandé ("/", "/portfolio"…). Défaut : home. */
  pagePath?: string;
  /** Préfixe public du site ("/s/<slug>", "/r/<token>") pour la nav inter-pages
   *  de la lignée HTML. Absent → les liens data-sg-page restent inertes (aperçus). */
  basePath?: string;
  /** Shell HTML bespoke (site sur-mesure généré par l'IA). Fourni → utilisé tel
   *  quel à la place du index.html statique du template ; l'injection runtime
   *  (__SITE_CONTENT__, masques) et l'hydratation data-sg-* restent identiques. */
  shellHtml?: string | null;
}

/** Script léger : câble les <a data-sg-page="…"> sur le préfixe public du site. */
function navRewriteScript(basePath: string): string {
  return (
    `<script>(function(){var B=${safeJson(basePath)};` +
    `function wire(){document.querySelectorAll('a[data-sg-page]').forEach(function(a){` +
    `var p=(a.getAttribute('data-sg-page')||'/').replace(/^\\//,'');` +
    `a.setAttribute('href',(B+(p?'/'+p:''))||'/');});}` +
    `if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();` +
    `})();</script>`
  );
}

/**
 * [5.1/5.3] Runtime de masquage (lignée HTML) — lit `__dropSections` /
 * `__dropItems` dans window.__SITE_CONTENT__ :
 *  - masque les sections dont les données n'ont pas été fournies (containers
 *    homogènes uniquement — conservateur) ;
 *  - masque les items de prestations en trop (au-delà des spécialités cochées) ;
 *  - désactive les liens d'ancre pointant vers une section absente ou masquée
 *    (.nav-link--disabled, cursor not-allowed, tooltip « Section non
 *    disponible ») — preview ET site publié.
 */
export function sectionMaskScript(): string {
  return (
    `<style id="sg-mask">.nav-link--disabled{cursor:not-allowed!important;opacity:.45}</style>` +
    `<script id="sg-mask-js">(function(){` +
    `var C=window.__SITE_CONTENT__||{};var drop=C.__dropSections||[];var items=C.__dropItems||[];` +
    `function pathOf(e){return e.getAttribute('data-sg-path')||e.getAttribute('data-sg-img')||'';}` +
    `function rootOf(p){return String(p||'').split('.')[0].split('[')[0];}` +
    `function annots(e){return e.querySelectorAll('[data-sg-path],[data-sg-img]');}` +
    `function run(){` +
    `if(drop.length){var cs=[];document.querySelectorAll('[data-sg-path],[data-sg-img]').forEach(function(n){` +
    `if(drop.indexOf(rootOf(pathOf(n)))===-1)return;` +
    `var c=n.closest('section,footer,aside')||n.parentElement;` +
    `if(c&&cs.indexOf(c)===-1)cs.push(c);});` +
    `cs.forEach(function(c){var ok=true;annots(c).forEach(function(e){if(drop.indexOf(rootOf(pathOf(e)))===-1)ok=false;});` +
    `if(ok&&c.tagName!=='BODY')c.style.display='none';});}` +
    `items.forEach(function(p){var pre=p.replace(/\\[\\d+\\]$/,'');` +
    `var sel='[data-sg-path^="'+p+'."],[data-sg-path="'+p+'"],[data-sg-img^="'+p+'."],[data-sg-img="'+p+'"]';` +
    `document.querySelectorAll(sel).forEach(function(n){var cur=n;` +
    `while(cur&&cur.parentElement&&cur.parentElement!==document.body){var par=cur.parentElement,other=false;` +
    `annots(par).forEach(function(e){var q=pathOf(e);` +
    `if(q.indexOf(pre+'[')===0&&q.indexOf(p+'.')!==0&&q!==p&&!cur.contains(e))other=true;});` +
    `if(other){cur.style.display='none';return;}cur=par;}` +
    `n.style.display='none';});});` +
    `function hiddenTarget(id){var t=id?document.getElementById(id):null;if(!t)return true;` +
    `var e=t;while(e&&e!==document.body){if(e.style&&e.style.display==='none')return true;e=e.parentElement;}return false;}` +
    `document.querySelectorAll('a[href^="#"]').forEach(function(a){` +
    `if(a.hasAttribute('data-sg-page'))return;var h=a.getAttribute('href');` +
    `var p=a.getAttribute('data-sg-path')||'';` +
    `var dead=h==='#'?!!p:hiddenTarget(h.slice(1));` +
    `if(!dead)return;var t=(a.textContent||'').trim();` +
    // email/téléphone affichés en lien mort → recâblés sur leur vraie cible
    `if(/email$/i.test(p)&&/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(t)){a.setAttribute('href','mailto:'+t);return;}` +
    `if(/phone$/i.test(p)&&/^[+\\d][\\d\\s().-]{6,}$/.test(t)){a.setAttribute('href','tel:'+t.replace(/[^+\\d]/g,''));return;}` +
    // icônes sociales / liens légaux de démo sans cible : masqués (aucune valeur)
    `if(h==='#'&&/social|instagram|legal/i.test(p)){a.style.display='none';return;}` +
    // lien de nav sans section : désactivé, jamais une ancre arbitraire
    `a.classList.add('nav-link--disabled');a.setAttribute('title','Section non disponible');` +
    `a.setAttribute('aria-disabled','true');a.addEventListener('click',function(e){e.preventDefault();});});}` +
    `if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();` +
    `})();</script>`
  );
}

/**
 * Hydrateur générique pour les shells bespoke (générés par l'IA) : applique
 * `window.__SITE_CONTENT__` aux `[data-sg-path]` (texte) et `[data-sg-img]`
 * (image). Ne touche jamais un élément qui a des enfants (on n'écrase pas une
 * structure interne). S'exécute avant les scripts du body (kit d'animation).
 */
function sgHydrateScript(): string {
  return (
    `<script>(function(){var C=window.__SITE_CONTENT__||{};` +
    `function g(o,p){var a=String(p).replace(/\\[(\\d+)\\]/g,'.$1').split('.').filter(Boolean),c=o;` +
    `for(var i=0;i<a.length;i++){if(c==null||typeof c!=='object')return undefined;c=c[a[i]];}return c;}` +
    `function run(){` +
    `document.querySelectorAll('[data-sg-path]').forEach(function(el){` +
    `if(el.children&&el.children.length)return;var v=g(C,el.getAttribute('data-sg-path'));` +
    `if(typeof v==='string'&&v.length)el.textContent=v;});` +
    `document.querySelectorAll('[data-sg-img]').forEach(function(el){` +
    `var v=g(C,el.getAttribute('data-sg-img'));if(typeof v!=='string'||!v.length)return;` +
    `if(el.tagName==='IMG')el.setAttribute('src',v);else el.style.backgroundImage='url('+v+')';});}` +
    `if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();` +
    `})();</script>`
  );
}

export async function buildSiteHtml(
  origin: string,
  templateId: string,
  content: AnyContent,
  meta: HeadMeta,
  opts?: BuildSiteOpts,
): Promise<string | null> {
  const pagePath = opts?.pagePath ?? "/";
  // Shell bespoke fourni (site sur-mesure) → on l'utilise tel quel. Sinon, on
  // récupère le index.html / fichier de page statique du template.
  let rawShell: string;
  if (typeof opts?.shellHtml === "string" && opts.shellHtml.length > 0) {
    rawShell = opts.shellHtml;
  } else {
    const file = isSpaTemplate(templateId)
      ? "index.html" // SPA : routeur client, toujours le même shell
      : await pageFileFor(origin, templateId, pagePath);
    const res = await fetch(`${origin}/_templates/${templateId}/${file}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    rawShell = await res.text();
  }
  let html = absolutizeTemplateAssets(rawShell, templateId);
  const absContent = absolutizeContentAssets(content, templateId);
  // Effets achetés appliqués (clés __effects/__components) : CSS+configs en
  // tête, JS+injecteur en fin de body. Injection vide si aucun effet.
  const fx = buildEffectsInjection(absContent, templateId);
  const inject =
    buildHeadInjection(absContent, meta) +
    // Shell bespoke (généré IA) : il ne porte pas le runtime d'hydratation des
    // templates statiques → on injecte un hydrateur générique data-sg-* en tête
    // (avant les scripts du body, donc avant le kit d'animation) pour que les
    // éditions de content_json s'appliquent au rechargement.
    (typeof opts?.shellHtml === "string" && opts.shellHtml.length > 0 ? sgHydrateScript() : "") +
    (fx.headCss ? `<style id="sg-fx">${fx.headCss}</style>` : "") +
    fx.headScript;
  // retire un <title> existant du shell (sera remplacé par celui de la page)
  html = html.replace(/<title>.*?<\/title>/i, "");
  if (html.includes("</head>")) {
    html = html.replace("</head>", () => `${inject}</head>`);
  } else {
    html = inject + html;
  }
  // Nav inter-pages (lignée HTML) : ne s'active que si la route fournit le préfixe.
  let tail = "";
  if (!isSpaTemplate(templateId) && typeof opts?.basePath === "string") {
    tail += navRewriteScript(opts.basePath);
  }
  // [5.1/5.3] Masquage des blocs sans données + neutralisation des ancres
  // mortes — lignée HTML, preview ET site publié (no-op sans directives).
  if (!isSpaTemplate(templateId)) {
    tail += sectionMaskScript();
  }
  tail += fx.bodyJs;
  if (tail) {
    html = html.includes("</body>") ? html.replace("</body>", () => `${tail}</body>`) : html + tail;
  }
  return html;
}

export async function fetchDefaultContent(
  origin: string,
  templateId: string,
): Promise<unknown | null> {
  const res = await fetch(`${origin}/_templates/${templateId}/default-content.json`, {
    cache: "no-store",
  });
  return res.ok ? res.json() : null;
}

export async function fetchTemplateManifest(
  origin: string,
  templateId: string,
): Promise<unknown | null> {
  const res = await fetch(`${origin}/_templates/${templateId}/manifest.json`, {
    cache: "no-store",
  });
  return res.ok ? res.json() : null;
}
