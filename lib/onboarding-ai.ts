/**
 * Onboarding conversationnel TEMPS RÉEL.
 *
 * Un agent Mistral mène la conversation : à chaque tour il (a) EXTRAIT les faits
 * du dernier message client vers l'`intake`, (b) pose la PROCHAINE question
 * improvisée (adaptée au métier réel, même hors catalogue) ou conclut. Un SOCLE
 * d'informations est garanti : l'agent ne peut pas conclure tant qu'il manque
 * une info essentielle (activité, services, prix, zone, ton, contact).
 *
 * Le nombre exact de photos est annoncé APRÈS le choix du thème (image-plan).
 * SERVEUR uniquement.
 */
import type { Intake } from "@/lib/onboarding-config";
import { getCategory } from "@/lib/categories";

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

export type ChatMsg = { role: "user" | "assistant"; content: string };

/** Socle d'infos requis avant de pouvoir conclure l'onboarding. */
type Slot = { key: string; label: string; filled: (i: Intake) => boolean };
// Ordre : identité en premier (brand, activity, tone) → sections du corps ensuite.
export const SOCLE: Slot[] = [
  { key: "brand", label: "nom de l'activité / de la marque", filled: (i) => !!i.brand?.trim() },
  {
    key: "activity",
    label: "description de l'activité (métier, ce que la personne propose)",
    filled: (i) => !!(i.about?.trim() || i.trade?.trim() || i.jobTitle?.trim() || i.genre?.trim()),
  },
  { key: "tone", label: "ambiance / ton souhaité pour le site", filled: (i) => !!i.tone },
  {
    key: "services",
    label: "prestations / services proposés",
    filled: (i) => !!(i.services?.length || i.eventTypes?.length),
  },
  {
    key: "priceRange",
    label: "tarifs (fourchette) ou choix de ne pas en afficher",
    filled: (i) => (i.priceRange != null && i.priceRange !== "") || i.wantsPricingPage === false,
  },
  {
    key: "area",
    label: "zone d'intervention / ville",
    filled: (i) => !!(i.area?.trim() || i.city?.trim()),
  },
  {
    key: "contact",
    label: "email ou téléphone de contact",
    filled: (i) => !!(i.contactEmail?.trim() || i.contactPhone?.trim()),
  },
];

/** Clés des slots dans l'ordre du SOCLE. */
export const SOCLE_ORDER = SOCLE.map((s) => s.key); // ["brand","activity","tone","services","priceRange","area","contact"]

/** Slots qui passent de NON-remplis à remplis entre deux intakes. */
export function newlyFilledSlots(before: Intake, after: Intake): string[] {
  return SOCLE.filter((s) => !s.filled(before) && s.filled(after)).map((s) => s.key);
}

/** Section du corps déclenchée par un slot (null = pas de section, ex. identité). */
export function slotToSection(slot: string): string | null {
  switch (slot) {
    case "services": return "services";
    case "priceRange": return "pricing"; // (→ 'approach' résolu par sectionPlanForIntake)
    case "area": return "about";
    case "contact": return "contact";
    default: return null;
  }
}

/** L'identité (header générable) est-elle connue ? activity + categoryId requis. */
export function identityReady(intake: Intake & { categoryId?: string }): boolean {
  const hasActivity = !!(intake.about?.trim() || intake.trade?.trim() || intake.jobTitle?.trim() || intake.genre?.trim());
  return hasActivity && !!intake.categoryId;
}

function progressFor(intake: Intake): { filled: string[]; missing: string[] } {
  const filled: string[] = [];
  const missing: string[] = [];
  for (const s of SOCLE) (s.filled(intake) ? filled : missing).push(s.label);
  return { filled, missing };
}

export type NextTurn = {
  /** Message du bot (question improvisée ou clôture chaleureuse). */
  assistant: string;
  /** Faits extraits du dernier message client (à fusionner dans l'intake). */
  intakePatch: Partial<Intake>;
  /** true uniquement quand le socle est complet ET l'IA estime avoir terminé. */
  done: boolean;
  progress: { filled: string[]; missing: string[] };
};

