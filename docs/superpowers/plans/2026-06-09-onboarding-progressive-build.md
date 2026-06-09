# Onboarding « le site se construit en parlant » — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le site se construit section par section pendant le chat (chaque réponse génère une section qui apparaît en direct dans une preview), reveal + confettis dans le tunnel avant le paywall, et dictée vocale (Whisper).

**Architecture:** Couche d'optimisation au-dessus du pipeline robuste existant (job `generate_site` reste le filet). Génération par fragment (`generateSection`) déclenchée en `after()` par les tours de chat ; état des sections dans `intake.__sections` ; preview live par poll + iframe assemblée ; fallback complet garanti.

**Tech Stack:** Next 16.2.6 (App Router, `after()`), Supabase (admin), Mistral (génération), Whisper OpenAI (voix, `fetch` brut), Vitest (`lib/*.test.ts`), DA Cloud (sky/violet, Tailwind, lucide).

**Référence spec :** `docs/superpowers/specs/2026-06-09-onboarding-progressive-build-design.md`

**Cohérence imposée :** DA dashboard (§2.1 spec) + Activation marketing (§2.2 spec). Chaque composant UI réutilise `Spinner`/`Button`/`Card`, tons sky/violet/emerald/amber, `var(--font-display)`, copie brand-voice Akyra (chaleureuse, « votre site »).

---

## Conventions

- Repo imbriqué : travailler dans `sitegene/` (cwd). Chemins ci-dessous relatifs à `sitegene/`.
- Tests : `npx vitest run <fichier>` ; gate finale `npx tsc --noEmit` + `npm run build`.
- Ne jamais exposer les secrets (`.env.local`). Pas d'appel Mistral réel dans les tests unitaires (tester la logique pure : assemblage, plan, diff de slots).
- Lire `node_modules/next/dist/docs/` si un doute sur une API Next 16 (cf. `AGENTS.md`).

---

## Task 1 : Génération par section + assemblage progressif (`lib/design-system-gen.ts`)

**Files:**
- Modify: `lib/design-system-gen.ts`
- Test: `lib/design-system-gen.test.ts` (créer)

- [ ] **Step 1 — Test d'abord (logique pure d'assemblage)**

Créer `lib/design-system-gen.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { assembleProgressiveHtml } from "./design-system-gen";

const HEADER = `<!DOCTYPE html><html><head><style>.x{}</style></head><body class="bg-white"><header>NAV+HERO</header></body></html>`;

describe("assembleProgressiveHtml", () => {
  it("insère les sections dans l'ordre avant </body>", () => {
    const html = assembleProgressiveHtml(HEADER, [
      { key: "services", html: `<section data-sg-path="services.title">Services</section>` },
      { key: "contact", html: `<section data-sg-path="contact.title">Contact</section>` },
    ]);
    const iServices = html.indexOf("Services");
    const iContact = html.indexOf("Contact");
    const iBodyEnd = html.indexOf("</body>");
    expect(iServices).toBeGreaterThan(0);
    expect(iServices).toBeLessThan(iContact);
    expect(iContact).toBeLessThan(iBodyEnd);
    expect(html).toContain("<header>NAV+HERO</header>");
  });

  it("sans </body> : concatène à la fin", () => {
    const html = assembleProgressiveHtml("<header>H</header>", [{ key: "a", html: "<section>A</section>" }]);
    expect(html).toContain("<header>H</header>");
    expect(html).toContain("<section>A</section>");
  });

  it("liste vide : renvoie le header inchangé", () => {
    expect(assembleProgressiveHtml(HEADER, [])).toBe(HEADER);
  });
});
```

- [ ] **Step 2 — Vérifier l'échec**

Run: `npx vitest run lib/design-system-gen.test.ts`
Expected: FAIL (`assembleProgressiveHtml` non exporté).

- [ ] **Step 3 — Implémenter `assembleProgressiveHtml` (pur, sans I/O)**

Dans `lib/design-system-gen.ts`, ajouter une fonction pure qui insère les fragments (réutilisable par `assembleProgressive` et testable sans réseau) :

```ts
/** Insère des fragments de section (dans l'ordre) avant </body> du headerDoc. Pur. */
export function assembleProgressiveHtml(
  headerDoc: string,
  sections: { key: string; html: string }[],
): string {
  if (sections.length === 0) return headerDoc;
  const body = sections.map((s) => s.html).join("\n");
  if (/<\/body>/i.test(headerDoc)) return headerDoc.replace(/<\/body>/i, `${body}\n</body>`);
  return headerDoc + body;
}
```

- [ ] **Step 4 — Ajouter `SYSTEM_SECTION` + `generateSection`**

Ajouter le prompt et la fonction (modelés sur `generateBody`/`SYSTEM_BODY`) :

```ts
const SYSTEM_SECTION = `Tu es un développeur front senior. On te donne le DESIGN SYSTEM d'un template, les FAITS du client, le HEADER DÉJÀ CONSTRUIT, et le CONTEXTE des sections déjà produites. Produis UNIQUEMENT UN bloc <section>…</section> (ou <footer> si la section demandée est "contact") pour la section demandée, en réutilisant EXACTEMENT les classes Tailwind, couleurs, polices et conventions du HEADER. NE répète NI <head>, NI <html>/<body>, NI le header, NI les autres sections.

${RULES_COMMON}

