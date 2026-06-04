# Tunnel client outreach + essai 3 jours — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le reveal agressif (bannière + watermark) par un tunnel lien perso → choix template → chatbot scripté → dashboard verrouillé → essai gratuit 3 jours avec débit auto de 50 € à J+3.

**Architecture:** Réutilise le moteur d'onboarding existant (`site_onboarding`, `regenerateForSite`, `finalizeChoice`), les `prospect_codes` comme tokens d'entrée, et l'infra Stripe/webhook/worker existante. Trois nouvelles surfaces : `/start/<token>` (choix template public token-gated), `/onboarding/chat` (questions scriptées filtrées), popup paywall + worker de débit J+3.

**Tech Stack:** Next.js 16 (App Router — lire `node_modules/next/dist/docs/` avant d'écrire du code), Supabase (service role côté serveur), Stripe (Checkout `mode: "setup"` + PaymentIntent off-session), Vitest (`lib/**/*.test.ts`), workers Node (`scripts/*-worker.mjs`).

**Spec :** `docs/superpowers/specs/2026-06-04-tunnel-client-trial-design.md`

**Repo :** tout se passe dans le repo imbriqué `sitegene/` (chemins relatifs à sa racine).

---

### Task 1: Migration `0017_trial_tunnel.sql`

**Files:**
- Create: `supabase/migrations/0017_trial_tunnel.sql`

- [ ] **Step 1: Écrire la migration**

```sql
-- Tunnel essai 3 jours + chatbot d'onboarding.
--
--   sites.billing_status : cycle de facturation du site
--     none → trialing (carte enregistrée, site publié) → paid (débit J+3 OK)
--                                  └→ canceled (annulation client)
--                                  └→ payment_failed (3 débits échoués → dépublié)
--   sites.trial_ends_at        : échéance du débit automatique (now()+3j au setup).
--   sites.trial_charge_attempts: tentatives de débit échouées (max 3).
--   site_onboarding.skipped_questions : clés des questions passées au chatbot
--     (on ne les repose jamais).
--   profiles.stripe_payment_method_id : carte enregistrée au Checkout setup.
--   payments.kind += 'trial_50' (ligne créée `pending` au setup, `paid` à J+3).

alter table public.sites add column if not exists billing_status text not null default 'none'
  check (billing_status in ('none','trialing','paid','canceled','payment_failed'));
alter table public.sites add column if not exists trial_ends_at timestamptz;
alter table public.sites add column if not exists trial_charge_attempts int not null default 0;

alter table public.site_onboarding add column if not exists skipped_questions text[] not null default '{}';

alter table public.profiles add column if not exists stripe_payment_method_id text;

alter table public.payments drop constraint if exists payments_kind_check;
alter table public.payments add constraint payments_kind_check
  check (kind in ('initial_50','topup','subscription','trial_50'));

-- Le worker de débit scanne les essais arrivés à échéance.
create index if not exists idx_sites_trial_due
  on public.sites (trial_ends_at)
  where billing_status = 'trialing';
```

- [ ] **Step 2: Vérifier que le statut `paid` autorisé par payments inclut bien le nouveau kind**

Run: `grep -n "kind" supabase/migrations/0001_init.sql | head -5`
Expected: la contrainte d'origine est `kind text check (kind in ('initial_50','topup'))` (ligne ~151) — la migration la remplace.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0017_trial_tunnel.sql
git commit -m "feat(db): migration 0017 — trial 3 jours + skipped_questions chatbot"
```

> NOTE : ne PAS appliquer en prod dans ce plan — Lucas applique via psql pooler (comme 0011-0014). Le signaler dans le rapport final.

---

### Task 2: Supprimer la bannière + le watermark du reveal

**Files:**
- Modify: `app/r/[token]/[[...path]]/route.ts:10-55`

- [ ] **Step 1: Remplacer `injectRevealChrome` par `injectRevealTracking`**

Remplacer entièrement la fonction `injectRevealChrome` (lignes 5-55) par :

```typescript
/**
 * Reveal pré-paiement : /r/<token>. Token-gated (secret). Rend le site (draft)
 * SANS chrome visuel — l'aperçu est montré propre, « comme un vrai site ».
 * On ne garde que le tracking d'engagement (reveal_opened, button_click).
 */
function injectRevealTracking(html: string, token: string): string {
  const chrome = `
<script>
(function(){var T=${JSON.stringify(token)};
function ping(t,l){try{var b=new Blob([JSON.stringify({token:T,type:t,label:l||null})],{type:'application/json'});if(!navigator.sendBeacon('/api/track',b))throw 0;}catch(e){fetch('/api/track',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:T,type:t,label:l||null}),keepalive:true});}}
ping('reveal_opened');
document.addEventListener('click',function(e){var el=e.target&&e.target.closest&&e.target.closest('a,button');if(!el)return;ping('button_click',(el.textContent||'').trim().slice(0,60));},true);
})();
</script>`;
  if (html.includes("</body>")) return html.replace("</body>", () => `${chrome}</body>`);
  return html + chrome;
}
```

Dans `GET` : remplacer l'appel `injectRevealChrome(html, token, embed)` par `injectRevealTracking(html, token)` et supprimer la ligne `const embed = url.searchParams.get("embed") === "1";` (le paramètre `embed` ne sert plus à rien — vérifier avec `grep -rn "embed=1" app components` que les appelants existants, ex. l'iframe du tunnel `/onboarding`, continuent de fonctionner : un paramètre de query ignoré est inoffensif, ne PAS toucher les appelants).

- [ ] **Step 2: Vérifier qu'il ne reste aucune référence au chrome**

Run: `grep -rn "sg-bar\|sg-watermark\|injectRevealChrome" app/ lib/ components/`
Expected: aucun résultat.

- [ ] **Step 3: Vérification visuelle rapide**

Run: `npm run dev` puis ouvrir un `/r/<token>` existant (en récupérer un : `node --import tsx --env-file=.env.local -e "import('./lib/supabase/admin.ts').then(async m=>{const {data}=await m.createAdminClient().from('prospect_codes').select('token').limit(1);console.log(data)})"`)
Expected: le site s'affiche sans bannière en bas ni filigrane « APERÇU · AKYRA ».

- [ ] **Step 4: Commit**

```bash
git add "app/r/[token]/[[...path]]/route.ts"
git commit -m "feat(reveal): aperçu propre — suppression bannière paiement + watermark"
```

---

### Task 3: Questions chatbot filtrées (`lib/chat-questions.ts`) — TDD

**Files:**
- Create: `lib/chat-questions.ts`
- Create: `lib/chat-questions.test.ts`
- Modify: `lib/onboarding-config.ts:43-58` (étendre `Intake`)

- [ ] **Step 1: Étendre le type `Intake`**

Dans `lib/onboarding-config.ts`, ajouter à la fin du type `Intake` (après `photoUrls?: string[];`) :

```typescript
  /** Réponses du chatbot d'affinage (étape 2 du tunnel outreach). */
  wantsPricingPage?: boolean;
  priceRange?: string;
  instagram?: string;
  city?: string;
  availability?: string;
  tone?: "chaleureux" | "premium" | "naturel";
```

- [ ] **Step 2: Écrire les tests qui échouent**

Créer `lib/chat-questions.test.ts` :

```typescript
import { describe, expect, it } from "vitest";
import { chatQuestionsFor, CHAT_QUESTIONS } from "./chat-questions";

describe("chatQuestionsFor", () => {
  it("ne repose jamais une question dont la réponse est déjà dans l'intake", () => {
    const qs = chatQuestionsFor("photographe", { contactPhone: "0612345678" }, []);
    expect(qs.map((q) => q.key)).not.toContain("contactPhone");
  });

  it("pose la question du téléphone quand il est inconnu", () => {
    const qs = chatQuestionsFor("photographe", {}, []);
    expect(qs.map((q) => q.key)).toContain("contactPhone");
  });

  it("exclut les questions passées (skipped)", () => {
    const qs = chatQuestionsFor("photographe", {}, ["wantsPricingPage"]);
    expect(qs.map((q) => q.key)).not.toContain("wantsPricingPage");
  });

  it("respecte askIf : pas de fourchette de prix sans page tarifs", () => {
    const noPricing = chatQuestionsFor("photographe", { wantsPricingPage: false }, []);
    expect(noPricing.map((q) => q.key)).not.toContain("priceRange");
    const withPricing = chatQuestionsFor("photographe", { wantsPricingPage: true }, []);
    expect(withPricing.map((q) => q.key)).toContain("priceRange");
  });

  it("considère un tableau vide comme « pas de réponse »", () => {
    const qs = chatQuestionsFor("photographe", { eventTypes: [] }, []);
    expect(qs.map((q) => q.key)).toContain("eventTypes");
  });

  it("toutes les questions ont un libellé conversationnel et un type valide", () => {
    for (const list of Object.values(CHAT_QUESTIONS)) {
      for (const q of list) {
        expect(q.label.length).toBeGreaterThan(5);
        expect(["boolean", "text", "choice", "multiselect"]).toContain(q.kind);
      }
    }
  });
});
```

- [ ] **Step 3: Vérifier l'échec**

Run: `npx vitest run lib/chat-questions.test.ts`
Expected: FAIL — `Cannot find module './chat-questions'`.

- [ ] **Step 4: Implémenter `lib/chat-questions.ts`**

```typescript
/**
 * Questions d'affinage du chatbot (étape 2 du tunnel outreach /start).
 *
 * Chaque question est scriptée (zéro LLM) et FILTRÉE : on ne demande jamais
 * une info déjà présente dans l'intake (pré-rempli par Lucas ou répondu avant),
 * ni une question déjà passée. `askIf` exprime les dépendances entre questions
 * (ex. la fourchette de prix n'a de sens que si le client veut une page tarifs).
 * Module partagé client/serveur (même pattern que onboarding-config).
 */
import {
  PHOTO_EVENT_OPTIONS,
  type Intake,
  type QuestionOption,
} from "./onboarding-config";

export type ChatQuestionKind = "boolean" | "text" | "choice" | "multiselect";

export type ChatQuestion = {
  /** Clé dans l'intake (la réponse y est écrite). */
  key: keyof Intake & string;
  kind: ChatQuestionKind;
  /** Phrase posée dans la bulle de chat (ton concierge, tutoiement exclu). */
  label: string;
  help?: string;
  placeholder?: string;
  options?: QuestionOption[];
  /** La question n'est posée que si cette condition est vraie. */
  askIf?: (intake: Intake) => boolean;
};

const PHOTOGRAPHE_CHAT: ChatQuestion[] = [
  {
    key: "eventTypes",
    kind: "multiselect",
    label: "Quelles sont vos spécialités ? On ajuste les sections du site à ce que vous faites.",
    options: PHOTO_EVENT_OPTIONS,
  },
  {
    key: "wantsPricingPage",
    kind: "boolean",
    label: "Souhaitez-vous afficher une page tarifs sur votre site ?",
    help: "Beaucoup de photographes préfèrent donner leurs prix sur demande — les deux fonctionnent.",
  },
  {
    key: "priceRange",
    kind: "text",
    label: "Quelle fourchette de prix afficher ?",
    placeholder: "Ex. À partir de 250 €",
    askIf: (intake) => intake.wantsPricingPage === true,
  },
  {
    key: "contactPhone",
    kind: "text",
    label: "Un numéro de téléphone à afficher pour vos clients ?",
    placeholder: "06 12 34 56 78",
  },
  {
    key: "instagram",
    kind: "text",
    label: "Votre compte Instagram, pour le relier au site ?",
    placeholder: "@votre.studio",
  },
  {
    key: "city",
    kind: "text",
    label: "Dans quelle ville (ou région) travaillez-vous principalement ?",
    placeholder: "Ex. Lyon et alentours",
  },
  {
    key: "about",
    kind: "text",
    label: "En une phrase : qu'est-ce qui vous rend unique ?",
    placeholder: "Lumière naturelle, émotions vraies, zéro pose forcée.",
  },
  {
    key: "tone",
    kind: "choice",
    label: "Quel ton pour les textes de votre site ?",
    options: [
      { value: "chaleureux", label: "Chaleureux" },
      { value: "premium", label: "Premium" },
      { value: "naturel", label: "Naturel" },
    ],
  },
];

const MUSICIEN_CHAT: ChatQuestion[] = [
  {
    key: "techRider",
    kind: "text",
    label: "Avez-vous une fiche technique à afficher (matériel, scène) ?",
    placeholder: "2 platines + table de mixage, retours…",
  },
  {
    key: "contactPhone",
    kind: "text",
    label: "Un numéro pour le booking ?",
    placeholder: "06 12 34 56 78",
  },
  {
    key: "instagram",
    kind: "text",
    label: "Votre compte Instagram, pour le relier au site ?",
    placeholder: "@votre.nom",
  },
  {
    key: "city",
    kind: "text",
    label: "Votre ville de base ?",
    placeholder: "Ex. Paris",
  },
];

export const CHAT_QUESTIONS: Record<string, ChatQuestion[]> = {
  photographe: PHOTOGRAPHE_CHAT,
  musicien: MUSICIEN_CHAT,
};

/** Vrai si l'intake contient déjà une réponse exploitable pour cette clé. */
function isAnswered(intake: Intake, key: keyof Intake & string): boolean {
  const v = intake[key];
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true; // boolean (même false = répondu)
}

/**
 * Questions restantes à poser : jamais celles déjà répondues (pré-remplissage
 * admin ou réponse précédente), jamais celles passées, et askIf respecté.
 */
export function chatQuestionsFor(
  categoryId: string,
  intake: Intake,
  skipped: string[],
): ChatQuestion[] {
  const list = CHAT_QUESTIONS[categoryId] ?? CHAT_QUESTIONS.photographe;
  return list.filter(
    (q) =>
      !isAnswered(intake, q.key) &&
      !skipped.includes(q.key) &&
      (q.askIf ? q.askIf(intake) : true),
  );
}
```

- [ ] **Step 5: Vérifier que les tests passent**

Run: `npx vitest run lib/chat-questions.test.ts`
Expected: 6 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/chat-questions.ts lib/chat-questions.test.ts lib/onboarding-config.ts
git commit -m "feat(chat): questions d'affinage scriptées, filtrées par intake (askIf)"
```

---

### Task 4: Persister les questions passées (`skipped_questions`)

**Files:**
- Modify: `lib/onboarding.ts:194-221` (`saveIntake`) et `lib/onboarding.ts:23-32` (`OnboardingState`)
- Modify: `app/api/onboarding/save/route.ts`

- [ ] **Step 1: Étendre `OnboardingState` et `saveIntake`**

Dans `lib/onboarding.ts` :

1. Ajouter au type `OnboardingState` (après `intake`) : `skippedQuestions: string[];`
2. Dans `toState`, étendre la signature du paramètre `row` avec `skipped_questions?: string[] | null` et ajouter au retour : `skippedQuestions: row.skipped_questions ?? [],`
3. Dans `loadOnboarding` et `saveIntake`, ajouter `skipped_questions` à TOUS les `select(...)` sur `site_onboarding` (3 occurrences : `loadOnboarding`, le premier select de `saveIntake`, le `.select(...)` après update).
4. Remplacer la signature et le corps de `saveIntake` :

```typescript
/** Fusionne un patch dans l'intake (et les questions passées) ; renvoie l'état. */
export async function saveIntake(
  siteId: string,
  patch: Partial<Intake>,
  step?: number,
  skipped?: string[],
): Promise<OnboardingState | null> {
  const admin = createAdminClient();
  const { data: ob } = await admin
    .from("site_onboarding")
    .select("site_id, intake, step, candidate_template_ids, chosen_template_id, skipped_questions")
    .eq("site_id", siteId)
    .maybeSingle();
  if (!ob) return null;

  const merged = { ...(ob.intake as Record<string, unknown>), ...patch };
  const mergedSkipped = Array.from(
    new Set([...((ob.skipped_questions as string[]) ?? []), ...(skipped ?? [])]),
  );
  const { data: updated } = await admin
    .from("site_onboarding")
    .update({
      intake: merged,
      step: step ?? ob.step ?? 0,
      skipped_questions: mergedSkipped,
      updated_at: new Date().toISOString(),
    })
    .eq("site_id", siteId)
    .select("site_id, intake, step, candidate_template_ids, chosen_template_id, skipped_questions")
    .single();

  return updated ? toState(updated, await tokenForSite(admin, siteId)) : null;
}
```

5. Dans `ensureOnboardingSite`, ajouter `skippedQuestions: [],` à l'objet retourné en fin de fonction.

- [ ] **Step 2: Étendre la route save**

Dans `app/api/onboarding/save/route.ts`, étendre le type du body et l'appel :

```typescript
  let body: { siteId?: string; patch?: Partial<Intake>; step?: number; skipped?: string[] } = {};
```

et :

```typescript
  const skipped = Array.isArray(body.skipped)
    ? body.skipped.filter((k): k is string => typeof k === "string").slice(0, 50)
    : undefined;
  const state = await saveIntake(siteId, body.patch ?? {}, body.step, skipped);
```

- [ ] **Step 3: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: 0 erreur (mêmes éventuelles erreurs préexistantes uniquement — vérifier avec `git stash && npx tsc --noEmit; git stash pop` en cas de doute).

- [ ] **Step 4: Commit**

```bash
git add lib/onboarding.ts app/api/onboarding/save/route.ts
git commit -m "feat(onboarding): persiste les questions passées (skipped_questions)"
```

---

### Task 5: Entrée `/start/<token>` — seed intake + choix de template

**Files:**
- Create: `lib/start-tunnel.ts`
- Create: `app/start/[token]/page.tsx`
- Create: `app/start/[token]/StartClient.tsx`
- Create: `app/api/start/preview/route.ts`
- Create: `app/api/start/claim/route.ts`

- [ ] **Step 1: Créer `lib/start-tunnel.ts` (serveur)**

```typescript
/**
 * Tunnel outreach /start/<token> : le prospect a reçu un lien personnalisé,
 * son site (draft) et son contenu ont été préparés par l'admin (CRM/CLI).
 * Ici on amorce/charge son `site_onboarding` en SEMANT l'intake depuis la
 * fiche prospect (téléphone, ville, Instagram…) — c'est ce seed qui permet
 * au chatbot de ne jamais redemander une info connue.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { candidateTemplates } from "@/lib/onboarding";
import { DEFAULT_CATEGORY, getCategory } from "@/lib/categories";
import { isTemplateId, type TemplateId } from "@/lib/templates";
import type { Intake } from "@/lib/onboarding-config";

export type StartState = {
  token: string;
  siteId: string;
  ownerUserId: string | null;
  firstName: string | null;
  categoryId: string;
  templateId: TemplateId | null;
  chosenTemplateId: string | null;
  candidateTemplateIds: TemplateId[];
  billingStatus: string;
  siteStatus: string;
};

/**
 * Charge l'état du tunnel pour un token, en créant le site_onboarding au
 * premier passage (seed depuis la fiche prospect). Renvoie null si token inconnu.
 */
export async function loadStartState(token: string): Promise<StartState | null> {
  const admin = createAdminClient();
  const { data: code } = await admin
    .from("prospect_codes")
    .select("id, site_id, prospect_id, status")
    .eq("token", token)
    .maybeSingle();
  if (!code?.site_id) return null;

  const { data: site } = await admin
    .from("sites")
    .select("id, template_id, owner_user_id, status, billing_status")
    .eq("id", code.site_id)
    .maybeSingle();
  if (!site) return null;

  const { data: prospect } = code.prospect_id
    ? await admin
        .from("prospects")
        .select("first_name, email, phone, city, company_name, instagram, category")
        .eq("id", code.prospect_id)
        .maybeSingle()
    : { data: null };

  let { data: ob } = await admin
    .from("site_onboarding")
    .select("site_id, intake, chosen_template_id, candidate_template_ids")
    .eq("site_id", site.id)
    .maybeSingle();

  if (!ob) {
    // Premier passage : seed de l'intake depuis la fiche prospect (CRM).
    const categoryId =
      (prospect?.category && getCategory(prospect.category)?.id) || DEFAULT_CATEGORY.id;
    const intake: Intake & { categoryId?: string } = {
      categoryId,
      brand: prospect?.company_name || prospect?.first_name || undefined,
      contactEmail: prospect?.email || undefined,
      contactPhone: prospect?.phone || undefined,
      city: prospect?.city || undefined,
      instagram: prospect?.instagram || undefined,
    };
    const inserted = await admin
      .from("site_onboarding")
      .insert({
        site_id: site.id,
        intake,
        step: 0,
        candidate_template_ids: candidateTemplates(categoryId),
      })
      .select("site_id, intake, chosen_template_id, candidate_template_ids")
      .single();
    ob = inserted.data;
  }
  if (!ob) return null;

  const intake = (ob.intake ?? {}) as Intake & { categoryId?: string };
  const categoryId = intake.categoryId ?? DEFAULT_CATEGORY.id;
  const candidates = (ob.candidate_template_ids ?? []).filter(isTemplateId);

  return {
    token,
    siteId: site.id,
    ownerUserId: (site.owner_user_id as string) ?? null,
    firstName: prospect?.first_name ?? null,
    categoryId,
    templateId: isTemplateId(site.template_id) ? site.template_id : null,
    chosenTemplateId: ob.chosen_template_id ?? null,
    candidateTemplateIds:
      candidates.length > 0 ? candidates : candidateTemplates(categoryId),
    billingStatus: (site.billing_status as string) ?? "none",
    siteStatus: (site.status as string) ?? "draft",
  };
}
```

- [ ] **Step 2: Créer la route d'aperçu token-gated `app/api/start/preview/route.ts`**

Même rendu que `/api/onboarding/preview`, mais l'autorisation est le TOKEN (secret), pas le cookie — le prospect n'a pas encore de compte :

```typescript
/**
 * Aperçu du tunnel /start : rend le site du prospect sur un template donné.
 * Auth = le token lui-même (lien secret), comme /r/<token>. noindex + no-store.
 */
import { loadStartState } from "@/lib/start-tunnel";
import { regenerateForSite } from "@/lib/onboarding";
import { buildSiteHtml } from "@/lib/site-server";
import { metaForTemplate } from "@/lib/site-content";
import { isTemplateId, type TemplateId } from "@/lib/templates";

export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token") ?? "";
  const templateParam = searchParams.get("template") ?? "";

  const state = token ? await loadStartState(token) : null;
  if (!state) return new Response("Lien invalide ou expiré.", { status: 404 });

  const templateOverride: TemplateId | undefined = isTemplateId(templateParam)
    ? templateParam
    : undefined;

  const built = await regenerateForSite(origin, state.siteId, templateOverride);
  if (!built) return new Response("Aperçu indisponible.", { status: 404 });

  const html = await buildSiteHtml(
    origin,
    built.templateId,
    built.content,
    metaForTemplate(built.content, built.templateId, "/"),
  );
  if (!html) return new Response("Template indisponible.", { status: 500 });

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}
```

- [ ] **Step 3: Créer la route de liaison `app/api/start/claim/route.ts`**

```typescript
/**
 * Le prospect (désormais connecté) revendique son site et fige sa template :
 * liaison owner_user_id + finalizeChoice (contenu final + enrichissement IA).
 * Garde-fou : un site déjà revendiqué par un AUTRE compte est refusé.
 */
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadStartState } from "@/lib/start-tunnel";
import { finalizeChoice } from "@/lib/onboarding";
import { isTemplateId, type TemplateId } from "@/lib/templates";

export const maxDuration = 60; // enrichissement IA de finalizeChoice

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  let body: { token?: string; templateId?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const token = String(body.token ?? "");
  const templateId = String(body.templateId ?? "");
  const state = token ? await loadStartState(token) : null;
  if (!state) {
    return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 404 });
  }
  if (state.ownerUserId && state.ownerUserId !== user.id) {
    return NextResponse.json({ error: "Ce site est déjà rattaché à un autre compte." }, { status: 403 });
  }
  if (!isTemplateId(templateId)) {
    return NextResponse.json({ error: "Modèle invalide." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!state.ownerUserId) {
    await admin.from("sites").update({ owner_user_id: user.id }).eq("id", state.siteId);
  }

  const origin = new URL(request.url).origin;
  const ok = await finalizeChoice(origin, state.siteId, templateId as TemplateId);
  if (!ok) {
    return NextResponse.json({ error: "Finalisation impossible." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, siteId: state.siteId });
}
```

- [ ] **Step 4: Créer `app/start/[token]/page.tsx` (server)**

```tsx
import { notFound, redirect } from "next/navigation";
import { loadStartState } from "@/lib/start-tunnel";
import { getUser } from "@/lib/auth";
import StartClient from "./StartClient";

export const dynamic = "force-dynamic";

/**
 * Étape 1/3 du tunnel outreach : choix de la template avec le contenu du
 * prospect déjà injecté. Public mais token-gated ; jamais indexé.
 */
export default async function StartPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const state = await loadStartState(token);
  if (!state) notFound();

  const user = await getUser();
  // Déjà revendiqué + finalisé par ce compte → direction la suite du tunnel.
  if (user && state.ownerUserId === user.id && state.chosenTemplateId) {
    redirect("/onboarding/chat");
  }

  return (
    <StartClient
      token={token}
      firstName={state.firstName}
      candidateTemplateIds={state.candidateTemplateIds}
      isAuthed={Boolean(user)}
    />
  );
}
```

Ajouter `export const metadata = { robots: { index: false, follow: false } };` en haut du fichier (au niveau module).

- [ ] **Step 5: Créer `app/start/[token]/StartClient.tsx` (client)**

DA ciel/glass/bleu de la landing (mêmes classes que `components/marketing/` : surface `.akyra`, `liquid-glass`, `sky-anim` — vérifier les noms exacts dans `app/globals.css` avant usage). Structure :

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AuthGate from "@/components/auth/AuthGate";
import { Logo } from "@/components/ui/Logo";

/**
 * Étape 1/3 : galerie des templates candidates, chacune rendue avec le contenu
 * réel du prospect (iframe /api/start/preview). Aucune mention de prix.
 */
export default function StartClient({
  token,
  firstName,
  candidateTemplateIds,
  isAuthed,
}: {
  token: string;
  firstName: string | null;
  candidateTemplateIds: string[];
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null); // template cliquée
  const [gateOpen, setGateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function claim(templateId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/start/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, templateId }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur");
      router.push("/onboarding/chat");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      setBusy(false);
    }
  }

  function onChoose(templateId: string) {
    setPending(templateId);
    if (isAuthed) void claim(templateId);
    else setGateOpen(true);
  }

  return (
    <div className="akyra min-h-screen">
      {/* fond ciel animé + header : logo à gauche, étape à droite */}
      <header className="flex items-center justify-between px-6 py-4">
        <Logo />
        <span className="text-sm text-mist">étape 1/3</span>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20">
        <h1 className="font-archivo text-4xl font-semibold text-night">
          {firstName ? `${firstName}, votre site est prêt.` : "Votre site est prêt."}
        </h1>
        <p className="mt-2 text-lg text-slate">
          Choisissez le style qui vous ressemble — tout est déjà rempli avec vos contenus.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {candidateTemplateIds.map((id) => (
            <div key={id} className="liquid-glass overflow-hidden rounded-2xl border border-sky-300">
              <iframe
                src={`/api/start/preview?token=${encodeURIComponent(token)}&template=${id}`}
                className="pointer-events-none aspect-[4/5] w-full origin-top-left"
                title={`Aperçu ${id}`}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin"
              />
              <div className="flex items-center justify-between p-4">
                <a
                  href={`/api/start/preview?token=${encodeURIComponent(token)}&template=${id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-brand hover:text-brand-700"
                >
                  Voir en grand →
                </a>
                <button
                  onClick={() => onChoose(id)}
                  disabled={busy}
                  className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {busy && pending === id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Choisir ce style"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
      </main>

      <AuthGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        brief=""
        onAuthed={() => {
          setGateOpen(false);
          if (pending) void claim(pending);
        }}
      />
    </div>
  );
}
```

AVANT d'écrire ce fichier : vérifier dans `components/ui/Logo.tsx` le nom exact de l'export (`Logo` vs `AkyraMark` — `AuthGate.tsx:6` importe `AkyraMark`), et dans `app/globals.css` les classes utilitaires réelles (`text-night`, `text-mist`, `text-slate`, `liquid-glass`, `bg-brand`, `border-sky-300` sont utilisées dans `app/dashboard/page.tsx` — réutiliser exactement celles-là). Ajuster l'import en conséquence.

- [ ] **Step 6: Vérification manuelle**

Run: `npm run dev`, créer un prospect + site via le flux admin existant (ou réutiliser un token existant), ouvrir `/start/<token>`.
Expected: galerie des templates avec le contenu du prospect, prénom dans le titre, choix → AuthGate → redirection `/onboarding/chat` (404 pour l'instant, normal — Task 6).

- [ ] **Step 7: Commit**

```bash
git add lib/start-tunnel.ts app/start app/api/start
git commit -m "feat(start): tunnel /start/<token> — seed intake CRM + choix de template"
```

---

### Task 6: Étape ② — chatbot `/onboarding/chat`

**Files:**
- Create: `app/onboarding/chat/page.tsx`
- Create: `app/onboarding/chat/ChatClient.tsx`

- [ ] **Step 1: Créer `app/onboarding/chat/page.tsx` (server)**

```tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { loadOnboarding } from "@/lib/onboarding";
import { chatQuestionsFor } from "@/lib/chat-questions";
import ChatClient from "./ChatClient";

export const dynamic = "force-dynamic";

/**
 * Étape 2/3 : le chatbot d'affinage. Questions scriptées, filtrées par ce que
 * l'intake contient déjà — on ne redemande jamais une info connue.
 */
export default async function ChatPage() {
  const user = await requireUser();
  const state = await loadOnboarding(user.id);
  if (!state) redirect("/dashboard");

  const questions = chatQuestionsFor(
    state.categoryId,
    state.intake,
    state.skippedQuestions,
  );
  // Plus rien à demander → directement le dashboard.
  if (questions.length === 0) redirect("/dashboard");

  return (
    <ChatClient
      siteId={state.siteId}
      firstName={(state.intake.brand ?? "").split(" ")[0] || null}
      questions={questions}
    />
  );
}
```

NOTE : `loadOnboarding` cherche le site `draft` le plus récent du user — le site outreach revendiqué en Task 5 est bien `draft`, donc trouvé. Les fonctions `askIf` ne traversent pas la frontière server→client : on passe les questions DÉJÀ filtrées (la dépendance `priceRange`/`wantsPricingPage` est re-filtrée côté client, voir ChatClient).

- [ ] **Step 2: Créer `app/onboarding/chat/ChatClient.tsx`**

```tsx
"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import type { ChatQuestion } from "@/lib/chat-questions";
import type { Intake } from "@/lib/onboarding-config";

type Bubble = { from: "bot" | "user"; text: string };

/**
 * Chatbot scripté : une question à la fois, réponses rapides + « Passer ».
 * Chaque réponse est sauvegardée immédiatement (autosave /api/onboarding/save)
 * et le mini-aperçu est rechargé (debounce simple). Visuellement minimaliste,
 * DA ciel/glass de la landing.
 */
export default function ChatClient({
  siteId,
  firstName,
  questions,
}: {
  siteId: string;
  firstName: string | null;
  questions: ChatQuestion[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Partial<Intake>>({});
  const [skipped, setSkipped] = useState<string[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([
    {
      from: "bot",
      text: firstName
        ? `Superbe choix${firstName ? `, ${firstName}` : ""} ! Encore quelques détails pour affiner votre site — répondez ou passez, comme vous voulez.`
        : "Superbe choix ! Encore quelques détails pour affiner votre site — répondez ou passez, comme vous voulez.",
    },
  ]);
  const [textDraft, setTextDraft] = useState("");
  const [multiDraft, setMultiDraft] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Questions restantes : on rejoue le filtre askIf côté client au fil des
  // réponses (ex. priceRange n'apparaît que si wantsPricingPage === true).
  const remaining = useMemo(
    () =>
      questions.filter((q) => {
        if (q.key in answers || skipped.includes(q.key)) return false;
        if (q.key === "priceRange") return answers.wantsPricingPage === true;
        return true;
      }),
    [questions, answers, skipped],
  );
  const current = remaining[0] ?? null;
  const total = questions.length;
  const done = total - remaining.length;

  function schedulePreviewReload() {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => setPreviewKey((k) => k + 1), 800);
  }

  async function persist(patch: Partial<Intake>, skippedKey?: string) {
    setSaving(true);
    try {
      await fetch("/api/onboarding/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          siteId,
          patch,
          skipped: skippedKey ? [skippedKey] : undefined,
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  function answer(q: ChatQuestion, value: Intake[keyof Intake], display: string) {
    setBubbles((b) => [...b, { from: "user", text: display }]);
    setAnswers((a) => ({ ...a, [q.key]: value }));
    setTextDraft("");
    setMultiDraft([]);
    void persist({ [q.key]: value } as Partial<Intake>);
    schedulePreviewReload();
  }

  function skip(q: ChatQuestion) {
    setBubbles((b) => [...b, { from: "user", text: "Passer" }]);
    setSkipped((s) => [...s, q.key]);
    void persist({}, q.key);
  }

  function finish() {
    router.push("/dashboard?fromChat=1");
  }

  return (
    <div className="akyra flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <Logo />
        <span className="text-sm text-mist">étape 2/3</span>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 pb-10">
        {/* fil de bulles */}
        <div className="space-y-3">
          {bubbles.map((b, i) => (
            <div
              key={i}
              className={
                b.from === "bot"
                  ? "liquid-glass max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 text-[15px] text-night"
                  : "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-brand px-4 py-3 text-[15px] text-white"
              }
            >
              {b.text}
            </div>
          ))}
          {current && (
            <div className="liquid-glass max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 text-[15px] text-night">
              {current.label}
              {current.help && <p className="mt-1 text-sm text-mist">{current.help}</p>}
            </div>
          )}
        </div>

        {/* zone de réponse */}
        {current ? (
          <div className="mt-auto space-y-3">
            {current.kind === "boolean" && (
              <div className="flex gap-3">
                <button className="flex-1 rounded-full bg-brand py-3 font-bold text-white" onClick={() => answer(current, true, "Oui")}>Oui</button>
                <button className="flex-1 rounded-full border border-sky-300 py-3 font-semibold text-night" onClick={() => answer(current, false, "Non")}>Non</button>
              </div>
            )}
            {current.kind === "choice" && (
              <div className="flex flex-wrap gap-2">
                {(current.options ?? []).map((o) => (
                  <button key={o.value} className="rounded-full border border-sky-300 px-5 py-2.5 font-semibold text-night hover:border-brand" onClick={() => answer(current, o.value as Intake[keyof Intake], o.label)}>
                    {o.label}
                  </button>
                ))}
              </div>
            )}
            {current.kind === "multiselect" && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(current.options ?? []).map((o) => {
                    const on = multiDraft.includes(o.value);
                    return (
                      <button key={o.value} className={`rounded-full border px-4 py-2 text-sm font-semibold ${on ? "border-brand bg-brand text-white" : "border-sky-300 text-night"}`} onClick={() => setMultiDraft((m) => (on ? m.filter((v) => v !== o.value) : [...m, o.value]))}>
                        {o.label}
                      </button>
                    );
                  })}
                </div>
                <button disabled={multiDraft.length === 0} className="rounded-full bg-brand px-6 py-2.5 font-bold text-white disabled:opacity-40" onClick={() => answer(current, multiDraft, multiDraft.join(", "))}>
                  Valider
                </button>
              </div>
            )}
            {current.kind === "text" && (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (textDraft.trim()) answer(current, textDraft.trim(), textDraft.trim());
                }}
              >
                <input value={textDraft} onChange={(e) => setTextDraft(e.target.value)} placeholder={current.placeholder} className="flex-1 rounded-full border border-sky-300 bg-white px-5 py-3 text-[15px] outline-none focus:border-brand" />
                <button type="submit" className="rounded-full bg-brand px-6 font-bold text-white">OK</button>
              </form>
            )}
            <div className="flex items-center justify-between text-sm">
              <button className="text-mist hover:text-night" onClick={() => skip(current)}>Passer ›</button>
              <span className="text-mist">{done}/{total}{saving ? " · enregistrement…" : ""}</span>
            </div>
          </div>
        ) : (
          <div className="mt-auto space-y-3 text-center">
            <p className="text-[15px] text-night">Parfait, tout est noté. Votre site vous attend.</p>
            <button className="rounded-full bg-brand px-8 py-3 font-bold text-white" onClick={finish}>
              Découvrir mon site →
            </button>
          </div>
        )}

        {/* mini-aperçu live */}
        <div className="overflow-hidden rounded-2xl border border-sky-300 bg-white">
          <iframe
            key={previewKey}
            src={`/api/onboarding/preview?siteId=${siteId}`}
            className="pointer-events-none aspect-[16/10] w-full"
            title="Aperçu de votre site"
          />
        </div>
      </main>
    </div>
  );
}
```

Même consigne que Task 5 Step 5 : vérifier les exports `Logo` et les classes utilitaires réelles avant d'écrire.

- [ ] **Step 3: Vérification manuelle du flux complet ①→②**

Run: `npm run dev`, parcourir `/start/<token>` → choisir une template → `/onboarding/chat`.
Expected: les questions dont la réponse est déjà dans l'intake (ex. téléphone pré-rempli depuis le CRM) n'apparaissent PAS ; « Passer » avance ; refresh de la page reprend où on en était (les réponses/skips persistés ne reviennent pas) ; l'aperçu se recharge après une réponse ; « Découvrir mon site » → `/dashboard`.

- [ ] **Step 4: Commit**

```bash
git add app/onboarding/chat
git commit -m "feat(chat): étape 2/3 — chatbot scripté avec aperçu live et reprise"
```

---

### Task 7: Essai 3 jours — Stripe setup + fulfillment + webhook

**Files:**
- Create: `lib/trial.ts`
- Create: `app/api/trial/start/route.ts`
- Create: `app/api/trial/cancel/route.ts`
- Create: `app/welcome/trial/route.ts`
- Modify: `lib/fulfill.ts:39` (exporter `goLive`), `lib/fulfill.ts:189` (exporter `slugBaseForSite`)
- Modify: `app/api/stripe/webhook/route.ts:37-49`

- [ ] **Step 1: Exporter `goLive` et `slugBaseForSite` depuis `lib/fulfill.ts`**

Ajouter `export` devant `async function goLive(` (ligne 39) et `async function slugBaseForSite(` (ligne 189). Aucun autre changement.

- [ ] **Step 2: Créer `lib/trial.ts`**

```typescript
/**
 * Essai gratuit 3 jours : la carte est enregistrée (Checkout mode=setup, 0 €),
 * le site est publié immédiatement, et le débit de 50 € a lieu à J+3
 * (worker scripts/trial-worker.mjs, PaymentIntent off-session).
 *
 * Idempotence du fulfillment : clé = stripe_session_id dans payments
 * (ligne `trial_50` créée `pending` ici, passée `paid` par le worker).
 */
import type Stripe from "stripe";
import { stripe, SIGNUP_CREDITS } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantCredits } from "@/lib/credits-server";
import { goLive, slugBaseForSite } from "@/lib/fulfill";

export const TRIAL_DAYS = 3;

/**
 * Effets durables d'un Checkout setup réussi — IDEMPOTENT.
 * Appelé depuis /welcome/trial (immédiat) ET le webhook (filet de sécurité).
 */
export async function fulfillTrialStart(session: Stripe.Checkout.Session): Promise<{
  siteId: string | null;
  slug: string | null;
}> {
  const admin = createAdminClient();
  const siteId = (session.metadata?.site_id as string) || null;
  const userId = (session.metadata?.user_id as string) || null;
  if (!siteId || !userId) return { siteId: null, slug: null };

  // Idempotence : la session a déjà été traitée → ne rien refaire.
  const { data: existing } = await admin
    .from("payments")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (existing) {
    const { data: site } = await admin.from("sites").select("slug").eq("id", siteId).maybeSingle();
    return { siteId, slug: (site?.slug as string) ?? null };
  }

  // Carte enregistrée : setup_intent → payment_method + customer.
  const setupIntentId =
    typeof session.setup_intent === "string" ? session.setup_intent : session.setup_intent?.id;
  if (!setupIntentId) return { siteId, slug: null };
  const si = await stripe.setupIntents.retrieve(setupIntentId);
  const paymentMethodId =
    typeof si.payment_method === "string" ? si.payment_method : si.payment_method?.id;
  const customerId = typeof si.customer === "string" ? si.customer : si.customer?.id;
  if (!paymentMethodId || !customerId) return { siteId, slug: null };

  await admin
    .from("profiles")
    .update({ stripe_customer_id: customerId, stripe_payment_method_id: paymentMethodId })
    .eq("id", userId);

  // Trace de paiement en attente (le worker la passera `paid` à J+3).
  await admin.from("payments").insert({
    user_id: userId,
    stripe_session_id: session.id,
    amount_cents: 5000,
    currency: "eur",
    kind: "trial_50",
    status: "pending",
  });

  // Crédits de bienvenue : le client peut faire ses premières modifs pendant l'essai.
  await grantCredits(admin, userId, SIGNUP_CREDITS, "signup_grant", {
    trial_session_id: session.id,
  });

  // Publication immédiate + démarrage de l'essai.
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 3600 * 1000).toISOString();
  const base = await slugBaseForSite(admin, siteId, null);
  const slug = await goLive(admin, siteId, base);
  await admin
    .from("sites")
    .update({ billing_status: "trialing", trial_ends_at: trialEndsAt, trial_charge_attempts: 0 })
    .eq("id", siteId);

  // Côté prospection : ce prospect est converti (stoppe les relances).
  const { data: code } = await admin
    .from("prospect_codes")
    .select("id, prospect_id")
    .eq("site_id", siteId)
    .maybeSingle();
  if (code?.id) {
    await admin.from("prospect_codes").update({ status: "paid" }).eq("id", code.id);
    if (code.prospect_id) {
      await admin
        .from("outreach")
        .update({ status: "converted", updated_at: new Date().toISOString() })
        .eq("prospect_id", code.prospect_id);
    }
  }
  await admin.from("events").insert({ site_id: siteId, type: "trial_started" });

  return { siteId, slug };
}

/** Annulation pendant l'essai : dépublie le site, aucune charge. */
export async function cancelTrial(siteId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("sites")
    .update({ billing_status: "canceled", status: "draft" })
    .eq("id", siteId)
    .eq("billing_status", "trialing");
  const { data: sc } = await admin
    .from("site_content")
    .select("id")
    .eq("site_id", siteId)
    .eq("is_published", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sc) await admin.from("site_content").update({ is_published: false }).eq("id", sc.id);
}
```

AVANT d'écrire : vérifier la signature exacte de `grantCredits` dans `lib/credits-server.ts` (utilisée dans `lib/fulfill.ts:134` comme `grantCredits(admin, userId, SIGNUP_CREDITS, "signup_grant", { payment_id })`) et que la table `events` accepte `token` null (`lib/fulfill.ts:175` passe `{ token, site_id, type }` — si `token` est requis, passer `token: null` explicitement).

- [ ] **Step 3: Créer `app/api/trial/start/route.ts`**

```typescript
/**
 * Démarre l'essai 3 jours : Checkout Stripe `mode=setup` (enregistre la carte,
 * 0 € débité aujourd'hui). Form POST (redirect plein écran, pas de fetch).
 */
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { userOwnsSite } from "@/lib/onboarding";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), 303);

  const form = await request.formData().catch(() => null);
  const siteId = String(form?.get("siteId") ?? "");
  if (!siteId || !(await userOwnsSite(user.id, siteId))) {
    return new Response("Accès refusé.", { status: 403 });
  }

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("billing_status")
    .eq("id", siteId)
    .maybeSingle();
  // Déjà en essai ou payé → rien à faire.
  if (site?.billing_status === "trialing" || site?.billing_status === "paid") {
    return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  }

  // Customer Stripe (réutilisé s'il existe — colonne posée par le flux topup).
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .maybeSingle();
  let customerId = (profile?.stripe_customer_id as string) ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? (profile?.email as string) ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const origin = new URL(request.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: customerId,
    payment_method_types: ["card"],
    metadata: { flow: "trial_50", site_id: siteId, user_id: user.id },
    success_url: `${origin}/welcome/trial?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard`,
  });
  if (!session.url) return new Response("Échec de création du paiement.", { status: 500 });
  return NextResponse.redirect(session.url, 303);
}
```

AVANT d'écrire : vérifier que `profiles` a bien une colonne `email` (sinon retirer du select et n'utiliser que `user.email`).

- [ ] **Step 4: Créer `app/api/trial/cancel/route.ts`**

```typescript
/** Annule l'essai en cours (dépublie, aucune charge). Form POST depuis le bandeau. */
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { userOwnsSite } from "@/lib/onboarding";
import { cancelTrial } from "@/lib/trial";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), 303);

  const form = await request.formData().catch(() => null);
  const siteId = String(form?.get("siteId") ?? "");
  if (!siteId || !(await userOwnsSite(user.id, siteId))) {
    return new Response("Accès refusé.", { status: 403 });
  }
  await cancelTrial(siteId);
  return NextResponse.redirect(new URL("/dashboard?trialCanceled=1", request.url), 303);
}
```

- [ ] **Step 5: Créer `app/welcome/trial/route.ts` (retour Checkout, fulfillment immédiat)**

```typescript
/**
 * Retour du Checkout setup : applique fulfillTrialStart (idempotent — le
 * webhook est le filet de sécurité) puis renvoie au dashboard, site en ligne.
 */
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { fulfillTrialStart } from "@/lib/trial";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) return NextResponse.redirect(`${origin}/dashboard`);

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.mode === "setup" && session.status === "complete") {
    await fulfillTrialStart(session);
  }
  return NextResponse.redirect(`${origin}/dashboard?trial=1`);
}
```

- [ ] **Step 6: Brancher le webhook**

Dans `app/api/stripe/webhook/route.ts`, dans le case `checkout.session.completed`, ajouter la branche setup AVANT le fallback `fulfillPayment` :

```typescript
        if (s.mode === "subscription" && s.subscription) {
          const sub = await stripe.subscriptions.retrieve(s.subscription as string);
          await syncSubscription(sub);
        } else if (s.mode === "setup" && s.metadata?.flow === "trial_50") {
          const { fulfillTrialStart } = await import("@/lib/trial");
          await fulfillTrialStart(s);
        } else if (s.metadata?.kind === "topup") {
          await fulfillTopup(s);
        } else {
          // Flux historique : mise en ligne 50 €.
          await fulfillPayment(s);
        }
```

(Import statique en haut du fichier préférable : `import { fulfillTrialStart } from "@/lib/trial";` — utiliser l'import statique, le dynamique ci-dessus n'est montré que pour situer la branche.)

- [ ] **Step 7: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: 0 nouvelle erreur.

- [ ] **Step 8: Test manuel Stripe (mode TEST)**

Run: `npm run dev` + `stripe listen --forward-to localhost:3000/api/stripe/webhook` (si la CLI Stripe est configurée ; sinon tester via /welcome/trial seul, le webhook étant le filet).
Depuis le dashboard (après Task 8), démarrer l'essai avec la carte test `4242 4242 4242 4242`.
Expected: retour `/dashboard?trial=1`, site `live` + slug, `billing_status='trialing'`, `trial_ends_at` ≈ J+3, ligne `payments` kind `trial_50` status `pending`, crédits > 0.

- [ ] **Step 9: Commit**

```bash
git add lib/trial.ts lib/fulfill.ts app/api/trial app/welcome/trial app/api/stripe/webhook/route.ts
git commit -m "feat(trial): essai 3 jours — Checkout setup, publication immédiate, webhook"
```

---

### Task 8: Dashboard verrouillé — popup paywall + bandeau d'essai

**Files:**
- Create: `components/dashboard/PaywallModal.tsx`
- Create: `components/dashboard/TrialBanner.tsx`
- Modify: `app/dashboard/page.tsx:26-137`

- [ ] **Step 1: Créer `components/dashboard/PaywallModal.tsx`**

```tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AkyraMark } from "@/components/ui/Logo";

/**
 * Popup paywall (DA glass landing) : ouvert par toute action verrouillée tant
 * que le site n'est ni en essai ni payé. Un seul CTA : démarrer l'essai 3 jours
 * (form POST → Stripe Checkout setup). Prix transparent, ton doux.
 */
export default function PaywallModal({
  siteId,
  firstName,
  defaultOpen = false,
  trigger,
}: {
  siteId: string;
  firstName?: string | null;
  defaultOpen?: boolean;
  /** Élément cliquable qui ouvre le popup (bouton « Publier », « Modifier »…). */
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      {trigger && (
        <span onClick={() => setOpen(true)} className="contents cursor-pointer">
          {trigger}
        </span>
      )}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-night/30 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="liquid-glass relative w-full max-w-md rounded-3xl border border-sky-300 bg-white/80 p-8 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute right-4 top-4 text-mist hover:text-night"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
            >
              <X className="size-5" />
            </button>
            <AkyraMark className="mx-auto size-10" />
            <h2 className="mt-4 font-archivo text-2xl font-semibold text-night">
              {firstName ? `${firstName}, votre site est prêt.` : "Votre site est prêt."}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate">
              Essayez Akyra gratuitement pendant 3 jours : publiez votre site
              maintenant et modifiez-le librement. 50 € après l'essai —
              annulable à tout moment, en un clic.
            </p>
            <form method="post" action="/api/trial/start" className="mt-6">
              <input type="hidden" name="siteId" value={siteId} />
              <button
                type="submit"
                className="w-full rounded-full bg-brand py-3.5 font-bold text-white transition hover:opacity-90"
              >
                Essayer gratuitement 3 jours
              </button>
            </form>
            <button
              className="mt-3 text-sm text-mist hover:text-night"
              onClick={() => setOpen(false)}
            >
              Plus tard
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

Vérifier que `AkyraMark` accepte `className` (sinon l'envelopper d'un `<div className="mx-auto w-10">`).

- [ ] **Step 2: Créer `components/dashboard/TrialBanner.tsx`**

```tsx
/**
 * Bandeau discret pendant l'essai : jours restants + annulation en un clic.
 * Server-friendly (pas de state) — le form POST suffit.
 */
export default function TrialBanner({
  siteId,
  trialEndsAt,
}: {
  siteId: string;
  trialEndsAt: string;
}) {
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000),
  );
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-300 bg-white/60 px-5 py-3.5">
      <p className="text-sm text-night">
        <span className="font-semibold">Essai gratuit</span> —{" "}
        {daysLeft <= 1 ? "dernier jour" : `${daysLeft} jours restants`}. Votre
        site est en ligne ; 50 € seront débités à la fin de l'essai.
      </p>
      <form method="post" action="/api/trial/cancel">
        <input type="hidden" name="siteId" value={siteId} />
        <button type="submit" className="text-sm font-semibold text-mist hover:text-night">
          Annuler l'essai
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Verrouiller le dashboard**

Dans `app/dashboard/page.tsx` :

1. Étendre le select sites (ligne 28) : `"id, slug, status, template_id, published_at, created_at, billing_status, trial_ends_at"`.
2. Récupérer le prénom : après le select du site, lire l'intake :

```typescript
  const { data: ob } = site
    ? await admin
        .from("site_onboarding")
        .select("intake")
        .eq("site_id", site.id)
        .maybeSingle()
    : { data: null };
  const firstName =
    ((ob?.intake as { brand?: string } | null)?.brand ?? "").split(" ")[0] || null;
```

3. Calculer le verrou après `const isLive = ...` :

```typescript
  const billing = (site.billing_status as string) ?? "none";
  const locked = !isLive && ["none", "canceled", "payment_failed"].includes(billing);
```

4. Importer les deux composants et la lecture de `searchParams` (la page devient `async function MonSite({ searchParams }: { searchParams: Promise<{ paywall?: string; fromChat?: string }> })` ; `const sp = await searchParams;`).
5. Sous le `<PageHeader …/>`, afficher le bandeau si essai en cours :

```tsx
      {billing === "trialing" && site.trial_ends_at && (
        <TrialBanner siteId={site.id} trialEndsAt={site.trial_ends_at as string} />
      )}
```

6. Remplacer le bloc d'actions `{!isLive && (… Modifier mon site …)}` (lignes 128-137) par :

```tsx
        {!isLive && (
          <div className="mt-5 flex flex-wrap gap-3">
            {locked ? (
              <PaywallModal
                siteId={site.id}
                firstName={firstName}
                defaultOpen={Boolean(sp.paywall) || Boolean(sp.fromChat)}
                trigger={<Button>Publier mon site</Button>}
              />
            ) : (
              lastContent && <Button href="/editor">Modifier mon site</Button>
            )}
            {locked && lastContent && (
              <PaywallModal
                siteId={site.id}
                firstName={firstName}
                trigger={<Button variant="subtle">Modifier mon site</Button>}
              />
            )}
            {!locked && (
              <Button href="/dashboard/modifications" variant="subtle">
                Voir mes options
              </Button>
            )}
          </div>
        )}
```

ATTENTION : un seul `defaultOpen` doit être vrai (le premier PaywallModal) — l'arrivée depuis le chat (`?fromChat=1`) ouvre le popup une fois, doucement, après que le client a vu son site se charger. Si `Button` rend un `<a>`/`<button>` qui soumet, vérifier que le `trigger` cliqué n'a pas de `href` (passer `<Button as="span">` ou un bouton brut si nécessaire — regarder l'API réelle de `components/ui/Button.tsx` avant d'écrire).

7. Garde-fou éditeur : dans la page `/editor` (trouver via `ls app/editor`), ajouter en tête du composant serveur :

```typescript
  const { data: editSite } = await admin
    .from("sites")
    .select("id, status, billing_status")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (
    editSite &&
    editSite.status !== "live" &&
    ["none", "canceled", "payment_failed"].includes((editSite.billing_status as string) ?? "none")
  ) {
    redirect("/dashboard?paywall=1");
  }
```

(Adapter aux variables déjà présentes dans la page — elle charge probablement déjà le site ; ne pas dupliquer la requête si c'est le cas.)

- [ ] **Step 4: Vérification manuelle**

Run: `npm run dev`, compte de test avec site draft issu du tunnel.
Expected: dashboard → site en grand, popup s'ouvre à l'arrivée depuis le chat ; « Publier mon site » et « Modifier mon site » ouvrent le popup ; `/editor` en accès direct redirige vers `/dashboard?paywall=1` (popup ouvert) ; après démarrage d'essai, bandeau « X jours restants », boutons débloqués ; « Annuler l'essai » dépublie.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard app/dashboard/page.tsx app/editor
git commit -m "feat(paywall): dashboard verrouillé — popup essai 3 jours + bandeau trial"
```

---

### Task 9: Worker de débit J+3 (`scripts/trial-worker.mjs`)

**Files:**
- Create: `scripts/trial-worker.mjs`
- Modify: `package.json:14-15` (ajouter les scripts npm)
- Modify: `lib/email/templates.ts` + `lib/email/send.ts` (email d'échec de débit)

- [ ] **Step 1: Email d'échec de débit**

Dans `lib/email/templates.ts`, ajouter (suivre le style des templates existants — lire le fichier d'abord, notamment `receiptEmail`, et copier sa structure HTML/texte) :

```typescript
/** Relance après échec du débit de fin d'essai. */
export function trialChargeFailedEmail(opts: {
  firstName?: string | null;
  dashboardUrl: string;
}): { subject: string; html: string; text: string } {
  const name = opts.firstName ? ` ${opts.firstName}` : "";
  const subject = "Votre site Akyra — un souci avec votre carte";
  const text = `Bonjour${name},

Nous n'avons pas pu débiter les 50 € de fin d'essai sur votre carte.
Votre site reste en ligne pendant que nous réessayons (3 tentatives).

Mettez à jour votre moyen de paiement depuis votre espace : ${opts.dashboardUrl}

L'équipe Akyra`;
  // HTML : reprendre la coquille des autres templates du fichier (mêmes styles).
  const html = text.replace(/\n/g, "<br/>");
  return { subject, html, text };
}
```

Dans `lib/email/send.ts`, ajouter après `sendReceipt` :

```typescript
/** Relance après échec du débit de fin d'essai. */
export async function sendTrialChargeFailed(
  admin: SupabaseClient,
  opts: { to: string; firstName?: string | null },
): Promise<string | null> {
  const mail = trialChargeFailedEmail({
    firstName: opts.firstName,
    dashboardUrl: `${appUrl()}/dashboard`,
  });
  const res = await sendRaw({
    from: fromTransactional(),
    to: opts.to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
  await logEvent(admin, {
    to_email: opts.to,
    kind: "trial_charge_failed",
    provider_id: res.id,
    event: "sent",
  });
  return res.id;
}
```

(et ajouter `trialChargeFailedEmail` à l'import depuis `./templates`).

- [ ] **Step 2: Créer `scripts/trial-worker.mjs`**

```javascript
// Worker de fin d'essai : débite 50 € (off-session) sur les sites `trialing`
// arrivés à échéance. Idempotent : la ligne payments `trial_50/pending` créée
// au setup est la trace ; elle passe `paid` au succès.
//
//   npm run trial:worker:once   → traite les essais dus puis s'arrête
//   npm run trial:worker        → boucle (poll toutes les 10 min)
//   DRY_RUN=1 npm run trial:worker:once → log au lieu de débiter
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { sendTrialChargeFailed } from "../lib/email/send.ts";

const ONCE = process.argv.includes("--once");
const DRY_RUN = process.env.DRY_RUN === "1";
const POLL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const AMOUNT_CENTS = 5000;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Dépublie un site (échec définitif ou anomalie de moyen de paiement). */
async function unpublish(siteId, billingStatus) {
  await admin.from("sites").update({ billing_status: billingStatus, status: "draft" }).eq("id", siteId);
  const { data: sc } = await admin
    .from("site_content")
    .select("id")
    .eq("site_id", siteId)
    .eq("is_published", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sc) await admin.from("site_content").update({ is_published: false }).eq("id", sc.id);
}

async function chargeSite(site) {
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, stripe_payment_method_id")
    .eq("id", site.owner_user_id)
    .maybeSingle();
  if (!profile?.stripe_customer_id || !profile?.stripe_payment_method_id) {
    log(`site ${site.id}: pas de carte enregistrée → payment_failed`);
    await unpublish(site.id, "payment_failed");
    return;
  }

  if (DRY_RUN) {
    log(`[dry-run] débiterait 50 € — site ${site.id}, customer ${profile.stripe_customer_id}`);
    return;
  }

  try {
    const pi = await stripe.paymentIntents.create({
      amount: AMOUNT_CENTS,
      currency: "eur",
      customer: profile.stripe_customer_id,
      payment_method: profile.stripe_payment_method_id,
      off_session: true,
      confirm: true,
      description: "Akyra — mise en ligne de votre site (fin d'essai)",
      metadata: { site_id: site.id, flow: "trial_50" },
    });
    // Succès : trace payments pending → paid, site → paid.
    await admin
      .from("payments")
      .update({ status: "paid", stripe_payment_intent: pi.id })
      .eq("user_id", site.owner_user_id)
      .eq("kind", "trial_50")
      .eq("status", "pending");
    await admin.from("sites").update({ billing_status: "paid" }).eq("id", site.id);
    await admin.from("events").insert({ site_id: site.id, type: "purchased" });
    log(`site ${site.id}: débit OK (${pi.id})`);
  } catch (e) {
    const attempts = (site.trial_charge_attempts ?? 0) + 1;
    log(`site ${site.id}: échec débit (tentative ${attempts}/${MAX_ATTEMPTS}) — ${e.message}`);
    if (attempts >= MAX_ATTEMPTS) {
      await unpublish(site.id, "payment_failed");
      await admin
        .from("payments")
        .update({ status: "failed" })
        .eq("user_id", site.owner_user_id)
        .eq("kind", "trial_50")
        .eq("status", "pending");
    } else {
      // Réessai au prochain passage : repousse l'échéance de 24 h.
      await admin
        .from("sites")
        .update({
          trial_charge_attempts: attempts,
          trial_ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        })
        .eq("id", site.id);
    }
    // Relance email — best-effort, jamais bloquant.
    try {
      const { data: u } = await admin.auth.admin.getUserById(site.owner_user_id);
      if (u?.user?.email) {
        await sendTrialChargeFailed(admin, { to: u.user.email });
      }
    } catch (mailErr) {
      log(`site ${site.id}: email relance KO — ${mailErr.message}`);
    }
  }
}

async function tick() {
  const { data: due } = await admin
    .from("sites")
    .select("id, owner_user_id, trial_ends_at, trial_charge_attempts")
    .eq("billing_status", "trialing")
    .lte("trial_ends_at", new Date().toISOString())
    .limit(50);
  if (!due?.length) {
    log("aucun essai à débiter");
    return;
  }
  log(`${due.length} essai(s) à débiter`);
  for (const site of due) {
    await chargeSite(site);
    await sleep(1000);
  }
}

if (ONCE) {
  await tick();
} else {
  for (;;) {
    await tick();
    await sleep(POLL_MS);
  }
}
```

- [ ] **Step 3: Scripts npm**

Dans `package.json`, après les scripts `outreach:worker*` (lignes 14-15), ajouter :

```json
    "trial:worker": "node --import tsx --env-file=.env.local scripts/trial-worker.mjs",
    "trial:worker:once": "node --import tsx --env-file=.env.local scripts/trial-worker.mjs --once",
```

- [ ] **Step 4: Test dry-run**

Run: `DRY_RUN=1 npm run trial:worker:once`
Expected: « aucun essai à débiter » (base locale sans trial dû), zéro erreur d'import.

Test complet (mode Stripe TEST) : après le test manuel de Task 7, forcer l'échéance — `update sites set trial_ends_at = now() where billing_status='trialing'` (psql ou dashboard Supabase) — puis `npm run trial:worker:once`.
Expected: débit 50 € visible dans le dashboard Stripe TEST, `payments.status='paid'`, `sites.billing_status='paid'`.

- [ ] **Step 5: Commit**

```bash
git add scripts/trial-worker.mjs package.json lib/email/templates.ts lib/email/send.ts
git commit -m "feat(trial): worker de débit J+3 — off-session, retries, dépublication"
```

---

### Task 10: Vérification de bout en bout + finitions

**Files:**
- Modify (si besoin) : fichiers des tasks précédentes

- [ ] **Step 1: Suite de tests + build**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: tests verts, build OK.

- [ ] **Step 2: Parcours complet en local (mode Stripe TEST)**

1. Admin : préparer un prospect avec contenu (flux existant) → récupérer le token.
2. `/start/<token>` : prénom affiché, galerie avec contenu injecté, AUCUN prix.
3. Choix template → AuthGate (OTP) → `/onboarding/chat`.
4. Chat : le téléphone pré-rempli n'est PAS redemandé ; répondre à 2 questions, en passer 2 ; aperçu mis à jour.
5. `/dashboard?fromChat=1` : site en grand, popup s'ouvre une fois ; « Plus tard » le ferme ; chaque action le rouvre.
6. Essai : carte test → retour dashboard, site en ligne (`/s/<slug>` accessible), bandeau « 3 jours restants ».
7. `update sites set trial_ends_at=now()` + `npm run trial:worker:once` → débit OK, bandeau disparu.
8. Vérifier `/r/<token>` : aucun watermark, aucune bannière.

- [ ] **Step 3: Rapport final à Lucas**

Lister explicitement les actions de déploiement qui restent à SA main :
- appliquer `0017_trial_tunnel.sql` en prod (psql pooler eu-central-1, comme 0011-0014) ;
- lancer/planifier `trial:worker` en prod (même hôte que le worker outreach) ;
- vérifier que la clé Stripe prod et le webhook couvrent `checkout.session.completed` mode setup (déjà le cas : même event) ;
- générer les liens `/start/<token>` pour les prospects en cours.

- [ ] **Step 4: Commit final si retouches**

```bash
git add -A && git commit -m "chore(trial): finitions parcours tunnel + essai 3 jours"
```
