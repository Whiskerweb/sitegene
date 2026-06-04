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

export type ComponentProposal =
  | {
      action: "component";
      position: "replace" | "before" | "after" | "inside";
      config: Record<string, unknown>;
      explanation: string;
    }
  | { action: "unsupported"; reason: string };

/**
 * Intégration d'un COMPOSANT premium (effet acheté) dans une section du site.
 * Le « guide d'intégration » (aiGuide) écrit avec l'effet est la solution
 * complète côté IA : où ancrer, quelle position, comment remplir la config —
 * il est injecté dans le prompt et n'est JAMAIS exposé au client. L'IA ne
 * produit aucun code : uniquement position + config typée (validée ensuite
 * par sanitizeEffectConfig côté serveur).
 */
export async function proposeComponentIntegration(input: {
  request: string;
  target: DesignTarget;
  effect: {
    id: string;
    name: string;
    description: string;
    aiGuide: string;
    defaultPosition?: string;
    configSchema?: unknown[];
  };
  currentCss: string;
  sitePhotoUrls: string[];
  siteTextSnippets: string[];
}): Promise<ComponentProposal> {
  const { request, target, effect, currentCss, sitePhotoUrls, siteTextSnippets } = input;

  const system = `Tu intègres un COMPOSANT premium dans un site vitrine existant (photographe/artisan). Tu ne produis JAMAIS de code : uniquement une position d'insertion et une configuration typée. Le rendu et le responsive sont déjà gérés par le composant.

COMPOSANT : ${effect.name} — ${effect.description}

GUIDE D'INTÉGRATION (solution à respecter scrupuleusement) :
${effect.aiGuide}

RÈGLES :
- "position" ∈ {"replace","before","after","inside"} : replace = à la place du CONTENU de la section ciblée ; before/after = juste avant/après la section ; inside = au début de la section. Position recommandée par défaut : ${effect.defaultPosition ?? "replace"}.
- "config" : remplis STRICTEMENT les clés du SCHÉMA ci-dessous (respecte les types ; textes en FRANÇAIS naturels et spécifiques au site — jamais de lorem ipsum ni d'anglais ; couleurs en hexadécimal accordées à la DA du site ; clés de type url choisies parmi les photos fournies). AUCUNE autre clé.
SCHÉMA : ${JSON.stringify(effect.configSchema ?? [])}
- Si la demande du client est incompatible avec ce composant → {"action":"unsupported","reason":"<1 phrase FR>"}.
- Réponse en JSON STRICT, rien d'autre : {"action":"component","position":"...","config":{...},"explanation":"<1 phrase FR>"} OU {"action":"unsupported","reason":"<1 phrase FR>"}.`;

  const user = `Section ciblée par le client : ${target?.label || "(non précisée)"}${
    target?.cssSelector ? ` — sélecteur : ${target.cssSelector}` : ""
  }.

Demande du client : "${request}"

CSS personnalisé actuel du site (indices de couleurs/DA, peut être vide) :
${(currentCss || "/* (vide) */").slice(0, 1500)}

Photos du site utilisables (clés de type url) :
${sitePhotoUrls.length ? sitePhotoUrls.slice(0, 12).map((u) => `- ${u}`).join("\n") : "(aucune — laisser les clés url vides)"}

Textes réels du site (à réutiliser/adapter pour les clés texte) :
${siteTextSnippets.length ? siteTextSnippets.slice(0, 36).map((t) => `- ${t}`).join("\n") : "(aucun extrait)"}

Renvoie le JSON.`;

  const raw = await chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { json: true, maxTokens: 1200 },
  );

  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(raw);
  } catch {
    return { action: "unsupported", reason: "Réponse de l'IA illisible — réessayez." };
  }
  const POSITIONS = ["replace", "before", "after", "inside"] as const;
  const position = POSITIONS.includes(obj.position as (typeof POSITIONS)[number])
    ? (obj.position as (typeof POSITIONS)[number])
    : ((effect.defaultPosition as (typeof POSITIONS)[number] | undefined) ?? "replace");
  if (obj.action === "component" && obj.config && typeof obj.config === "object") {
    return {
      action: "component",
      position,
      config: obj.config as Record<string, unknown>,
      explanation:
        typeof obj.explanation === "string" ? obj.explanation : "Composant intégré.",
    };
  }
  return {
    action: "unsupported",
    reason:
      typeof obj.reason === "string" ? obj.reason : "Demande non réalisable automatiquement.",
  };
}

type EditableField = { path?: string; type?: string; maxLen?: number };

type TextField = { path: string; maxLen: number; current: string };

/**
 * Champs TEXTE concrets d'un contenu, depuis manifest.fields.editable : étend
 * les listes `[]` selon le contenu réel et préfixe par chaque base de page
 * (format multi-pages { pages: [{ content }] } ou racine). Sans cette
 * expansion, getPath renvoie undefined et AUCUN champ n'est réécrit.
 */