- Alterne le fond par rapport aux sections déjà produites (CONTEXTE fourni) pour garder le rythme vertical du design system.
- Si la section "contact" : inclus le bloc contact ET le <footer> final.
- Réponds UNIQUEMENT avec le markup HTML de CETTE section (commence par <section ou <footer), sans <!DOCTYPE>, sans <head>, sans backticks ni commentaire.`;

export type SectionResult = { ok: true; sectionHtml: string } | { ok: false; reason: string };

export async function generateSection(input: {
  origin: string;
  templateId: string;
  sectionKey: string;
  sectionTitle: string;
  sectionBrief: string;
  facts: GenFacts;
  headerDoc: string;
  priorSectionsContext?: string;
  imagePlan?: ImagePlanLite;
  photoUrls?: string[];
  timeoutMs?: number;
}): Promise<SectionResult> {
  const { origin, templateId, sectionKey, sectionTitle, sectionBrief, facts, headerDoc } = input;
  const designSystem = await loadDesignSystem(origin, templateId);
  if (!designSystem) return { ok: false, reason: "design-system-introuvable" };

  const user = `${buildUserPrompt(designSystem, facts, input.imagePlan, input.photoUrls)}

HEADER DÉJÀ CONSTRUIT (référence de classes/couleurs/polices ; ne le répète pas) :
"""
${headerDoc}
"""

SECTIONS DÉJÀ PRODUITES (pour alterner les fonds / garder le rythme) :
"""
${input.priorSectionsContext || "(aucune — c'est la 1re section du corps)"}
"""

SECTION À PRODUIRE MAINTENANT : « ${sectionTitle} » (clé: ${sectionKey})
Matière de cette section :
"""
${sectionBrief}
"""

Produis UNIQUEMENT le markup de cette section (et le footer si clé "contact").`;

  const gen = await callMistralGen(SYSTEM_SECTION, user, input.timeoutMs ?? 60_000);
  if (!gen.ok) return { ok: false, reason: gen.reason };
  let sectionHtml = stripFences(gen.text)
    .replace(/^[\s\S]*?(?=<section|<footer)/i, "") // retire tout préambule avant le 1er <section/<footer
    .replace(/<\/body>[\s\S]*$/i, "")
    .trim();
  if (!sectionHtml) return { ok: false, reason: "section-vide" };
  if (input.photoUrls?.length) sectionHtml = assignPhotosInOrder(sectionHtml, input.photoUrls);
  return { ok: true, sectionHtml };
}
```

- [ ] **Step 5 — `assembleProgressive` (I/O : photos + motion + content)**

Refondre `assembleSite` pour déléguer à une version multi-fragments :

```ts
/** Assemble header + N fragments de section → page complète + content éditable. */
export async function assembleProgressive(input: {
  origin: string;
  templateId: string;
  headerDoc: string;
  sections: { key: string; html: string }[];
  photoUrls?: string[];
}): Promise<{ html: string; content: Record<string, unknown> }> {
  const { origin, templateId, headerDoc, sections, photoUrls } = input;
  let html = assembleProgressiveHtml(headerDoc, sections);
  if (photoUrls?.length) html = assignPhotosInOrder(html, photoUrls);
  const motion = await loadMotionKit(origin);
  html = injectMotion(html, motion);
  const { content } = extractContentFromShell(html, templateId);
  return { html, content };
}
```

