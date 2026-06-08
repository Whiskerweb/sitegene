/**
 * Choix du design system (thème) adapté au client — CROSS-MÉTIER.
 *
 * On indexe l'ADN (§1 du design-system.md) des 30 templates, puis Mistral choisit
 * le meilleur fit pour l'intake du client, quel que soit son métier (un fleuriste
 * peut hériter d'une DA de photographe éditorial, etc.). SERVEUR uniquement.
 */
import { TEMPLATE_IDS, TEMPLATE_META, isTemplateId, type TemplateId } from "@/lib/templates";
import { CATEGORIES } from "@/lib/categories";
import type { Intake } from "@/lib/onboarding-config";

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

export type AdnEntry = { templateId: TemplateId; name: string; category: string; adn: string };

// Carte templateId → catégorie (indice, pas une contrainte).
const CATEGORY_OF: Record<string, string> = {};
for (const c of CATEGORIES) for (const t of c.templateIds) CATEGORY_OF[t] = c.id;

/** Extrait le §1 ADN d'un design-system.md (texte condensé). */
function extractAdn(md: string): string {
  const m = /##\s*1\.\s*ADN([\s\S]*?)(?:\n##\s|\n#\s|$)/i.exec(md);
  const body = (m?.[1] ?? "").replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  return body.slice(0, 320);
}

let _index: AdnEntry[] | null = null;

/** Index ADN des 30 templates (mis en cache au niveau module). */
export async function buildAdnIndex(origin: string): Promise<AdnEntry[]> {
  if (_index) return _index;
  const entries = await Promise.all(
    TEMPLATE_IDS.map(async (templateId) => {
      let adn = "";
      try {
        const res = await fetch(`${origin}/_templates/${templateId}/design-system.md`, {
          cache: "no-store",
        });
        if (res.ok) adn = extractAdn(await res.text());
      } catch {
        /* ignore */
      }
      return {
        templateId,
        name: TEMPLATE_META[templateId]?.name ?? templateId,
        category: CATEGORY_OF[templateId] ?? "autre",
        adn: adn || TEMPLATE_META[templateId]?.style || templateId,
      } as AdnEntry;
    }),
  );
  _index = entries;
  return entries;
}

function intakeSummary(intake: Intake): string {
  const bits: string[] = [];
  if (intake.brand) bits.push(`Marque: ${intake.brand}`);
  if (intake.trade || intake.about) bits.push(`Activité: ${intake.trade ?? ""} ${intake.about ?? ""}`.trim());
  if (intake.jobTitle) bits.push(`Titre: ${intake.jobTitle}`);
  if (intake.genre) bits.push(`Genre: ${intake.genre}`);
  if (intake.services?.length) bits.push(`Services: ${intake.services.join(", ")}`);
  if (intake.eventTypes?.length) bits.push(`Types: ${intake.eventTypes.join(", ")}`);
  if (intake.tone) bits.push(`Ton souhaité: ${intake.tone}`);
  if (intake.priceRange) bits.push(`Prix: ${intake.priceRange}`);
  if (intake.area || intake.city) bits.push(`Zone: ${intake.area ?? intake.city}`);
  if (intake.brief) bits.push(`Brief: ${intake.brief}`);
  return bits.join("\n").slice(0, 1800);
}

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
        temperature: 0.2,
        max_tokens: 300,
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

export type ThemeChoice = { templateId: TemplateId; rationale: string };

/**
 * Choisit le design system le plus adapté à l'intake. Cross-métier : l'IA peut
 * piocher dans toute la bibliothèque selon l'esthétique (ton, métier, services),
 * pas seulement la catégorie. Fallback déterministe si Mistral indisponible.
 */
export async function pickDesignSystem(
  origin: string,
  intake: Intake,
  opts?: { fallbackTemplateId?: string },
): Promise<ThemeChoice> {
  const index = await buildAdnIndex(origin);
  const fallback =
    (opts?.fallbackTemplateId && isTemplateId(opts.fallbackTemplateId) && opts.fallbackTemplateId) ||
    // défaut : 1er template de la catégorie détectée, sinon electrician-pro.
    (intake.categoryId && CATEGORIES.find((c) => c.id === intake.categoryId)?.defaultTemplateId) ||
    "electrician-pro";

  const catalogue = index
    .map((e) => `- ${e.templateId} [${e.category}] « ${e.name} » : ${e.adn}`)
    .join("\n");

  const system = `Tu choisis, dans une bibliothèque de directions artistiques (DA) de sites vitrines, celle qui colle le MIEUX à l'activité d'un client — quel que soit son métier. Tu ne te limites PAS à la catégorie : c'est l'esthétique (ton voulu, univers, type de contenu) qui prime. Un fleuriste premium peut très bien prendre une DA de photographe éditorial chaleureux ; un coach peut prendre une DA SaaS épurée ; etc.

Réponds en JSON STRICT : {"templateId":"<un id EXACT de la liste>","rationale":"<1 phrase FR expliquant le fit>"}.`;

  const user = `CLIENT :
${intakeSummary(intake)}

BIBLIOTHÈQUE DE DA (id [catégorie] « nom » : ADN) :
${catalogue}

Choisis le templateId le plus adapté.`;

  const raw = await callJson(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    20_000,
  );
  if (raw) {
    try {
      const obj = JSON.parse(raw) as { templateId?: unknown; rationale?: unknown };
      const tid = typeof obj.templateId === "string" ? obj.templateId : "";
      if (isTemplateId(tid)) {
        return {
          templateId: tid,
          rationale: typeof obj.rationale === "string" ? obj.rationale : "",
        };
      }
    } catch {
      /* fallthrough */
    }
  }
  return { templateId: fallback as TemplateId, rationale: "" };
}
