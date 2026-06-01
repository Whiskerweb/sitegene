/**
 * Client Mistral (modifications de design en live). Clé via MISTRAL_API_KEY,
 * modèle via MISTRAL_MODEL (défaut mistral-large-latest). SERVEUR uniquement.
 */
import { getPath } from "@/lib/content-overlay";

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

type Msg = { role: "system" | "user" | "assistant"; content: string };

async function chat(messages: Msg[], opts?: { json?: boolean; maxTokens?: number }): Promise<string> {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) throw new Error("MISTRAL_API_KEY manquant.");
  const model = process.env.MISTRAL_MODEL || "mistral-large-latest";
  const res = await fetch(MISTRAL_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: opts?.maxTokens ?? 1800,
      temperature: 0.2,
      ...(opts?.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Mistral ${res.status}: ${t.slice(0, 200)}`);
  }
  const j = await res.json();
  return j.choices?.[0]?.message?.content ?? "";
}

export type DesignTarget = { cssSelector?: string; label?: string; path?: string } | null;
export type DesignProposal =
  | { action: "css"; css: string; explanation: string }
  | { action: "unsupported"; reason: string };

/** Demande à Mistral une modification de design en CSS, à partir d'une note épinglée. */
export async function proposeDesignEdit(input: {
  request: string;
  target: DesignTarget;
  currentCss: string;
}): Promise<DesignProposal> {
  const { request, target, currentCss } = input;

  const system = `Tu es un assistant qui RETOUCHE un site vitrine de photographe existant en CSS personnalisé, injecté APRÈS le CSS du site (tes règles l'emportent à spécificité égale).

Tu MODIFIES ce qui existe déjà — tu ne DÉVELOPPES JAMAIS le site.
- AUTORISÉ (CSS uniquement) : changer couleurs, fonds, dégradés, espacements, tailles/poids de police, arrondis, ombres, bordures, alignement ; et MASQUER / SUPPRIMER un élément existant (display:none / visibility).
- INTERDIT → réponds {"action":"unsupported","reason":"..."} : ajouter ou créer quoi que ce soit (nouvelle section, page, bloc, texte, image, bouton, élément), dupliquer, réorganiser la structure, écrire du nouveau contenu. Si la demande revient à AGRANDIR/DÉVELOPPER le site → unsupported.
- Le TEXTE et les PHOTOS se modifient à la main dans l'éditeur (pas ton rôle) : si on te demande de réécrire un texte précis ou de remplacer une photo → unsupported.
- Reprends TOUJOURS le CSS existant et renvoie le CSS COMPLET (existant + ta modification), pas un diff.
- Utilise le sélecteur fourni quand la demande vise un élément précis. Pour « le fond du site/de la page », cible large (ex: body, #top, section).
- Interdits absolus dans le CSS : le caractère <, @import, javascript:, expression(, behavior:.
- Réponse en JSON STRICT, rien d'autre : {"action":"css","css":"<css complet>","explanation":"<1 phrase FR>"} OU {"action":"unsupported","reason":"<1 phrase FR>"}.`;

  const user = `CSS personnalisé actuel (peut être vide) :
${currentCss || "/* (vide) */"}

Élément ciblé par le client : ${target?.label || "(non précisé)"}${target?.cssSelector ? ` — sélecteur: ${target.cssSelector}` : ""}.

Demande du client : "${request}"

Renvoie le JSON.`;

  const raw = await chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { json: true },
  );

  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(raw);
  } catch {
    return { action: "unsupported", reason: "Réponse de l'IA illisible — réessayez." };
  }
  if (obj.action === "css" && typeof obj.css === "string") {
    return {
      action: "css",
      css: obj.css,
      explanation: typeof obj.explanation === "string" ? obj.explanation : "Modification appliquée.",
    };
  }
  return {
    action: "unsupported",
    reason: typeof obj.reason === "string" ? obj.reason : "Demande non réalisable automatiquement.",
  };
}

type EditableField = { path?: string; type?: string; maxLen?: number };

/**
 * Personnalise un site PRO existant à partir d'un brief libre : réécrit les
 * champs TEXTE concrets (sans liste `[]`) du template pour qu'ils collent au
 * client, bornés par le `maxLen` du manifest. Renvoie un map { path: valeur }.
 * Vide si l'IA est indisponible / illisible / trop lente (→ fallback contenu
 * démo, le site reste beau et pro). Timeout court pour ne pas plomber la
 * conversion sur la landing.
 */
export async function briefToOverrides(input: {
  brief: string;
  manifest: unknown;
  defaultContent: Record<string, unknown>;
  categoryLabel: string;
  timeoutMs?: number;
}): Promise<Record<string, string>> {
  const { brief, manifest, defaultContent, categoryLabel } = input;
  if (!process.env.MISTRAL_API_KEY) return {};

  const editable: EditableField[] =
    ((manifest as Record<string, unknown> | null)?.fields as
      | Record<string, unknown>
      | undefined)?.editable as EditableField[] | undefined ?? [];

  const fields = editable
    .filter(
      (f) =>
        f &&
        typeof f.path === "string" &&
        !f.path.includes("[]") &&
        (f.type === "text" || f.type === "textarea"),
    )
    .map((f) => {
      const current = getPath(defaultContent, f.path as string);
      if (typeof current !== "string" || !current) return null;
      return { path: f.path as string, maxLen: f.maxLen ?? 120, current };
    })
    .filter(Boolean) as { path: string; maxLen: number; current: string }[];

  if (fields.length === 0) return {};

  const system = `Tu personnalises un site vitrine PRO déjà conçu, à partir d'un brief client (métier : ${categoryLabel}). Tu RÉÉCRIS uniquement les champs texte fournis pour qu'ils collent au client, dans la MÊME LANGUE que le brief, ton professionnel, élégant et concret — jamais "IA générique" ni grandiloquent. Respecte STRICTEMENT maxLen (en caractères). Garde le rôle de chaque champ (un titre reste court, un sous-titre reste une phrase). N'invente pas d'email ni de chiffres faux. Renvoie un JSON STRICT { "<path>": "<texte>", ... } en n'utilisant QUE les chemins fournis ; omets ceux que tu ne peux pas personnaliser fidèlement.`;

  const user = `Brief client :
"""${brief.slice(0, 1200)}"""

Champs à réécrire (path · maxLen · texte actuel) :
${fields.map((f) => `- ${f.path} · ${f.maxLen} · ${JSON.stringify(f.current)}`).join("\n")}

Renvoie le JSON.`;

  let raw: string;
  try {
    raw = await Promise.race([
      chat(
        [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        { json: true, maxTokens: 1400 },
      ),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), input.timeoutMs ?? 12000),
      ),
    ]);
  } catch {
    return {};
  }

  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(raw);
  } catch {
    return {};
  }

  const limits = new Map(fields.map((f) => [f.path, f.maxLen]));
  const out: Record<string, string> = {};
  for (const [path, value] of Object.entries(obj)) {
    const max = limits.get(path);
    if (max == null || typeof value !== "string") continue;
    const v = value.trim().slice(0, max);
    if (v) out[path] = v;
  }
  return out;
}