Puis réécrire `assembleSite` pour appeler `assembleProgressive` avec un seul fragment `{ key:"body", html: bodyHtml }` (garde l'API existante intacte pour `runSiteGenerationJob`).

- [ ] **Step 6 — Vérifier**

Run: `npx vitest run lib/design-system-gen.test.ts`
Expected: PASS (3/3).
Run: `npx tsc --noEmit`
Expected: 0 erreur.

- [ ] **Step 7 — Commit**

```bash
git add lib/design-system-gen.ts lib/design-system-gen.test.ts
git commit -m "feat(gen): generateSection + assembleProgressive (génération par fragment)"
```

---

## Task 2 : Plan de sections + orchestration (`lib/onboarding-sections.ts`)

**Files:**
- Create: `lib/onboarding-sections.ts`
- Test: `lib/onboarding-sections.test.ts`

- [ ] **Step 1 — Test du plan de sections (pur)**

```ts
import { describe, it, expect } from "vitest";
import { sectionPlanForIntake, SECTION_DEFS } from "./onboarding-sections";

describe("sectionPlanForIntake", () => {
  it("plan standard ordonné", () => {
    const plan = sectionPlanForIntake({ services: ["a"], priceRange: "50€" } as any);
    expect(plan.map((s) => s.key)).toEqual(["services", "pricing", "about", "contact"]);
  });
  it("remplace pricing par approach si wantsPricingPage=false", () => {
    const plan = sectionPlanForIntake({ wantsPricingPage: false } as any);
    const keys = plan.map((s) => s.key);
    expect(keys).toContain("approach");
    expect(keys).not.toContain("pricing");
  });
  it("chaque def a un title et un slot", () => {
    for (const d of SECTION_DEFS) {
      expect(d.title.length).toBeGreaterThan(0);
      expect(d.slot.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2 — Vérifier l'échec** : `npx vitest run lib/onboarding-sections.test.ts` → FAIL (module absent).

- [ ] **Step 3 — Implémenter le plan + briefs**

`lib/onboarding-sections.ts` :

```ts
import { createAdminClient } from "@/lib/supabase/admin";
import type { Intake } from "@/lib/onboarding-config";
import { isTemplateId, type TemplateId } from "@/lib/templates";
import { imagePlanFor } from "@/lib/image-plan";
import { generateSection } from "@/lib/design-system-gen";
import { buildGenFacts, photoUrlsForIntake } from "@/lib/onboarding";

type Admin = ReturnType<typeof createAdminClient>;

export type SectionStatus = "pending" | "streaming" | "done" | "error";
export type SectionState = { html?: string; status: SectionStatus; title: string };
export type SectionDef = { key: string; slot: string; title: string; brief: (i: Intake) => string };

/** Définition ORDONNÉE des sections du corps (l'ordre = l'ordre de la page). */
export const SECTION_DEFS: SectionDef[] = [
  { key: "services", slot: "services", title: "Prestations / services",
    brief: (i) => (i.services?.length ? i.services.join(" · ") : i.eventTypes?.join(" · ") || "") },
  { key: "pricing", slot: "priceRange", title: "Tarifs",
    brief: (i) => i.priceRange || "" },
  { key: "about", slot: "area", title: "À propos / zone",
    brief: (i) => [i.about, i.area || i.city, i.experienceYears, i.certifications].filter(Boolean).join(" — ") },
  { key: "contact", slot: "contact", title: "Contact",
    brief: (i) => [i.contactEmail, i.contactPhone, i.instagram].filter(Boolean).join(" · ") },
];

/** Section de repli quand le client ne veut PAS de page tarifs. */
const APPROACH_DEF: SectionDef = {
  key: "approach", slot: "priceRange", title: "Approche / engagements",
  brief: (i) => i.about || i.brief || "Approche et engagements du professionnel",
};

/** Plan de sections applicable à cet intake (pricing → approach si refus tarifs). */
export function sectionPlanForIntake(intake: Intake): SectionDef[] {
  return SECTION_DEFS.map((d) =>
    d.key === "pricing" && intake.wantsPricingPage === false ? APPROACH_DEF : d,
  );
}
```

- [ ] **Step 4 — Vérifier** : `npx vitest run lib/onboarding-sections.test.ts` → PASS.

- [ ] **Step 5 — Orchestration (I/O Supabase) : trigger + build-state**

Ajouter (mêmes lectures/écritures que `generateOnboardingHeader` dans `lib/onboarding.ts`) :

```ts
type IntakeX = Intake & { categoryId?: string; __headerHtml?: string; __sections?: Record<string, SectionState>; __sectionPlan?: string[] };

async function loadIntake(admin: Admin, siteId: string): Promise<{ intake: IntakeX; templateId: TemplateId | null } | null> {
  const { data: ob } = await admin.from("site_onboarding").select("intake, chosen_template_id").eq("site_id", siteId).maybeSingle();
  if (!ob) return null;
  const intake = (ob.intake ?? {}) as IntakeX;
  const templateId = ob.chosen_template_id && isTemplateId(ob.chosen_template_id) ? ob.chosen_template_id : null;
  return { intake, templateId };
}

/** Contexte compact des sections déjà produites (ouvertures de balise) pour alterner les fonds. */
function priorContext(intake: IntakeX, plan: string[], upTo: string): string {
  const out: string[] = [];
  for (const key of plan) {
    if (key === upTo) break;
    const html = intake.__sections?.[key]?.html;
    if (html) out.push(html.slice(0, 200));
  }
  return out.join("\n");
}

/** Génère UNE section et la persiste dans intake.__sections (idempotent). */
export async function triggerSectionGeneration(origin: string, siteId: string, sectionKey: string): Promise<void> {
  const admin = createAdminClient();
  const loaded = await loadIntake(admin, siteId);
  if (!loaded?.templateId || !loaded.intake.__headerHtml) return;
  const { intake, templateId } = loaded;
  const plan = sectionPlanForIntake(intake);
  const def = plan.find((d) => d.key === sectionKey);
  if (!def) return;
  const existing = intake.__sections?.[sectionKey];
  if (existing && (existing.status === "done" || existing.status === "streaming")) return;

  // marque streaming
  await patchSections(admin, siteId, { [sectionKey]: { status: "streaming", title: def.title } });

  const res = await generateSection({
    origin, templateId, sectionKey, sectionTitle: def.title, sectionBrief: def.brief(intake),
    facts: buildGenFacts(intake), headerDoc: intake.__headerHtml!,
    priorSectionsContext: priorContext(intake, plan.map((d) => d.key), sectionKey),
    imagePlan: await imagePlanFor(origin, templateId, intake),
    photoUrls: photoUrlsForIntake(intake),
  });

  await patchSections(admin, siteId, {
    [sectionKey]: res.ok
      ? { status: "done", html: res.sectionHtml, title: def.title }
      : { status: "error", title: def.title },
  });
}

/** Merge non destructif dans intake.__sections (relit pour éviter d'écraser une écriture concurrente). */
async function patchSections(admin: Admin, siteId: string, patch: Record<string, SectionState>): Promise<void> {
  const { data: ob } = await admin.from("site_onboarding").select("intake").eq("site_id", siteId).maybeSingle();
  const intake = (ob?.intake ?? {}) as IntakeX;
  const sections = { ...(intake.__sections ?? {}), ...patch };
  await admin.from("site_onboarding").update({ intake: { ...intake, __sections: sections }, updated_at: new Date().toISOString() }).eq("site_id", siteId);
}

export type BuildState = {
  templateId: string | null;
  headerReady: boolean;
  sections: { key: string; title: string; status: SectionStatus }[];
  allDone: boolean;
};

/** État de construction pour le poll client. */
export async function buildStateForSite(siteId: string): Promise<BuildState> {
  const admin = createAdminClient();
  const loaded = await loadIntake(admin, siteId);
  if (!loaded) return { templateId: null, headerReady: false, sections: [], allDone: false };
  const { intake, templateId } = loaded;
  const plan = sectionPlanForIntake(intake);
  const sections = plan.map((d) => ({
    key: d.key, title: d.title,
    status: (intake.__sections?.[d.key]?.status ?? "pending") as SectionStatus,
  }));
  const headerReady = !!intake.__headerHtml;
  const allDone = headerReady && sections.every((s) => s.status === "done");
  return { templateId, headerReady, sections, allDone };
}
```

> Note d'implémentation : `buildGenFacts` et `photoUrlsForIntake` sont exportés par `lib/onboarding.ts`. Si un cycle d'import apparaît (onboarding ↔ onboarding-sections), déplacer ces deux helpers dans un petit module `lib/onboarding-facts.ts` et réexporter — vérifier au `tsc`.

- [ ] **Step 6 — Vérifier** : `npx vitest run lib/onboarding-sections.test.ts` + `npx tsc --noEmit` → OK.

- [ ] **Step 7 — Commit**

```bash
git add lib/onboarding-sections.ts lib/onboarding-sections.test.ts
git commit -m "feat(onboarding): plan de sections + orchestration (trigger/build-state)"
```

---

## Task 3 : Réordonner le socle + mapping slot→section (`lib/onboarding-ai.ts`)

**Files:**
- Modify: `lib/onboarding-ai.ts`
- Test: `lib/onboarding-ai.test.ts` (créer)

- [ ] **Step 1 — Test : ordre du socle + diff de slots**

```ts
import { describe, it, expect } from "vitest";
import { SOCLE_ORDER, newlyFilledSlots, slotToSection } from "./onboarding-ai";

describe("socle ordonné", () => {
  it("identité d'abord (brand, activity, tone) puis services, pricing, area, contact", () => {
    expect(SOCLE_ORDER.slice(0, 3)).toEqual(["brand", "activity", "tone"]);
    expect(SOCLE_ORDER).toContain("services");
    expect(SOCLE_ORDER.indexOf("services")).toBeLessThan(SOCLE_ORDER.indexOf("contact"));
  });
  it("newlyFilledSlots détecte la transition vide→rempli", () => {
    const before = { brand: "X" } as any;
    const after = { brand: "X", services: ["a"] } as any;
    expect(newlyFilledSlots(before, after)).toContain("services");
    expect(newlyFilledSlots(before, after)).not.toContain("brand");
  });
  it("slotToSection mappe services→services, priceRange→pricing, area→about, contact→contact", () => {
    expect(slotToSection("services")).toBe("services");
    expect(slotToSection("priceRange")).toBe("pricing");
    expect(slotToSection("area")).toBe("about");
    expect(slotToSection("contact")).toBe("contact");
    expect(slotToSection("brand")).toBeNull();
  });
});
```

- [ ] **Step 2 — Vérifier l'échec** : FAIL (exports absents).

- [ ] **Step 3 — Réordonner `SOCLE` + exporter helpers**

Dans `lib/onboarding-ai.ts` : réordonner le tableau `SOCLE` en **`brand, activity, tone, services, priceRange, area, contact`** (déplacer `tone` en 3e). Ajouter :

```ts
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
```

Durcir le SYSTEM prompt : ajouter une ligne « Pose toujours une question qui cible le **PREMIER** élément de la liste des manquants (dans l'ordre donné), sans être robotique. »

- [ ] **Step 4 — Vérifier** : `npx vitest run lib/onboarding-ai.test.ts` + `npx tsc --noEmit` → OK.

- [ ] **Step 5 — Commit**

```bash
git add lib/onboarding-ai.ts lib/onboarding-ai.test.ts
git commit -m "feat(onboarding): socle réordonné (identité d'abord) + helpers slot→section"
```

---

## Task 4 : Déclencheurs dans la route chat (`app/api/onboarding/ai/next/route.ts`)

**Files:**
- Modify: `app/api/onboarding/ai/next/route.ts`

> Lire d'abord la route existante pour récupérer la forme exacte (chargement intake, appel `nextTurn`, `saveIntake`).

- [ ] **Step 1 — Brancher le diff + `after()`**

Après l'appel à `nextTurn` et la persistance de l'intake (patch fusionné), avant de répondre :

```ts
import { after } from "next/server";
import { newlyFilledSlots, slotToSection, identityReady } from "@/lib/onboarding-ai";
import { ensureHeaderForIntake } from "@/lib/onboarding"; // wrapper de generateOnboardingHeader (sans 'another')
import { triggerSectionGeneration } from "@/lib/onboarding-sections";

// before = intake AVANT le tour ; merged = intake APRÈS (déjà calculé pour la réponse).
const justFilled = newlyFilledSlots(before, merged);
const origin = new URL(request.url).origin;

// Identité complétée → génère le header en tâche de fond (premier wow).
if (!identityReady(before) && identityReady(merged)) {
  after(() => ensureHeaderForIntake(origin, siteId).catch(() => {}));
}
// Slots de section nouvellement remplis → génère la section correspondante.
for (const slot of justFilled) {
  const sec = slotToSection(slot);
  if (sec) after(() => triggerSectionGeneration(origin, siteId, sec).catch(() => {}));
}
```

> Si le header n'est pas encore prêt quand une section se déclenche, `triggerSectionGeneration` no-op (garde sur `__headerHtml`). Filet : la validate/job génère les manquantes. Pour limiter ce cas, déclencher aussi un « rattrapage » des sections en attente quand le header vient d'être produit (voir Task 6 `ensureHeaderForIntake` → enchaîne les sections déjà répondues).

- [ ] **Step 2 — `maxDuration`** : régler `export const maxDuration = 90;` (header/section tiennent dans `after()`).

- [ ] **Step 3 — Vérifier** : `npx tsc --noEmit` + `npm run build` (route compile).

- [ ] **Step 4 — Commit**

```bash
git add app/api/onboarding/ai/next/route.ts
git commit -m "feat(onboarding): déclenche header/sections en after() au fil du chat"
```

---

## Task 5 : Endpoints build-state + live-preview

**Files:**
- Create: `app/api/onboarding/build-state/route.ts`
- Create: `app/api/onboarding/live-preview/route.ts`

- [ ] **Step 1 — build-state (GET, owner-gated)**

```ts
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { userOwnsSite } from "@/lib/onboarding";
import { buildStateForSite } from "@/lib/onboarding-sections";

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const siteId = new URL(request.url).searchParams.get("siteId") ?? "";
  if (!siteId || !(await userOwnsSite(user.id, siteId)))
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  return NextResponse.json(await buildStateForSite(siteId), { headers: { "cache-control": "no-store" } });
}
```

- [ ] **Step 2 — live-preview (GET, renvoie le HTML assemblé)**

Charger intake (`__headerHtml` + `__sections` `done` dans l'ordre du plan), `assembleProgressive`, renvoyer en `text/html`. Si pas de header → 404 (le client affiche le skeleton). Ajouter un helper `loadLivePreviewHtml(siteId)` dans `lib/onboarding-sections.ts` :

```ts
export async function loadLivePreviewHtml(origin: string, siteId: string): Promise<string | null> {
  const admin = createAdminClient();
  const loaded = await loadIntake(admin, siteId);
  if (!loaded?.intake.__headerHtml) return null;
  const { intake, templateId } = loaded;
  const plan = sectionPlanForIntake(intake);
  const sections = plan
    .filter((d) => intake.__sections?.[d.key]?.status === "done")
    .map((d) => ({ key: d.key, html: intake.__sections![d.key].html! }));
  const { assembleProgressive } = await import("@/lib/design-system-gen");
  const { html } = await assembleProgressive({ origin, templateId: templateId!, headerDoc: intake.__headerHtml!, sections, photoUrls: photoUrlsForIntake(intake) });
  return html;
}
```

Route :

```ts
import { getUser } from "@/lib/auth";
import { userOwnsSite } from "@/lib/onboarding";
import { loadLivePreviewHtml } from "@/lib/onboarding-sections";

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return new Response("Non connecté.", { status: 401 });
  const url = new URL(request.url);
  const siteId = url.searchParams.get("siteId") ?? "";
  if (!siteId || !(await userOwnsSite(user.id, siteId))) return new Response("Accès refusé.", { status: 403 });
  const html = await loadLivePreviewHtml(url.origin, siteId);
  if (!html) return new Response("Aperçu en préparation.", { status: 404 });
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex", "cache-control": "no-store" } });
}
```

- [ ] **Step 3 — Vérifier** : `npx tsc --noEmit` + `npm run build`.

- [ ] **Step 4 — Commit**

```bash
git add app/api/onboarding/build-state/route.ts app/api/onboarding/live-preview/route.ts lib/onboarding-sections.ts
git commit -m "feat(onboarding): endpoints build-state + live-preview (aperçu progressif)"
```

---

## Task 6 : `ensureHeaderForIntake`, reset au changement de style, filet job (`lib/onboarding.ts`)

**Files:**
- Modify: `lib/onboarding.ts`

- [ ] **Step 1 — `ensureHeaderForIntake` (header + rattrapage des sections déjà répondues)**

Wrapper de `generateOnboardingHeader` (sans `another`) qui, une fois le header prêt, enchaîne la génération des sections dont le slot est DÉJÀ rempli (rattrapage du cas « identité tardive ») :

```ts
import { sectionPlanForIntake, triggerSectionGeneration } from "@/lib/onboarding-sections";
import { SOCLE } from "@/lib/onboarding-ai"; // exporter SOCLE depuis onboarding-ai

