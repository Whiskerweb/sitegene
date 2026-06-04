/**
 * Matérialisation des effets au rendu d'un site.
 *
 * L'état appliqué vit dans content_json (clés réservées, comme __css) :
 *   __effects    : [{ id, config? }] — effets globaux (tout le site)
 *   __components : [{ effectId, selector, position, config? }] — ancrés
 *
 * buildSiteHtml appelle buildEffectsInjection : le CSS des effets part dans le
 * <head>, les composants (markup pré-construit côté serveur + variables CSS)
 * dans window.__SG_COMPONENTS__, les configs dans window.__SG_FX_CFG__, puis
 * le JS des effets + FX_INJECTOR avant </body>. L'insertion ciblée se fait
 * côté client (querySelector) avec dégradation silencieuse si le sélecteur ne
 * matche plus après une régénération.
 */
import { getEffect } from "./index";
import {
  COMPONENT_POSITIONS,
  type ComponentPosition,
  type EffectConfig,
  type EffectModule,
} from "./types";
import { isSpaTemplate } from "../templates";

export interface AppliedEffect {
  id: string;
  config?: EffectConfig;
}

export interface AppliedComponent {
  effectId: string;
  selector: string;
  position: ComponentPosition;
  config?: EffectConfig;
}

/** JSON sûr inline (même convention que lib/site-server). */
function safeJson(obj: unknown): string {
  return JSON.stringify(obj ?? {}).replace(/</g, "\\u003c");
}

const COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;
const URL_RE = /^(https?:\/\/|\/|data:image\/)/i;
const CONTROL_RE = /[\x00-\x1f\x7f]/g;

/**
 * Valide une config (venant de l'IA ou de la base) contre le configSchema de
 * l'effet : clés inconnues supprimées, types coercés, bornes appliquées.
 * Aucune valeur de config n'est jamais interprétée comme du code.
 */
export function sanitizeEffectConfig(
  effect: EffectModule,
  raw: unknown,
): EffectConfig {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: EffectConfig = {};
  for (const field of effect.configSchema ?? []) {
    const v = input[field.key];
    switch (field.type) {
      case "color": {
        const s = typeof v === "string" ? v.trim() : "";
        out[field.key] = COLOR_RE.test(s) ? s : field.default;
        break;
      }
      case "number": {
        const n = typeof v === "number" ? v : Number(v);
        out[field.key] = Number.isFinite(n)
          ? Math.min(field.max, Math.max(field.min, n))
          : field.default;
        break;
      }
      case "select": {
        out[field.key] =
          typeof v === "string" && field.options.includes(v) ? v : field.default;
        break;
      }
      case "boolean": {
        out[field.key] = typeof v === "boolean" ? v : field.default;
        break;
      }
      case "text": {
        const s = typeof v === "string" ? v.replace(CONTROL_RE, "").trim() : "";
        out[field.key] = s ? s.slice(0, field.maxLen) : field.default;
        break;
      }
      case "url": {
        const s = typeof v === "string" ? v.trim() : "";
        out[field.key] = s && URL_RE.test(s) && !/[<>"]/.test(s) ? s : field.default;
        break;
      }
    }
  }
  return out;
}

/** Lit content.__effects (tolère les deux formes : "id" ou {id, config}). */
export function appliedEffects(content: unknown): AppliedEffect[] {
  const raw = (content as { __effects?: unknown })?.__effects;
  if (!Array.isArray(raw)) return [];
  const out: AppliedEffect[] = [];
  for (const e of raw) {
    if (typeof e === "string") out.push({ id: e });
    else if (e && typeof e === "object" && typeof (e as { id?: unknown }).id === "string") {
      out.push({
        id: (e as { id: string }).id,
        config: (e as { config?: EffectConfig }).config,
      });
    }
  }
  return out;
}

/** Lit content.__components avec validation structurelle. */
export function appliedComponents(content: unknown): AppliedComponent[] {
  const raw = (content as { __components?: unknown })?.__components;
  if (!Array.isArray(raw)) return [];
  const out: AppliedComponent[] = [];
  for (const c of raw) {
    if (!c || typeof c !== "object") continue;
    const { effectId, selector, position, config } = c as Record<string, unknown>;
    if (typeof effectId !== "string" || typeof selector !== "string" || !selector) continue;
    if (!COMPONENT_POSITIONS.includes(position as ComponentPosition)) continue;
    out.push({
      effectId,
      selector,
      position: position as ComponentPosition,
      config: config as EffectConfig | undefined,
    });
  }
  return out;
}

/** Variables CSS exposées au markup (jamais les champs text/url). */
function cssVars(effect: EffectModule, config: EffectConfig): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const field of effect.configSchema ?? []) {
    const v = config[field.key];
    if (v === undefined) continue;
    if (field.type === "color" || field.type === "select") {
      vars[`--fx-${effect.id}-${field.key}`] = String(v);
    } else if (field.type === "number") {
      vars[`--fx-${effect.id}-${field.key}`] = String(v);
    } else if (field.type === "boolean") {
      vars[`--fx-${effect.id}-${field.key}`] = v ? "1" : "0";
    }
  }
  return vars;
}

