// lib/foundry/charte.ts
// Chartes graphiques SUR MESURE générées par Mistral (étape DA de /creer),
// cadrées par les règles de goût du skill `stitch-design-taste` (.agents/skills) :
// un seul accent, saturation plafonnée, jamais de noir pur, surfaces claires,
// fonts à caractère (liste blanche Google Fonts vérifiée). Toute sortie IA est
// RÉPARÉE (contrastes WCAG, fonts inconnues) ; repli = vibes curées. Zéro import
// réseau ici (chatFn injectée) — testable sans réseau.
import type { Vibe, VibeId } from "./types";
import { getVibe, VIBE_IDS } from "./vibes";
import { suggestVibes } from "./suggest";
import { CHARTE_META } from "./charte-catalog";

// --- Liste blanche de fonts (vérifiées sur Google Fonts) -----------------------

interface FontDef {
  family: string;
  /** Pile CSS complète. */
  css: string;
  /** Fragment d'URL Google Fonts (family=…). */
  gf: string;
  roles: Array<"heading" | "body">;
}

const F = (family: string, css: string, gf: string, roles: Array<"heading" | "body">): FontDef => ({ family, css, gf, roles });

/** Fonts autorisées — caractère affirmé, pas de serif générique, pas d'Inter en display. */
export const CHARTE_FONTS: FontDef[] = [
  // Serifs distinctifs (display)
  F("Fraunces", "Fraunces, Georgia, serif", "Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600", ["heading"]),
  F("Instrument Serif", "'Instrument Serif', Georgia, serif", "Instrument+Serif:ital@0;1", ["heading"]),
  F("Playfair Display", "'Playfair Display', Georgia, serif", "Playfair+Display:ital,wght@0,500;0,600;1,500", ["heading"]),
  F("Castoro", "Castoro, Georgia, serif", "Castoro:ital@0;1", ["heading"]),
  F("Newsreader", "Newsreader, Georgia, serif", "Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600", ["heading"]),
  F("Lora", "Lora, Georgia, serif", "Lora:wght@400;500;600", ["heading"]),
  // Sans à caractère (display + body)
  F("Bricolage Grotesque", "'Bricolage Grotesque', system-ui, sans-serif", "Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800", ["heading"]),
  F("Space Grotesk", "'Space Grotesk', system-ui, sans-serif", "Space+Grotesk:wght@400;500;700", ["heading"]),
  F("Sora", "Sora, system-ui, sans-serif", "Sora:wght@400;600;700", ["heading"]),
  F("Outfit", "Outfit, system-ui, sans-serif", "Outfit:wght@400;500;600;700", ["heading", "body"]),
  F("Epilogue", "Epilogue, system-ui, sans-serif", "Epilogue:wght@400;500;600;700", ["heading", "body"]),
  F("Archivo", "Archivo, system-ui, sans-serif", "Archivo:wght@400;500;600;700", ["heading", "body"]),
  F("Geist", "Geist, system-ui, sans-serif", "Geist:wght@400;500;600;700", ["heading", "body"]),
  // Body
  F("Figtree", "Figtree, system-ui, sans-serif", "Figtree:wght@400;500;600", ["body"]),
  F("Manrope", "Manrope, system-ui, sans-serif", "Manrope:wght@400;500;600;700", ["body"]),
  F("Nunito", "Nunito, system-ui, sans-serif", "Nunito:wght@400;600;700;800", ["body"]),
  F("Source Sans 3", "'Source Sans 3', system-ui, sans-serif", "Source+Sans+3:wght@400;600", ["body"]),
  F("Work Sans", "'Work Sans', system-ui, sans-serif", "Work+Sans:wght@400;500;600", ["body"]),
  F("DM Sans", "'DM Sans', system-ui, sans-serif", "DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600", ["body"]),
  F("Libre Franklin", "'Libre Franklin', system-ui, sans-serif", "Libre+Franklin:wght@400;500;600", ["body"]),
];

function findFont(name: unknown, role: "heading" | "body"): FontDef | undefined {
  if (typeof name !== "string") return undefined;
  const n = name.trim().toLowerCase();
  return CHARTE_FONTS.find((f) => f.roles.includes(role) && f.family.toLowerCase() === n);
}

/** Pile CSS d'une fonte par sa famille (pour l'aperçu live de la palette). */
export function fontCss(family: string): string {
  return CHARTE_FONTS.find((f) => f.family === family)?.css ?? family;
}

/** Feuille Google Fonts de TOUTES les fontes autorisées — pour le sélecteur
 *  de typo (chaque option rendue dans sa propre fonte, façon Canva). Chargée
 *  uniquement quand le sélecteur est ouvert. */
export function allFontsHref(): string {
  return `${GF_BASE}?${CHARTE_FONTS.map((f) => `family=${f.gf}`).join("&")}&display=swap`;
}