export async function ensureHeaderForIntake(origin: string, siteId: string): Promise<void> {
  const res = await generateOnboardingHeader(origin, siteId);
  if (!res.ok) return;
  // Rattrape les sections dont la matière est déjà connue (questions déjà répondues).
  const admin = createAdminClient();
  const { data: ob } = await admin.from("site_onboarding").select("intake").eq("site_id", siteId).maybeSingle();
  const intake = (ob?.intake ?? {}) as Intake;
  for (const def of sectionPlanForIntake(intake)) {
    const slot = SOCLE.find((s) => s.key === def.slot);
    if (slot?.filled(intake)) await triggerSectionGeneration(origin, siteId, def.key); // séquentiel (rate-limit)
  }
}
```

> Exporter `SOCLE` depuis `lib/onboarding-ai.ts`. Attention au cycle d'import onboarding ↔ onboarding-sections : si `tsc`/runtime râle, extraire `buildGenFacts`/`photoUrlsForIntake` dans `lib/onboarding-facts.ts` (cf. Task 2 note) et importer depuis là des deux côtés.

- [ ] **Step 2 — Reset des sections au changement de style**

Dans `generateOnboardingHeader`, quand `opts.another` (nouveau template) : effacer `__sections` (le CSS change, les fragments sont caducs). Dans l'`update` de l'intake, ajouter `__sections: {}` quand le templateId change.

- [ ] **Step 3 — Filet : `runSiteGenerationJob` assemble les sections si présentes**

Dans `runSiteGenerationJob`, avant le `generateBody` complet : si `intake.__sections` couvre tout le plan en `done`, assembler via `assembleProgressive` (zéro Mistral) ; sinon générer **les sections manquantes** (`generateSection` en boucle séquentielle) puis assembler ; sinon (ni header ni sections) garder le `generateBespokeSite` complet actuel. Nettoyer `__sections`/`__sectionPlan` dans `cleanedIntake` (à côté de `__headerHtml`/`__triedTemplates`).

```ts
// pseudocode inséré dans le try, à la place du bloc generateBody actuel :
const plan = sectionPlanForIntake(intake);
const haveAll = !!headerDoc && plan.every((d) => intake.__sections?.[d.key]?.status === "done");
if (headerDoc && (haveAll || Object.keys(intake.__sections ?? {}).length > 0)) {
  // génère les manquantes
  for (const d of plan) {
    const st = intake.__sections?.[d.key]?.status;
    if (st !== "done") { await triggerSectionGeneration(origin, siteId, d.key); }
  }
  // relire l'intake (triggerSectionGeneration a persisté) puis assembler
  const { data: ob2 } = await admin.from("site_onboarding").select("intake").eq("site_id", siteId).maybeSingle();
  const ix = (ob2?.intake ?? {}) as typeof intake;
  const sections = plan.filter((d) => ix.__sections?.[d.key]?.status === "done").map((d) => ({ key: d.key, html: ix.__sections![d.key].html! }));
  result = await assembleProgressive({ origin, templateId, headerDoc, sections, photoUrls });
} else if (headerDoc) {
  const body = await generateBody({ origin, templateId, facts, headerDoc, imagePlan, photoUrls });
  if (!body.ok) throw new Error(`body:${body.reason}`);
  result = await assembleSite({ origin, templateId, headerDoc, bodyHtml: body.bodyHtml, photoUrls });
} else {
  const gen = await generateBespokeSite({ origin, templateId, facts, imagePlan, photoUrls });
  if (!gen.ok) throw new Error(`full:${gen.reason}`);
  result = { html: gen.html, content: gen.content };
}
```

- [ ] **Step 4 — Vérifier** : `npx tsc --noEmit` + `npm run build`.

- [ ] **Step 5 — Commit**

```bash
git add lib/onboarding.ts lib/onboarding-ai.ts
git commit -m "feat(onboarding): ensureHeaderForIntake + reset sections + filet job (assemble/manquantes)"
```

---

## Task 7 : validate route — assemble final + enqueue conditionnel

**Files:**
- Modify: `app/api/onboarding/validate/route.ts`

- [ ] **Step 1 — Assembler ce qui est prêt + enqueue SI manquant**

Remplacer `commitHeaderAndEnqueue` par une logique : assembler header + sections `done` → snapshot (`saveDraftSnapshot`), `sites.template_id`, `step=100`. Si toutes les sections du plan sont `done` → **ne pas** enqueuer (site déjà complet). Sinon → `enqueueSiteGeneration` + `after()` `/api/generation/run` (filet). Renvoyer `{ ok, allDone, redirect:"/dashboard?building=1" }`. Ajouter un helper `commitProgressive(siteId)` dans `lib/onboarding-sections.ts` qui fait l'assemblage + snapshot et renvoie `{ ok, allDone, templateId }`.

> Le client n'utilise le `redirect` que pour le bouton « tableau de bord » du reveal ; la bascule reveal est pilotée par le poll `allDone`.

- [ ] **Step 2 — Vérifier** : `npx tsc --noEmit` + `npm run build`.

- [ ] **Step 3 — Commit**

```bash
git add app/api/onboarding/validate/route.ts lib/onboarding-sections.ts
git commit -m "feat(onboarding): validate assemble le site progressif + enqueue filet conditionnel"
```

---

## Task 8 : Transcription vocale Whisper (`lib/voice/transcribe.ts` + route)

**Files:**
- Create: `lib/voice/transcribe.ts`
- Create: `app/api/onboarding/transcribe/route.ts`
- Test: `lib/voice/transcribe.test.ts`

- [ ] **Step 1 — Test : garde sans clé**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { transcribeAudio } from "./transcribe";

describe("transcribeAudio", () => {
  beforeEach(() => { delete process.env.OPENAI_API_KEY; });
  it("sans OPENAI_API_KEY → { ok:false, reason:'no-key' }", async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" });
    const res = await transcribeAudio(blob, "fr");
    expect(res).toEqual({ ok: false, reason: "no-key" });
  });
});
```