/**
 * Injecteur générique côté client. Tourne sur TOUTES les surfaces de rendu
 * (/s/, /r/, aperçus) : insère les markups des composants à leur ancre, pose
 * les variables CSS, puis lance les init() des effets enregistrés.
 * window.__SG_FX_WAIT__ (posé pour la lignée SPA) retarde l'exécution jusqu'à
 * l'hydratation (apparition des [data-sg-path]).
 */
export const FX_INJECTOR = String.raw`
(function(){
  if (window.__SG_FX_BOOT) return; window.__SG_FX_BOOT = 1;
  function run(){
    var comps = window.__SG_COMPONENTS__ || [];
    var cfg = window.__SG_FX_CFG__ || {};
    for (var i = 0; i < comps.length; i++){
      var c = comps[i];
      try {
        var el = document.querySelector(c.selector);
        if (!el) continue; // sélecteur périmé → dégradation silencieuse
        if (el.__sgFxC && el.__sgFxC[c.effectId]) continue;
        el.__sgFxC = el.__sgFxC || {}; el.__sgFxC[c.effectId] = 1;
        var node = el;
        if (c.html){
          if (c.position === 'replace'){ el.innerHTML = c.html; node = el; }
          else if (c.position === 'before'){ el.insertAdjacentHTML('beforebegin', c.html); node = el.previousElementSibling; }
          else if (c.position === 'after'){ el.insertAdjacentHTML('afterend', c.html); node = el.nextElementSibling; }
          else { el.insertAdjacentHTML('afterbegin', c.html); node = el.firstElementChild; }
          if (c.position === 'inside' || c.position === 'replace') el.classList.add('sg-fx-host-' + c.effectId);
        } else {
          el.classList.add('sg-fx-' + c.effectId);
        }
        if (node && c.vars){ for (var k in c.vars){ node.style.setProperty(k, String(c.vars[k])); } }
      } catch (e) {}
    }
    var inits = window.__SG_FX_INIT__ || [];
    for (var j = 0; j < inits.length; j++){
      try { inits[j].init(cfg[inits[j].id] || {}); } catch (e) {}
    }
  }
  function start(){
    if (!window.__SG_FX_WAIT__){ run(); return; }
    var tries = 0;
    (function wait(){
      tries++;
      if (document.querySelector('[data-sg-path],[data-sg-img]') || tries > 240) run();
      else requestAnimationFrame(wait);
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
`;

export interface EffectsInjection {
  /** Contenu du <style id="sg-fx"> (head). */
  headCss: string;
  /** <script> de configuration (head) : __SG_COMPONENTS__ / __SG_FX_CFG__. */
  headScript: string;
  /** JS des effets + injecteur (avant </body>). */
  bodyJs: string;
}

/** Aucun effet appliqué → injection vide (zéro overhead sur les sites nus). */
export const EMPTY_INJECTION: EffectsInjection = { headCss: "", headScript: "", bodyJs: "" };

export function buildEffectsInjection(
  content: unknown,
  templateId: string,
): EffectsInjection {
  const spa = isSpaTemplate(templateId);
  const globals = appliedEffects(content);
  const components = appliedComponents(content);
  if (globals.length === 0 && components.length === 0) return EMPTY_INJECTION;

  const used = new Map<string, EffectModule>();
  const fxConfig: Record<string, EffectConfig> = {};
  const rootVars: string[] = [];
  const compPayload: Array<{
    effectId: string;
    selector: string;
    position: ComponentPosition;
    html?: string;
    vars?: Record<string, string>;
  }> = [];

  for (const g of globals) {
    const effect = getEffect(g.id);
    if (!effect || effect.kind !== "global") continue;
    if (spa && !effect.spaCompatible) continue;
    const config = sanitizeEffectConfig(effect, g.config);
    used.set(effect.id, effect);
    fxConfig[effect.id] = config;
    for (const [k, v] of Object.entries(cssVars(effect, config))) {
      rootVars.push(`${k}:${v}`);
    }
  }

  for (const c of components) {
    const effect = getEffect(c.effectId);
    if (!effect || effect.kind !== "component") continue;
    if (spa && !effect.spaCompatible) continue;
    const config = sanitizeEffectConfig(effect, c.config);
    used.set(effect.id, effect);
    fxConfig[effect.id] = config;
    compPayload.push({
      effectId: effect.id,
      selector: c.selector,
      position: c.position,
      html: effect.htmlSnippet ? effect.htmlSnippet(config) : undefined,
      vars: cssVars(effect, config),
    });
  }

  if (used.size === 0) return EMPTY_INJECTION;

  const css =
    (rootVars.length ? `:root{${rootVars.join(";")}}\n` : "") +
    [...used.values()].map((e) => e.css).join("\n");
  const js = [...used.values()]
    .map((e) => e.js ?? "")
    .filter(Boolean)
    .join("\n");

  return {
    headCss: css,
    headScript:
      `<script>window.__SG_COMPONENTS__=${safeJson(compPayload)};` +
      `window.__SG_FX_CFG__=${safeJson(fxConfig)};` +
      (spa ? `window.__SG_FX_WAIT__=1;` : "") +
      `</script>`,
    bodyJs: `<script>${js}\n${FX_INJECTOR}</script>`,
  };
}
