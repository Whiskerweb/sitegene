// lib/foundry/charte.ts
// Chartes graphiques SUR MESURE générées par Mistral (étape DA de /creer),
// cadrées par les règles de goût du skill `stitch-design-taste` (.agents/skills) :
// un seul accent, saturation plafonnée, jamais de noir pur, surfaces claires,
// fonts à caractère (liste blanche Google Fonts vérifiée). Toute sortie IA est
// RÉPARÉE (contrastes WCAG, fonts inconnues) ; repli = vibes curées. Zéro import
// réseau ici (chatFn injectée) — testable sans réseau.
import type { Vibe } from "./types";
import { getVibe } from "./vibes";
import { suggestVibes } from "./suggest";

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

// --- Génération Mistral ------------------------------------------------------------

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

function fontsForPrompt(role: "heading" | "body"): string {
  return CHARTE_FONTS.filter((f) => f.roles.includes(role)).map((f) => f.family).join(", ");
}

/** Métiers au registre EXPRESSIF : l'audace y est une qualité, pas un risque. */
const EXPRESSIVE_TRADES = new Set(["musicien", "fitness", "restaurant"]);

/** Directives par sous-persona (prime sur la directive métier). */
const SUB_GUIDANCE: Record<string, string> = {
  "musicien:rock":
    "Sous-genre ROCK/METAL : les 3 chartes DOIVENT cogner. Surfaces noires ou charbon (mode dark), accents TRANCHANTS au choix : jaune acide, rouge sang, blanc brut, vert toxique, chrome. Typographies condensées ou brutales. INTERDIT ABSOLU : terracotta, cuivre vieilli, beige, bleu doux, tout ce qui est « chaleureux » — rien de mou, rien de décoratif.",
  "musicien:rap":
    "Sous-genre RAP/URBAIN : luxe-street assumé. Noir profond, or, chrome, violet nuit ; contrastes maximaux, typographies massives. Pas de pastels, pas de tons terreux.",
  "musicien:contemporain":
    "Sous-genre CONTEMPORAIN/FOLK : éditorial intime, sérifs sensibles, palettes feutrées MAIS avec un parti pris (encre profonde, un accent inattendu) — pas de fadeur.",
};