- [ ] **Step 2 — Vérifier l'échec** : FAIL (module absent).

- [ ] **Step 3 — Implémenter (fetch brut OpenAI Whisper, swappable)**

```ts
/** Transcription audio → texte (Whisper OpenAI). Swappable Voxtral en changeant l'URL/clé. */
export type TranscribeResult = { ok: true; text: string } | { ok: false; reason: string };

export async function transcribeAudio(audio: Blob, lang = "fr"): Promise<TranscribeResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: false, reason: "no-key" };
  try {
    const fd = new FormData();
    fd.append("file", audio, "audio.webm");
    fd.append("model", "whisper-1");
    fd.append("language", lang);
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: fd,
    });
    if (!res.ok) return { ok: false, reason: `http-${res.status}` };
    const j = await res.json();
    const text = typeof j.text === "string" ? j.text.trim() : "";
    return text ? { ok: true, text } : { ok: false, reason: "vide" };
  } catch {
    return { ok: false, reason: "fetch-fail" };
  }
}
```

- [ ] **Step 4 — Route (multipart, owner-gated, ≤10 Mo)**

```ts
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { userOwnsSite } from "@/lib/onboarding";
import { transcribeAudio } from "@/lib/voice/transcribe";

export const maxDuration = 30;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const siteId = String(form?.get("siteId") ?? "");
  const audio = form?.get("audio");
  if (!siteId || !(await userOwnsSite(user.id, siteId)))
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  if (!(audio instanceof Blob) || audio.size === 0 || audio.size > 10_000_000)
    return NextResponse.json({ error: "Audio invalide." }, { status: 400 });
  const res = await transcribeAudio(audio, "fr");
  if (!res.ok) return NextResponse.json({ error: `Transcription indisponible (${res.reason}).` }, { status: 502 });
  return NextResponse.json({ text: res.text });
}
```