function collectTextFields(
  manifest: unknown,
  content: Record<string, unknown>,
): TextField[] {
  const editable: EditableField[] =
    ((manifest as Record<string, unknown> | null)?.fields as
      | Record<string, unknown>
      | undefined)?.editable as EditableField[] | undefined ?? [];

  const pages = (content as { pages?: unknown[] }).pages;
  const bases =
    Array.isArray(pages) && pages.length > 0
      ? pages.map((_, i) => `pages[${i}].content`)
      : [""];

  const join = (base: string, p: string) => (base ? `${base}.${p}` : p);

  // Étend un chemin manifest ("services[].name") en chemins concrets selon le
  // nombre réel d'éléments du tableau, sous une base donnée.
  function expandPath(base: string, path: string): string[] {
    const m = path.match(/^(.*?)\[\]\.(.+)$/);
    if (!m) return [join(base, path)];
    const [, arrPath, rest] = m;
    const arr = getPath(content, join(base, arrPath));
    if (!Array.isArray(arr)) return [];
    return arr.map((_, i) => join(base, `${arrPath}[${i}].${rest}`));
  }

  const textFields = editable.filter(
    (f) =>
      f &&
      typeof f.path === "string" &&
      (f.type === "text" || f.type === "textarea"),
  );

  return textFields
    .flatMap((f) =>
      bases.flatMap((base) =>
        expandPath(base, f.path as string).map((p) => ({
          path: p,
          maxLen: f.maxLen ?? 120,
        })),
      ),
    )
    .map(({ path, maxLen }) => {
      const current = getPath(content, path);
      if (typeof current !== "string" || !current) return null;
      return { path, maxLen, current };
    })
    .filter(Boolean) as TextField[];
}

/** Filtre la réponse JSON de l'IA : chemins connus uniquement, bornés par maxLen. */
function clampOverrides(
  obj: Record<string, unknown>,
  fields: TextField[],
): Record<string, string> {
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

  const fields = collectTextFields(manifest, defaultContent);
  if (fields.length === 0) return {};

  const system = `Tu personnalises un site vitrine PRO déjà conçu, à partir d'un brief client (métier : ${categoryLabel}). Le contenu actuel est en anglais générique : tu dois le RÉÉCRIRE entièrement dans la langue du brief (si le brief est en français, TOUT en français), adapté au client, ton professionnel, élégant et concret — jamais "IA générique" ni grandiloquent.

RÈGLES:
- Réécris TOUS les champs fournis (ne laisse RIEN dans la langue d'origine). Si un champ est générique (ex. nom de service, FAQ), adapte-le au métier et au brief plutôt que de le traduire mot à mot.
- Respecte STRICTEMENT maxLen (caractères). Garde le rôle de chaque champ : un titre reste court et percutant, un sous-titre une phrase, une description 1-2 phrases.
- N'invente pas d'email réel ni de chiffres faux (garde des ordres de grandeur plausibles pour les stats).
- Réponds en JSON STRICT { "<path>": "<texte>", ... } avec EXACTEMENT les chemins fournis. Inclus tous les chemins.`;

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
        { json: true, maxTokens: 4000 },
      ),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), input.timeoutMs ?? 30000),
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
  return clampOverrides(obj, fields);
}

/**
 * Boucle d'ajustement gratuite de l'onboarding : le client décrit ce qui ne va
 * pas sur SON site fini (« le titre ne me ressemble pas », « le ton est trop
 * pompeux »…) et l'IA corrige UNIQUEMENT les champs concernés. Renvoie un map
 * { path: valeur } restreint aux champs éditables du manifest (mêmes bornes
 * maxLen que briefToOverrides) — vide si l'IA est indisponible ou si la
 * demande ne se traduit pas en texte (mise en page, photos…).
 */
export async function feedbackToOverrides(input: {
  feedback: string;
  manifest: unknown;
  content: Record<string, unknown>;
  brief?: string;
  timeoutMs?: number;
}): Promise<Record<string, string>> {
  const { feedback, manifest, content, brief } = input;
  if (!process.env.MISTRAL_API_KEY) return {};

  const fields = collectTextFields(manifest, content);
  if (fields.length === 0) return {};

  const system = `Tu RETOUCHES les textes d'un site vitrine qui vient d'être généré pour un client. Le client signale un problème : corrige UNIQUEMENT les champs concernés par sa remarque — ne réécris RIEN d'autre.

RÈGLES:
- Réponds en JSON STRICT { "<path>": "<texte>", ... } avec SEULEMENT les chemins à corriger (sous-ensemble des chemins fournis). Aucune autre clé.
- Si la remarque ne porte pas sur du texte (photos, couleurs, mise en page) ou est incompréhensible → renvoie {} (objet vide).
- Respecte STRICTEMENT maxLen (caractères) et le rôle de chaque champ (un titre reste court, une description 1-2 phrases).
- Français professionnel et naturel, fidèle au client — jamais grandiloquent ni « IA générique ».
- N'invente ni email, ni téléphone, ni chiffres.`;

  const user = `${brief ? `Contexte client :\n"""${brief.slice(0, 600)}"""\n\n` : ""}Remarque du client sur son site :
"""${feedback.slice(0, 600)}"""

Champs du site (path · maxLen · texte actuel) :
${fields.map((f) => `- ${f.path} · ${f.maxLen} · ${JSON.stringify(f.current)}`).join("\n")}

Renvoie le JSON (uniquement les chemins à corriger).`;

  let raw: string;
  try {
    raw = await Promise.race([
      chat(
        [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        { json: true, maxTokens: 2500 },
      ),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), input.timeoutMs ?? 35000),
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
  return clampOverrides(obj, fields);
}