export function buildCharteMessages(input: { brief: string; businessName: string; trade?: string; sub?: string; attempt?: number }) {
  const TRADE_GUIDANCE: Record<string, string> = {
    musicien: "Ce client est un MUSICIEN. Les 3 chartes DOIVENT respirer l'univers musical : artwork d'album, contraste fort, typographies expressives (condensée, display), ambiance de scène live ou de streaming. Pour un musicien rock ou rap, au moins 2 des 3 chartes DOIVENT avoir mode: \"dark\" — surface sombre (#0a0a0a à #1a1a1a), ink clair (#f0f0f0 à #ffffff). INTERDIT : look générique d'entreprise, pastels ternes, 3 chartes claires pour un rockeur.",
    photographe: "Ce client est un PHOTOGRAPHE. Les chartes doivent laisser l'image respirer : beaucoup d'air, surfaces quasi-blanches, typographie sobre et élégante, palette froide ou neutre qui ne concurrence pas les photos.",
    restaurant: "Ce client est un RESTAURATEUR. Les chartes doivent évoquer la gastronomie : matières chaudes (ardoise, braise, bois), typographies à caractère, accents dorés ou profonds, ambiance de salle à la lueur des bougies ou de bistrot de quartier.",
    fitness: "Ce client est dans le FITNESS. Les chartes doivent dégager de l'énergie : industriel, contraste maximal, typographies condensées, couleurs vives électriques (lime, orange, rouge), lignes nettes.",
    coach: "Ce client est un COACH. Les chartes doivent inspirer confiance et apaisement : surfaces claires lumineuses, typographies arrondies ou serif chauds, accents discrets mais chaleureux, tons terreux ou végétaux premium.",
    "bien-etre": "Ce client est dans le BIEN-ÊTRE. Les chartes doivent inspirer calme et soin : tons naturels (vert profond, lin, ivoire), typographies organiques, beaucoup d'espace, pas de couleurs criardes.",
    artisan: "Ce client est un ARTISAN. Les chartes doivent projeter fiabilité et savoir-faire : tons sérieux (marine, ardoise, brun chaud), typographies lisibles et directes, matière et texture dans les couleurs.",
    beaute: "Ce client est dans la BEAUTÉ (coiffeur, esthétique…). Les chartes doivent être raffinées et actuelles : noir élégant ou nude, typographies fines, touches de couleur précises et sophistiquées.",
    conseil: "Ce client est dans le CONSEIL ou la TECH. Les chartes doivent projeter professionnalisme et clarté : tons bleus froids ou neutres structurés, typographies géométriques nettes, design orienté lisibilité et conversion.",
  };
  const subKey = input.trade && input.sub ? `${input.trade}:${input.sub}` : "";
  const tradeNote = [
    input.trade && TRADE_GUIDANCE[input.trade] ? `\nDIRECTIVE MÉTIER : ${TRADE_GUIDANCE[input.trade]}` : "",
    subKey && SUB_GUIDANCE[subKey] ? `\nDIRECTIVE SOUS-GENRE (prioritaire) : ${SUB_GUIDANCE[subKey]}` : "",
  ].join("");
  const expressive = !!input.trade && EXPRESSIVE_TRADES.has(input.trade);
  const registre = expressive
    ? "- Registre EXPRESSIF : ce métier vit de son identité. Accents FRANCS et assumés (saturés, acides, métalliques) bienvenus, surtout sur surface sombre. La tiédeur est la seule faute de goût."
    : "- Registre CALME : saturation modérée (jamais néon, jamais violet/bleu fluo « IA »), surfaces apaisées.";

  const system = `Tu es le DIRECTEUR ARTISTIQUE d'Akyra. Tu composes des chartes graphiques SUR MESURE pour des sites vitrines d'indépendants français. Tu produis 3 directions distinctes et tranchées — pas trois variations de la même.

RÈGLES DE GOÛT (strictes, non négociables) :
- Les 3 directions doivent être RADICALEMENT différentes ENTRE ELLES : familles de couleurs différentes, températures différentes, personnalités différentes — au moins une inattendue. INTERDIT : deux chartes de la même famille (deux brunes/cuivrées, deux marines, deux beiges).
- UN SEUL accent dominant par charte.
${registre}
- Jamais de noir pur (#000000) : encres profondes teintées (charbon, brun, bleu nuit).
- En mode light : surfaces claires teintées par le métier (crème, lin, brume…). En mode dark : surfaces profondes (charbon, encre, nuit). La carte (card) = la surface légèrement décalée, même famille.
- Couleurs nommées par leur rôle, calibrées pour le métier du client (un plombier n'a pas la palette d'un fleuriste).
- muted = texte secondaire, lisible sur la surface.
- Typographies à CARACTÈRE : la hiérarchie vient de la graisse et de la couleur, pas de la taille criarde.
- headingFont à choisir UNIQUEMENT parmi : ${fontsForPrompt("heading")}.
- bodyFont à choisir UNIQUEMENT parmi : ${fontsForPrompt("body")}.
- corners : "sharp" (éditorial, précis), "soft" (équilibré) ou "round" (chaleureux, organique) — accordé à la personnalité.
- name : nom de charte évocateur en français (2-3 mots, ex. « Terre d'atelier »). mood : 3 adjectifs français.
- reason : 1 phrase française qui relie la charte AU MÉTIER du client (jamais générique).${tradeNote}

- mode : "light" (surface claire) ou "dark" (surface sombre) — OBLIGATOIRE, dicté par le métier.

SORTIE : JSON STRICT, rien d'autre :
{"chartes":[{"name":"…","mood":["…","…","…"],"mode":"light","ink":"#xxxxxx","surface":"#xxxxxx","card":"#xxxxxx","accent":"#xxxxxx","accent2":"#xxxxxx","muted":"#xxxxxx","headingFont":"…","bodyFont":"…","corners":"soft","reason":"…"}, …3 chartes…]}`;

  const varietyNote = (input.attempt ?? 0) > 0
    ? `\nATTENTION : le client a déjà vu une première série de chartes. Propose 3 directions ENTIÈREMENT DIFFÉRENTES — autre palette, autres fonts, autre ambiance. Ne répète pas les mêmes noms de charte ni les mêmes couleurs dominantes.`
    : "";

  const user = `CLIENT : « ${input.businessName.trim().slice(0, 80)} »
PITCH : « ${input.brief.trim().slice(0, 1200)} »${varietyNote}

Compose 3 chartes sur mesure pour ce client et renvoie le JSON.`;

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

function parseChartes(rawText: string): unknown[] {
  const tryParse = (s: string): unknown[] | null => {
    try {
      const parsed = JSON.parse(s) as { chartes?: unknown };
      return Array.isArray(parsed?.chartes) ? parsed.chartes : null;
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

const CHARTE_TIMEOUT_MS = 45_000;

/**
 * 3 chartes sur mesure pour un pitch. NE PEUT PAS ÉCHOUER : sortie réparée
 * charte par charte, complétée par les vibes curées si l'IA en rend moins de 3.
 */
export async function generateChartes(
  input: { brief: string; businessName: string; trade?: string; sub?: string; attempt?: number },
  chatFn: ChatFn,
): Promise<ChartesResult> {
  try {
    const raw = await Promise.race([
      // Température haute : 3 directions tranchées ET différentes d'un client à
      // l'autre — à 0.2 le modèle resservait toujours les mêmes palettes.
      chatFn(buildCharteMessages(input), { json: true, maxTokens: 2200, temperature: 0.9 }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("charte timeout")), CHARTE_TIMEOUT_MS)),
    ]);
    const list = parseChartes(raw);
    const repaired: CharteProposal[] = list.slice(0, 3).map((c) => {
      const vibe = repairCharte(c);
      return {
        vibe,
        spec: vibeToSpec(vibe),
        reason:
          typeof (c as Record<string, unknown>)?.reason === "string"
            ? String((c as Record<string, unknown>).reason).trim().slice(0, 180)
            : "Composée sur mesure pour votre activité.",
      };
    });
    if (repaired.length === 0) throw new Error("aucune charte exploitable");
    // Moins de 3 → on complète avec les vibes curées du métier.
    for (const fb of fallbackChartes(input.brief)) {
      if (repaired.length >= 3) break;
      repaired.push(fb);
    }
    return { chartes: repaired, source: "ai" };
  } catch (e) {
    console.error("[foundry/charte] repli vibes curées :", e instanceof Error ? e.message : e);
    return { chartes: fallbackChartes(input.brief), source: "fallback" };
  }
}