- [ ] **Step 5 — Vérifier** : `npx vitest run lib/voice/transcribe.test.ts` + `npx tsc --noEmit`.

- [ ] **Step 6 — Commit**

```bash
git add lib/voice/transcribe.ts lib/voice/transcribe.test.ts app/api/onboarding/transcribe/route.ts
git commit -m "feat(onboarding): transcription vocale Whisper (serveur, dégradation gracieuse)"
```

---

## Task 9 : `SectionChecklist` + `LiveBuildPanel` (composants preview live)

**Files:**
- Create: `components/onboarding/SectionChecklist.tsx`
- Create: `components/onboarding/LiveBuildPanel.tsx`

- [ ] **Step 1 — `SectionChecklist`** : props `{ headerReady: boolean; sections: {key,title,status}[] }`. Rendu DA Cloud : liste verticale, badge par statut — `done` → `Check` emerald, `streaming` → `Loader2` violet animé, `pending` → point gray, `error` → `RotateCw` amber. Ligne « Style & en-tête » pour le header (emerald si `headerReady`, sinon violet animé « en cours »).

- [ ] **Step 2 — `LiveBuildPanel`** : `"use client"`, props `{ siteId: string; onAllDone: () => void }`.
  - State : `build: BuildState | null`, `nonce: number`.
  - `useEffect` : poll `GET /api/onboarding/build-state?siteId=` toutes les **2500 ms** (`cache:"no-store"`). À chaque réponse : si le nombre de sections `done` a augmenté **ou** `headerReady` vient de passer true → `setNonce(n=>n+1)`. Si `allDone` → `onAllDone()` (et arrêter le poll).
  - Rendu : carte `rounded-2xl ring-1 ring-slate-200` ; en haut `SectionChecklist` ; en dessous l'`iframe` `src={/api/onboarding/live-preview?siteId=&n=${nonce}}` (montée seulement si `headerReady`). Avant header → **skeleton animé** (réutiliser le skeleton de `AiOnboardingClient` existant : nav + hero pulse + « Création de votre style… »).
  - Bandeau d'apparition : à chaque bump de nonce, animer (classe `animate-[fadeIn]` ou transition d'opacité) pour que la nouvelle section « entre ».
  - **Dépôt photos** : bouton discret « Ajouter mes photos » (réutilise `compressImages` + `POST /api/onboarding/photos`) ; après upload, bump nonce (les photos se substituent au prochain rendu).
  - Mobile : si `window` étroit, le panneau est masqué au profit d'un onglet (géré par le parent en Task 11) — le composant reste autonome.