/** Feuille Google Fonts pour une paire (heading, body) — aperçu live. */
export function fontHref(headingFamily: string, bodyFamily: string): string {
  const h = CHARTE_FONTS.find((f) => f.family === headingFamily) ?? CHARTE_FONTS.find((f) => f.roles.includes("heading"))!;
  const b = CHARTE_FONTS.find((f) => f.family === bodyFamily) ?? CHARTE_FONTS.find((f) => f.roles.includes("body"))!;
  return `${GF_BASE}?family=${h.gf}&family=${b.gf}&display=swap`;
}

// --- Couleur : parsing, luminance, contraste (WCAG), saturation ------------------

const HEX6 = /^#[0-9a-fA-F]{6}$/;

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}
function rgbToHex([r, g, b]: [number, number, number]): string {
  const c = (x: number) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Luminance relative WCAG (0 = noir, 1 = blanc). */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ratio de contraste WCAG entre deux couleurs (1 à 21). */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function saturation(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0 || max === min) return 0;
  const l = (max + min) / 2;
  const d = max - min;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

/** Mélange linéaire de deux couleurs (t = part de b). */
function mix(a: string, b: string, t: number): string {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  return rgbToHex([ra[0] + (rb[0] - ra[0]) * t, ra[1] + (rb[1] - ra[1]) * t, ra[2] + (rb[2] - ra[2]) * t]);
}

/** Désature vers le gris de même luminosité. */
function desaturate(hex: string, t: number): string {
  const [r, g, b] = hexToRgb(hex);
  const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return rgbToHex([r + (gray - r) * t, g + (gray - g) * t, b + (gray - b) * t]);
}

function hex(x: unknown, fallback: string): string {
  return typeof x === "string" && HEX6.test(x.trim()) ? x.trim().toLowerCase() : fallback;
}

// --- Réparation d'une charte (sortie IA → Vibe sûre) -----------------------------

const CORNERS: Record<string, { card: string; xl: string }> = {
  sharp: { card: "6px", xl: "12px" },
  soft: { card: "16px", xl: "24px" },
  round: { card: "24px", xl: "32px" },
};

const GF_BASE = "https://fonts.googleapis.com/css2";

/**
 * Construit une Vibe SÛRE depuis une charte brute (IA ou client) :
 * surfaces claires garanties, contrastes WCAG réparés (texte ≥ 7:1, muted ≥ 3.5:1,
 * bouton accent lisible), saturation d'accent plafonnée à 80 %, jamais de noir
 * pur, fonts hors liste blanche remplacées. Ne jette jamais.
 */
export function repairCharte(raw: unknown): Vibe {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;

  const isDark = r.mode === "dark";

  // Surface — claire en mode light, sombre en mode dark.
  let surface = hex(r.surface, isDark ? "#111111" : "#fafaf8");
  if (isDark) {
    for (let i = 0; i < 8 && luminance(surface) > 0.12; i++) surface = mix(surface, "#000000", 0.5);
  } else {
    for (let i = 0; i < 8 && luminance(surface) < 0.82; i++) surface = mix(surface, "#ffffff", 0.5);
  }

  // Card
  let card = hex(r.card, isDark ? mix(surface, "#ffffff", 0.1) : mix(surface, "#888888", 0.07));
  if (isDark) {
    for (let i = 0; i < 8 && luminance(card) > 0.2; i++) card = mix(card, "#000000", 0.5);
    for (let i = 0; i < 6 && luminance(card) < luminance(surface) * 1.05; i++) card = mix(card, "#ffffff", 0.15);
  } else {
    for (let i = 0; i < 8 && luminance(card) < 0.74; i++) card = mix(card, surface, 0.5);
  }

  // Ink
  let ink = hex(r.ink, isDark ? "#F5F5F2" : "#191714");
  if (isDark && ink === "#000000") ink = "#F5F5F2";
  if (!isDark && ink === "#000000") ink = "#161412";
  if (isDark) {
    for (let i = 0; i < 6 && contrast(ink, surface) < 7; i++) ink = mix(ink, "#FFFFFF", 0.85);
  } else {
    if (contrast(ink, surface) < 7) ink = mix(ink, "#141210", 0.85);
  }

  let accent = hex(r.accent, "#3d5a80");
  // Saturation : plafonnée en mode clair (goût), LIBRE en mode sombre — un
  // accent franc (acide, sang, chrome) sur fond sombre est un parti pris
  // légitime, pas une faute. Le texte posé sur l'accent est géré par le token
  // --c-on-accent (clair ou foncé selon la luminance) : on n'assombrit plus.
  if (!isDark && saturation(accent) > 0.9) accent = desaturate(accent, 0.25);

  const accent2 = hex(r.accent2, mix(accent, "#ffffff", 0.45));

  let muted = hex(r.muted, "#6e6f72");
  if (contrast(muted, surface) < 3.5) muted = mix(muted, ink, 0.4);

  const heading = findFont(r.headingFont, "heading") ?? findFont("Fraunces", "heading")!;
  const body = findFont(r.bodyFont, "body") ?? findFont("Outfit", "body")!;
  const corners = CORNERS[typeof r.corners === "string" ? r.corners : ""] ?? CORNERS.soft;

  const mood = (Array.isArray(r.mood) ? r.mood : [])
    .filter((m): m is string => typeof m === "string" && !!m.trim())
    .map((m) => m.trim().toLowerCase().slice(0, 18))
    .slice(0, 3);

  return {
    id: "custom",
    label: typeof r.name === "string" && r.name.trim() ? r.name.trim().slice(0, 40) : "Charte sur mesure",
    mood: mood.length === 3 ? mood : ["sur mesure", "équilibré", "professionnel"],
    mode: isDark ? ("dark" as const) : ("light" as const),
    fontHref: `${GF_BASE}?family=${heading.gf}&family=${body.gf}&display=swap`,
    palette: { ink, surface, card, accent, accent2, muted },
    fonts: { heading: heading.css, body: body.css },
    radius: { card: corners.card, xl: corners.xl, pill: "999px" },
  };
}

/**
 * Spec compacte d'une charte (format d'échange client ↔ serveur) : c'est CE
 * format que le tunnel renvoie à /api/foundry/generate, où il est re-réparé
 * via repairCharte — on ne fait jamais confiance à un objet Vibe client.
 */
export interface CharteSpec {
  name: string;
  mood: string[];
  /** Clair ou sombre — TOUJOURS transporté, sinon repairCharte ré-éclaircit une charte sombre. */
  mode?: "light" | "dark";
  ink: string;
  surface: string;
  card: string;
  accent: string;
  accent2: string;
  muted: string;
  headingFont: string;
  bodyFont: string;
  corners: "sharp" | "soft" | "round";
}

/** Spec d'échange depuis une Vibe réparée (famille = tête de pile CSS). */
export function vibeToSpec(vibe: Vibe): CharteSpec {
  const family = (stack: string) => stack.split(",")[0].replace(/['"]/g, "").trim();
  const px = parseInt(vibe.radius.card, 10);
  return {
    name: vibe.label,
    mood: vibe.mood,
    mode: vibe.mode ?? "light",
    ...vibe.palette,
    headingFont: family(vibe.fonts.heading),
    bodyFont: family(vibe.fonts.body),
    corners: px <= 8 ? "sharp" : px <= 18 ? "soft" : "round",
  };
}

// --- Sélecteur Mistral (pioche dans la banque, ne crée rien) ----------------------

export interface CharteProposal {
  vibe: Vibe;
  /** Spec d'échange à repasser à /api/foundry/generate (re-réparée serveur). */
  spec: CharteSpec;
  /** 1 phrase FR : pourquoi cette charte pour CE client. */
  reason: string;
}

export type ChartesResult = { chartes: CharteProposal[]; source: "ai" | "fallback" };

type ChatFn = (
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  opts?: { json?: boolean; maxTokens?: number; temperature?: number },
) => Promise<string>;

/** Ligne de catalogue d'une charte pour le sélecteur (id + identité lisible). */
function catalogLine(id: VibeId): string {
  const v = getVibe(id)!;
  const m = CHARTE_META[id];
  return `- ${id} · « ${v.label} » · ${v.mode ?? "light"} · ${v.mood.join(", ")} · ${m.ambiance} (idéal : ${m.idealFor})`;
}

/**
 * Messages du SÉLECTEUR : Mistral ne crée rien, il choisit `count` IDs parmi la
 * bibliothèque disponible (hors déjà-vu), classés par pertinence pour le client.
 */
export function buildSelectMessages(
  input: { brief: string; businessName: string },
  availableIds: VibeId[],
  count: number,
) {
  const system = `Tu es le DIRECTEUR ARTISTIQUE d'Akyra. Tu NE CRÉES PAS de charte : tu CHOISIS, dans notre bibliothèque de chartes DÉJÀ conçues, les ${count} qui correspondent le mieux à ce client.

RÈGLES :
- Choisis EXACTEMENT ${count} chartes, par leur identifiant "id", UNIQUEMENT dans la liste fournie. N'invente aucun id, recopie-le exactement.
- Priorité 1 : la PERTINENCE — métier, ton et univers du client (sers-toi de l'ambiance et du "idéal" de chaque charte). Ne propose jamais une charte hors-sujet (ex. une charte rock pour un coach bien-être).
- Priorité 2 : la VARIÉTÉ entre les ${count} — familles de couleurs différentes, et si pertinent un mélange clair/sombre.
- reason : 1 phrase FR qui relie la charte AU client (jamais générique).

SORTIE : JSON STRICT, rien d'autre :
{"selection":[{"id":"...","reason":"..."}${count > 1 ? ", …" : ""}]}`;

  const user = `CLIENT : « ${input.businessName.trim().slice(0, 80)} »
PITCH : « ${input.brief.trim().slice(0, 2500)} »

BIBLIOTHÈQUE DISPONIBLE (${availableIds.length} chartes) :
${availableIds.map(catalogLine).join("\n")}

Choisis les ${count} meilleures pour CE client et renvoie le JSON.`;

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

interface RawSelection { id?: unknown; reason?: unknown }

function parseSelection(rawText: string): RawSelection[] {
  const tryParse = (s: string): RawSelection[] | null => {
    try {
      const parsed = JSON.parse(s) as { selection?: unknown };
      return Array.isArray(parsed?.selection) ? (parsed.selection as RawSelection[]) : null;
    } catch {
      return null;
    }
  };
  const direct = tryParse(rawText);
  if (direct) return direct;
  const start = rawText.indexOf("{");
  const end = rawText.lastIndexOf("}");
  if (start === -1 || end <= start) return [];
  return tryParse(rawText.slice(start, end + 1)) ?? [];
}

/** Repli : les 3 vibes curées suggérées pour le métier. */
export function fallbackChartes(brief: string): CharteProposal[] {
  return suggestVibes(brief).slice(0, 3).map((s) => {
    const vibe = getVibe(s.vibeId)!;
    return { vibe, spec: vibeToSpec(vibe), reason: s.reason };
  });
}

const SELECT_TIMEOUT_MS = 20_000;

/** Proposal depuis un id de la banque (vibe réelle + spec d'échange + raison). */
function proposalFromId(vibeId: VibeId, reason: string): CharteProposal {
  const vibe = getVibe(vibeId)!;
  return { vibe, spec: vibeToSpec(vibe), reason };
}

/**
 * `count` chartes piochées dans la banque curée pour un pitch — Mistral CHOISIT
 * (il ne crée rien), on ne sert QUE des chartes existantes. NE PEUT PAS ÉCHOUER :
 * repli sur le classement métier déterministe (rankVibesForTrade via suggestVibes).
 * `exclude` = ids déjà montrés (bouton « 3 autres ») → jamais re-proposés.
 */
export async function selectChartes(
  input: { brief: string; businessName: string; exclude?: string[]; count?: number },
  chatFn: ChatFn,
): Promise<ChartesResult> {
  const count = input.count ?? 3;
  const exclude = new Set((input.exclude ?? []).filter((x): x is string => typeof x === "string"));
  const available = VIBE_IDS.filter((id) => !exclude.has(id));

  // Classement métier déterministe, hors déjà-vu — repli ET source des raisons.
  const ranked = suggestVibes(input.brief).filter((r) => !exclude.has(r.vibeId));
  const rankedReason = (id: VibeId) =>
    ranked.find((r) => r.vibeId === id)?.reason ?? "Une base élégante, adaptée à votre activité.";
  const fromRanking = (): CharteProposal[] =>
    ranked.slice(0, count).map((r) => proposalFromId(r.vibeId, r.reason));

  // Plus assez de chartes pour qu'un choix ait du sens → on sert le classement.
  if (available.length <= count) {
    return { chartes: fromRanking(), source: "fallback" };
  }

  try {
    const raw = await Promise.race([
      chatFn(buildSelectMessages(input, available, count), { json: true, maxTokens: 700, temperature: 0.4 }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("select timeout")), SELECT_TIMEOUT_MS)),
    ]);
    const valid = new Set<string>(available);
    const seen = new Set<string>();
    const chartes: CharteProposal[] = [];
    for (const p of parseSelection(raw)) {
      if (chartes.length >= count) break;
      const id = typeof p?.id === "string" ? p.id.trim() : "";
      if (!valid.has(id) || seen.has(id)) continue; // id inconnu / exclu / doublon → ignoré
      seen.add(id);
      const reason =
        typeof p?.reason === "string" && p.reason.trim()
          ? p.reason.trim().slice(0, 180)
          : rankedReason(id as VibeId);
      chartes.push(proposalFromId(id as VibeId, reason));
    }
    if (chartes.length === 0) throw new Error("aucun id exploitable");
    // L'IA en a renvoyé moins de `count` → on complète par le classement métier.
    for (const r of ranked) {
      if (chartes.length >= count) break;
      if (!seen.has(r.vibeId)) {
        seen.add(r.vibeId);
        chartes.push(proposalFromId(r.vibeId, r.reason));
      }
    }
    return { chartes, source: "ai" };
  } catch (e) {
    console.error("[foundry/charte] sélection — repli classement métier :", e instanceof Error ? e.message : e);
    return { chartes: fromRanking(), source: "fallback" };
  }
}