const SYSTEM = `Tu es Akyra, l'assistante d'onboarding d'un créateur de sites vitrines. Tu mènes une CONVERSATION naturelle, en français, pour récolter le MAXIMUM d'informations sur l'activité de la personne afin de lui construire un site sur-mesure.

STYLE : chaleureuse, concise, humaine. UNE seule question à la fois. Tu t'ADAPTES au métier réel de la personne (même un métier inhabituel : fleuriste, tatoueur, coach, traiteur…). Tu rebondis sur ses réponses, tu creuses les spécificités de SON métier. Jamais de questions génériques plaquées : improvise selon le contexte.

TON OBJECTIF est de remplir un SOCLE d'informations essentielles (la liste des manquants t'est donnée à chaque tour). Tu peux aussi récolter tout détail utile (spécialités, public, valeurs, délais, garanties, réseaux…). N'invente JAMAIS d'email, de téléphone, de prix ou d'avis : demande-les.

À CHAQUE TOUR, tu réponds en JSON STRICT :
{
  "assistant": "<ton message : un accusé de réception bref + la prochaine question, OU le message de clôture>",
  "intake": { <faits extraits du DERNIER message client, voir clés ci-dessous ; objet vide {} si rien de neuf> },
  "done": <true UNIQUEMENT si la liste des manquants est vide et que tu as assez pour construire un beau site ; sinon false>
}

CLÉS d'intake possibles (n'écris que celles que tu peux renseigner depuis le dernier message) :
- categoryId : la grande famille du métier, à déduire dès que l'activité est connue. UNE valeur parmi EXACTEMENT : "photographe", "musicien", "artisan" (métiers manuels/services à domicile), "portfolio" (indépendants, créatifs, coachs, consultants, professions libérales), "saas" (produit/app/tech). Choisis la plus proche (ex. fleuriste→artisan, coach→portfolio, traiteur→artisan, avocat→portfolio).
- brand (string) · about (string : description de l'activité) · trade (string : métier) · jobTitle · genre
- services (string[]) · eventTypes (string[])
- priceRange (string) · wantsPricingPage (boolean : false si la personne ne veut pas de page tarifs)
- area (string : zone) · city (string)
- tone ("chaleureux" | "premium" | "naturel")
- contactEmail · contactPhone · instagram · websiteUrl · availability
- certifications · experienceYears · socialLinks · musicLinks · upcomingDates · skills · projects
- brief (string) : SYNTHÈSE cumulée et enrichie de tout ce que tu sais sur l'activité (réécris-la à chaque tour en intégrant les nouveaux éléments — elle servira à générer les textes du site)

RÈGLES :
- Si l'historique est vide : accueille chaleureusement (1 phrase) puis pose la 1re question sur l'activité.
- Ne conclus (done:true) que lorsque la liste des manquants est VIDE. S'il reste des manquants, pose une question qui cible l'un d'eux (sans être robotique).
- Pose toujours une question qui cible le PREMIER élément de la liste des manquants (dans l'ordre donné), sans être robotique.
- Pour "tone", déduis-le du discours si possible plutôt que de poser une question fermée.
- Reste bref. Pas de listes à puces dans "assistant".`;