- [ ] **Step 3 — Vérifier** : `npx tsc --noEmit` + `npm run build`.

- [ ] **Step 4 — Commit**

```bash
git add components/onboarding/SectionChecklist.tsx components/onboarding/LiveBuildPanel.tsx
git commit -m "feat(onboarding): LiveBuildPanel + SectionChecklist (preview qui se remplit)"
```

---

## Task 10 : `MicButton` + `RevealCelebration`

**Files:**
- Create: `components/onboarding/MicButton.tsx`
- Create: `components/onboarding/RevealCelebration.tsx`

- [ ] **Step 1 — `MicButton`** : `"use client"`, props `{ siteId: string; onTranscript: (text: string) => void; disabled?: boolean }`.
  - `MediaRecorder` sur `navigator.mediaDevices.getUserMedia({audio:true})` (mimeType `audio/webm`).
  - États : `idle` (icône `Mic`), `recording` (icône `Square` + pastille rouge pulsante, clic = stop), `transcribing` (`Loader2`). Au stop → POST multipart `{siteId, audio}` à `/api/onboarding/transcribe` → `onTranscript(text)`.
  - Si `getUserMedia` indisponible/refusé OU 1er appel renvoie 502 `no-key` → masquer le bouton (état `unsupported`). Toujours non bloquant (le clavier reste).
  - DA : bouton rond cohérent avec le bouton d'envoi (`grid place-items-center rounded-xl`), tons sky/rose.

- [ ] **Step 2 — `RevealCelebration`** : `"use client"`, props `{ siteId: string; firstName: string | null; dashboardHref: string; publishSlot: React.ReactNode }`.
  - Confettis légers au montage (burst CSS maison OU `canvas-confetti` si dispo ; gracieux si absent — try/catch dynamique).
  - Titre `var(--font-display)` « Votre site est prêt 🎉 » (+ prénom si connu), sous-titre brand-voice. Aperçu **plein écran** : `iframe` `/api/preview?siteId=` (le snapshot final assemblé). CTA primaire = `publishSlot` (le parent passe `<PaywallModal …/>`), CTA secondaire `Button href={dashboardHref} variant="subtle"`.
  - DA : hero inspiré du `HeroBanner` sombre du dashboard pour la continuité.

- [ ] **Step 3 — Vérifier** : `npx tsc --noEmit` + `npm run build`.

- [ ] **Step 4 — Commit**

```bash
git add components/onboarding/MicButton.tsx components/onboarding/RevealCelebration.tsx
git commit -m "feat(onboarding): MicButton (voix) + RevealCelebration (reveal + confettis)"
```

---

## Task 11 : Recâbler `AiOnboardingClient` (split-screen, phases, micro, reveal)

**Files:**
- Modify: `app/onboarding/AiOnboardingClient.tsx`

- [ ] **Step 1 — Phases**

`type Phase = "loading" | "chat" | "reveal" | "error"`. Supprimer `plan` et `header`. Supprimer `showStyle`/`validateStyle` basés sur le header isolé ; la validation se fait quand le chat conclut (`done`) ou via le reveal.

- [ ] **Step 2 — Boucle de chat**

Dans `runTurn`, quand `data.done` : ne plus aller en `plan`. Au lieu de ça : appeler `POST /api/onboarding/validate` (assemble ce qui est prêt + enqueue filet), garder la phase `chat` (le `LiveBuildPanel` finit de remplir) — la bascule `reveal` est déclenchée par `onAllDone` du panel. Si l'utilisateur conclut alors que tout n'est pas `done`, le panel affiche l'attente narrée puis appelle `onAllDone`.

- [ ] **Step 3 — Layout split-screen (phase `chat`)**

```
<div className="grid lg:grid-cols-2 ...">   // 1 col mobile, 2 col desktop
  <ChatColumn ... />                         // chat existant + MicButton dans le composer
  <LiveBuildPanel siteId={siteId} onAllDone={() => setPhase("reveal")} />
</div>
```
- Mobile : remplacer le grid par un toggle « Discussion / Aperçu » (state `mobileTab`), afficher l'un ou l'autre.
- Composer : ajouter `<MicButton siteId={siteId} onTranscript={(t) => setInput((v) => (v ? v + " " : "") + t)} />` à gauche du bouton d'envoi.

- [ ] **Step 4 — Phase `reveal`**

```
<RevealCelebration
  siteId={siteId}
  firstName={firstNameFromIntake}
  dashboardHref="/dashboard?building=1"
  publishSlot={<PaywallModal siteId={siteId} firstName={firstNameFromIntake} trigger={<button className="...">Publier mon site</button>} />}
/>
```
(Importer `PaywallModal` depuis `@/components/dashboard/PaywallModal`.)

- [ ] **Step 5 — DA & copie** : conserver `from-sky-50 to-white`, header Akyra existant, jauge `filledCount/SOCLE_TOTAL`. Copie brand-voice. Vérifier qu'aucune classe ne casse la cohérence dashboard.

- [ ] **Step 6 — Vérifier** : `npx tsc --noEmit` + `npm run build` ; lancer `npm run dev` et dérouler le tunnel manuellement (header < 20 s, pop-in des sections, reveal + confettis, paywall).

- [ ] **Step 7 — Commit**

```bash
git add app/onboarding/AiOnboardingClient.tsx
git commit -m "feat(onboarding): split-screen build live + phase reveal + micro (refonte tunnel)"
```

---

## Vérification finale (après les 11 tâches)

1. `npx vitest run` → tous verts (design-system-gen, onboarding-sections, onboarding-ai, transcribe).
2. `npx tsc --noEmit` + `npm run build` → 0 erreur.
3. Parcours manuel `npm run dev` :
   - Q1 identité → header < 20 s dans le panneau droit.
   - Q2-Q5 → chaque section pop-in ; checklist ✓/◌/·.
   - Dépôt photos → remplacent les placeholders sans régénérer.
   - Fin du chat → reveal plein écran + confettis **avant** paywall.
   - Micro → transcription FR remplit le champ (avec `OPENAI_API_KEY`) ; sans clé → micro absent, clavier OK.
   - Couper Mistral en cours → sections `error`, le job/cron complète, site livré.
4. Cohérence DA dashboard (sky/violet, rounded-xl, font-display, composants partagés) + Activation (header tôt, co-construction visible, reveal avant paywall).
5. Revue finale de code (subagent reviewer) sur l'ensemble du diff de branche.