async function callJson(messages: { role: string; content: string }[], timeoutMs: number): Promise<string | null> {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) return null;
  const model = process.env.MISTRAL_MODEL || "mistral-large-latest";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(MISTRAL_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
        max_tokens: 1400,
        response_format: { type: "json_object" },
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const j = await res.json();
    return j.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const ALLOWED_KEYS = new Set([
  "categoryId", "brand", "about", "trade", "jobTitle", "genre", "services", "eventTypes",
  "priceRange", "wantsPricingPage", "area", "city", "tone", "contactEmail", "contactPhone",
  "instagram", "websiteUrl", "availability", "certifications", "experienceYears", "socialLinks",
  "musicLinks", "upcomingDates", "skills", "projects", "brief",
]);

/** Filtre/normalise le patch d'intake renvoyé par l'IA (sécurité de schéma). */
function sanitizePatch(raw: unknown): Partial<Intake> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!ALLOWED_KEYS.has(k)) continue;
    if (k === "categoryId") {
      // Valide contre le catalogue de catégories (sinon ignoré).
      if (typeof v === "string" && getCategory(v)) out[k] = v;
    } else if (k === "services" || k === "eventTypes") {
      if (Array.isArray(v)) out[k] = v.map(String).filter(Boolean).slice(0, 12);
    } else if (k === "wantsPricingPage") {
      if (typeof v === "boolean") out[k] = v;
    } else if (k === "tone") {
      // L'IA renvoie souvent un ton DESCRIPTIF ("premium et élégant…") : on le
      // normalise vers l'enum (la nuance est conservée dans `brief`). Sans ça le
      // slot `tone` ne se remplirait jamais → l'onboarding ne conclurait pas.
      if (typeof v === "string" && v.trim()) {
        const t = v.toLowerCase();
        out[k] = /premium|luxe|élégan|chic|haut de gamme|raffin|prestige/.test(t)
          ? "premium"
          : /naturel|nature|bio|authentiqu|brut|organic|épur/.test(t)
            ? "naturel"
            : "chaleureux";
      }
    } else if (typeof v === "string" && v.trim()) {
      out[k] = v.trim();
    }
  }
  return out as Partial<Intake>;
}

/**
 * Un tour de conversation. `history` = transcript complet (rôles user/assistant),
 * `intake` = état accumulé. Retourne le message du bot, le patch d'intake, et si
 * l'onboarding est terminé (socle complet). En cas d'indisponibilité Mistral,
 * renvoie un tour de repli neutre (jamais bloquant).
 */
export async function nextTurn(input: { history: ChatMsg[]; intake: Intake }): Promise<NextTurn> {
  const { history, intake } = input;
  const before = progressFor(intake);

  const sys =
    SYSTEM +
    `\n\nÉTAT ACTUEL — déjà connu : ${before.filled.join(", ") || "(rien)"}.` +
    `\nMANQUANTS (à couvrir avant de conclure) : ${before.missing.join(", ") || "(aucun — tu peux conclure)"}.`;

  const messages = [
    { role: "system", content: sys },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];
  // Amorce si pas encore de message client.
  if (history.length === 0) {
    messages.push({ role: "user", content: "(Démarre l'onboarding.)" });
  }

  const raw = await callJson(messages, 25_000);
  if (!raw) {
    // Repli : ne bloque jamais. Pose une question sur le 1er manquant.
    const target = before.missing[0] ?? "votre activité";
    return {
      assistant: `Pouvez-vous m'en dire plus sur ${target} ?`,
      intakePatch: {},
      done: false,
      progress: before,
    };
  }

  let parsed: { assistant?: unknown; intake?: unknown; done?: unknown };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      assistant: "Parlez-moi un peu plus de votre activité, pour que je cale le site sur vous.",
      intakePatch: {},
      done: false,
      progress: before,
    };
  }

  const intakePatch = sanitizePatch(parsed.intake);
  const merged = { ...intake, ...intakePatch } as Intake;
  const after = progressFor(merged);
  // Hard-gate : on ne conclut JAMAIS si le socle est incomplet.
  const done = parsed.done === true && after.missing.length === 0;

  const assistant =
    typeof parsed.assistant === "string" && parsed.assistant.trim()
      ? parsed.assistant.trim()
      : after.missing.length
        ? `Et concernant ${after.missing[0]} ?`
        : "Parfait, j'ai tout ce qu'il me faut !";

  return { assistant, intakePatch, done, progress: after };
}
