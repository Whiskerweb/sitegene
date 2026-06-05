# Refonte de l'éditeur façon Lovable — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer `/editor` en interface façon Lovable : chat IA persistant à gauche (historique en base), aperçu à droite, ciblage d'élément qui attache une chip au composer, galerie de composants possédés sur la page, mode édition manuelle conservé.

**Architecture:** Restructuration UI de l'existant — toute la plomberie (runtime postMessage `sg:*`, autosave page-aware, crédits, publication, aperçu éphémère des composants, flux `?integrate=`) est conservée. `EditorClient.tsx` est découpé en sous-composants présentational ; la logique pure du fil de chat vit dans `lib/chat-thread.ts` (testée) ; la persistance dans une table `ai_messages` alimentée par les routes API existantes.

**Tech Stack:** Next.js (App Router, voir `AGENTS.md` : lire `node_modules/next/dist/docs/` en cas de doute), React 19, Tailwind, framer-motion, Supabase (service role côté API), Vitest.

**Spec :** `docs/superpowers/specs/2026-06-05-editor-lovable-redesign-design.md`

**Repo :** tout se passe dans le repo imbriqué `sitegene/` (chemins relatifs à sa racine).

---

## Carte des fichiers

| Fichier | Rôle |
| --- | --- |
| Create `supabase/migrations/0018_ai_messages.sql` | Table `ai_messages` + RLS |
| Create `lib/chat-thread.ts` | Logique pure du fil (rows → thread, append, settle) — testée |
| Create `lib/chat-thread.test.ts` | Tests Vitest |
| Create `lib/ai-history.ts` | Helpers serveur (log/list) |
| Modify `app/api/site/ai/route.ts` | Journalise demande + réponse |
| Modify `app/api/site/ai/commit/route.ts` | Journalise l'acceptation |
| Create `app/editor/components/TextPanel.tsx` | Modale texte (extraite) |
| Create `app/editor/components/PhotoPicker.tsx` | Picker photo (extrait) |
| Create `app/editor/components/PreviewFrame.tsx` | Cadre appareil + iframe + dock ✎/⌖ |
| Create `app/editor/components/GalleryPopover.tsx` | Galerie des effets possédés |
| Create `app/editor/components/ChatMessage.tsx` | Bulles + carte proposition |
| Create `app/editor/components/ChatPanel.tsx` | Fil + composer + chips |
| Modify `app/editor/EditorClient.tsx` | Orchestration split layout + bottom sheet |
| Modify `app/editor/page.tsx` | Charge l'historique (50 derniers) |

---

### Task 1 : Migration `ai_messages`

**Files:**
- Create: `supabase/migrations/0018_ai_messages.sql`

- [ ] **Step 1 : Écrire la migration**

```sql
-- Fil de conversation IA de l'éditeur (façon Lovable) : un message par ligne.
-- Écritures via service role uniquement (routes /api/site/ai*) ; le owner lit.
create table if not exists public.ai_messages (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid not null references public.sites(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  kind       text not null check (kind in ('text','proposal','commit')),
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_messages_site_created
  on public.ai_messages (site_id, created_at desc);

alter table public.ai_messages enable row level security;

drop policy if exists ai_messages_select_own on public.ai_messages;
create policy ai_messages_select_own
  on public.ai_messages for select
  using (auth.uid() = user_id or public.is_operator());

notify pgrst, 'reload schema';
```

- [ ] **Step 2 : Commit**

```bash
git add supabase/migrations/0018_ai_messages.sql
git commit -m "feat(editor): table ai_messages (fil de chat persistant de l'éditeur)"
```

> ⚠️ **Prod** : comme 0011–0017, la migration s'applique en prod via psql sur le pooler eu-central-1 (xnjonnamprqrsqeetrtu) — à faire au moment du déploiement, pas dans ce plan.

---

### Task 2 : Logique pure du fil — `lib/chat-thread.ts` (TDD)

**Files:**
- Create: `lib/chat-thread.ts`
- Test: `lib/chat-thread.test.ts`

- [ ] **Step 1 : Écrire les tests (échec attendu)**

```ts
import { describe, it, expect } from "vitest";
import {
  rowsToThread,
  appendMessage,
  settleProposal,
  type AiMessageRow,
  type ChatMessage,
} from "./chat-thread";

const row = (over: Partial<AiMessageRow>): AiMessageRow => ({
  id: "r1",
  role: "user",
  kind: "text",
  payload: {},
  created_at: "2026-06-05T10:00:00Z",
  ...over,
});

describe("rowsToThread", () => {
  it("mappe un message utilisateur avec ses chips", () => {
    const t = rowsToThread([
      row({
        id: "u1",
        role: "user",
        kind: "text",
        payload: { message: "Boutons dorés", targetLabel: "bouton « Réserver »", effectName: "Halo" },
      }),
    ]);
    expect(t).toEqual([
      { id: "u1", role: "user", text: "Boutons dorés", targetLabel: "bouton « Réserver »", effectName: "Halo" },
    ]);
  });

  it("proposition suivie d'un commit → accepted, le commit est consommé", () => {
    const t = rowsToThread([
      row({ id: "p1", role: "assistant", kind: "proposal", payload: { action: "css", explanation: "Doré." } }),
      row({ id: "c1", role: "assistant", kind: "commit", payload: { action: "css" } }),
    ]);
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ id: "p1", kind: "proposal", action: "css", status: "accepted" });
  });

  it("proposition sans commit → expired (l'aperçu live n'existe plus après reload)", () => {
    const t = rowsToThread([
      row({ id: "p1", role: "assistant", kind: "proposal", payload: { action: "component", explanation: "Intégré." } }),
    ]);
    expect(t[0]).toMatchObject({ status: "expired", action: "component" });
  });

  it("un commit règle la proposition non réglée la plus récente", () => {
    const t = rowsToThread([
      row({ id: "p1", role: "assistant", kind: "proposal", payload: { action: "css", explanation: "A" } }),
      row({ id: "p2", role: "assistant", kind: "proposal", payload: { action: "css", explanation: "B" } }),
      row({ id: "c1", role: "assistant", kind: "commit", payload: { action: "css" } }),
    ]);
    expect(t).toHaveLength(2);
    expect(t[0]).toMatchObject({ id: "p1", status: "expired" });
    expect(t[1]).toMatchObject({ id: "p2", status: "accepted" });
  });

  it("payload.error → message d'erreur assistant", () => {
    const t = rowsToThread([
      row({ id: "e1", role: "assistant", kind: "text", payload: { error: "Demande trop large." } }),
    ]);
    expect(t[0]).toEqual({
      id: "e1",
      role: "assistant",
      kind: "text",
      text: "Demande trop large.",
      isError: true,
    });
  });
});

describe("appendMessage", () => {
  const active: ChatMessage = {
    id: "p1",
    role: "assistant",
    kind: "proposal",
    action: "css",
    explanation: "A",
    status: "active",
  };

  it("expire la proposition active quand une nouvelle proposition arrive", () => {
    const next = appendMessage([active], {
      id: "p2",
      role: "assistant",
      kind: "proposal",
      action: "css",
      explanation: "B",
      status: "active",
    });
    expect(next[0]).toMatchObject({ id: "p1", status: "expired" });
    expect(next[1]).toMatchObject({ id: "p2", status: "active" });
  });

  it("n'altère pas le fil pour un message simple", () => {
    const next = appendMessage([active], { id: "u1", role: "user", text: "ok" });
    expect(next[0]).toMatchObject({ id: "p1", status: "active" });
    expect(next).toHaveLength(2);
  });
});

describe("settleProposal", () => {
  it("règle la proposition visée par id", () => {
    const thread: ChatMessage[] = [
      { id: "p1", role: "assistant", kind: "proposal", action: "css", explanation: "A", status: "active" },
    ];
    expect(settleProposal(thread, "p1", "accepted")[0]).toMatchObject({ status: "accepted" });
    expect(settleProposal(thread, "p1", "expired")[0]).toMatchObject({ status: "expired" });
    expect(settleProposal(thread, "autre", "accepted")[0]).toMatchObject({ status: "active" });
  });
});
```

- [ ] **Step 2 : Vérifier l'échec**

Run : `npm test -- chat-thread`
Attendu : FAIL — `Cannot find module './chat-thread'` (ou équivalent).

- [ ] **Step 3 : Implémenter `lib/chat-thread.ts`**

```ts
/** Fil de conversation IA de l'éditeur — logique PURE (testée), aucune dépendance. */

export type AiMessageRow = {
  id: string;
  role: "user" | "assistant";
  kind: "text" | "proposal" | "commit";
  payload: Record<string, unknown>;
  created_at: string;
};

export type ProposalStatus = "active" | "expired" | "accepted";

export type ChatMessage =
  | { id: string; role: "user"; text: string; targetLabel?: string; effectName?: string }
  | { id: string; role: "assistant"; kind: "text"; text: string; isError?: boolean }
  | {
      id: string;
      role: "assistant";
      kind: "proposal";
      action: "css" | "component";
      explanation: string;
      status: ProposalStatus;
    };

const str = (v: unknown): string => (typeof v === "string" ? v : "");

/**
 * Historique DB → fil affichable. Un commit règle la proposition précédente la
 * plus récente non réglée (→ accepted) et n'apparaît pas lui-même dans le fil.
 * Toute proposition restée sans commit est « expired » : après rechargement,
 * l'aperçu live (CSS injecté / composant éphémère) n'existe plus.
 */
export function rowsToThread(rows: AiMessageRow[]): ChatMessage[] {
  const out: ChatMessage[] = [];
  const open: number[] = []; // index (dans out) des propositions non réglées
  for (const r of rows) {
    if (r.role === "user") {
      const targetLabel = str(r.payload.targetLabel);
      const effectName = str(r.payload.effectName);
      out.push({
        id: r.id,
        role: "user",
        text: str(r.payload.message),
        ...(targetLabel ? { targetLabel } : {}),
        ...(effectName ? { effectName } : {}),
      });
    } else if (r.kind === "proposal") {
      open.push(out.length);
      out.push({
        id: r.id,
        role: "assistant",
        kind: "proposal",
        action: r.payload.action === "component" ? "component" : "css",
        explanation: str(r.payload.explanation),
        status: "expired",
      });
    } else if (r.kind === "commit") {
      const idx = open.pop();
      if (idx !== undefined) {
        const p = out[idx];
        if (p.role === "assistant" && p.kind === "proposal") p.status = "accepted";
      }
    } else {
      const error = str(r.payload.error);
      out.push({
        id: r.id,
        role: "assistant",
        kind: "text",
        text: error || str(r.payload.text),
        ...(error ? { isError: true } : {}),
      });
    }
  }
  return out;
}

/** Ajoute un message ; si c'est une proposition, l'ancienne proposition active expire. */
export function appendMessage(thread: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  const base =
    msg.role === "assistant" && msg.kind === "proposal"
      ? thread.map((m) =>
          m.role === "assistant" && m.kind === "proposal" && m.status === "active"
            ? { ...m, status: "expired" as const }
            : m,
        )
      : thread;
  return [...base, msg];
}

/** Règle (accepte / expire) la proposition identifiée. */
export function settleProposal(
  thread: ChatMessage[],
  id: string,
  status: "accepted" | "expired",
): ChatMessage[] {
  return thread.map((m) =>
    m.role === "assistant" && m.kind === "proposal" && m.id === id ? { ...m, status } : m,
  );
}
```

- [ ] **Step 4 : Vérifier le succès**

Run : `npm test -- chat-thread`
Attendu : PASS (10 tests).

- [ ] **Step 5 : Commit**

```bash
git add lib/chat-thread.ts lib/chat-thread.test.ts
git commit -m "feat(editor): logique pure du fil de chat IA (rowsToThread/append/settle) + tests"
```

---

### Task 3 : Helpers serveur — `lib/ai-history.ts`

**Files:**
- Create: `lib/ai-history.ts`

- [ ] **Step 1 : Écrire le module**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiMessageRow } from "./chat-thread";

/** Journalise un message du fil IA. Best-effort : ne casse jamais la requête appelante. */
export async function logAiMessage(
  admin: SupabaseClient,
  siteId: string,
  userId: string,
  role: AiMessageRow["role"],
  kind: AiMessageRow["kind"],
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await admin
      .from("ai_messages")
      .insert({ site_id: siteId, user_id: userId, role, kind, payload });
  } catch {
    // best-effort : l'échec de journalisation ne doit pas faire échouer l'édition
  }
}

/** Les `limit` derniers messages du site, renvoyés du plus ancien au plus récent. */
export async function listAiMessages(
  admin: SupabaseClient,
  siteId: string,
  limit = 50,
): Promise<AiMessageRow[]> {
  const { data } = await admin
    .from("ai_messages")
    .select("id, role, kind, payload, created_at")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as AiMessageRow[]).reverse();
}
```

- [ ] **Step 2 : Typecheck + commit**

Run : `npx tsc --noEmit` → attendu : 0 erreur.

```bash
git add lib/ai-history.ts
git commit -m "feat(editor): helpers serveur ai_messages (log best-effort + listing)"
```

---

### Task 4 : Journalisation dans `/api/site/ai`

**Files:**
- Modify: `app/api/site/ai/route.ts`

- [ ] **Step 1 : Ajouter l'import**

En haut du fichier, avec les autres imports `@/lib` :

```ts
import { logAiMessage } from "@/lib/ai-history";
```

- [ ] **Step 2 : Journaliser la demande utilisateur**

Juste APRÈS le bloc de vérification d'ownership (`if (!site || site.owner_user_id !== user.id) { … 403 }`), insérer :

```ts
  // Journalise la demande dans le fil persistant de l'éditeur.
  await logAiMessage(admin, siteId, user.id, "user", "text", {
    message,
    ...(typeof target?.label === "string" && target.label ? { targetLabel: target.label } : {}),
    ...(effectId ? { effectId, effectName: getEffect(effectId)?.name ?? "Composant" } : {}),
  });
```

(`getEffect` est déjà importé dans ce fichier.)

- [ ] **Step 3 : Journaliser les réponses du mode composant**

Dans la branche `if (effectId) { … }` :

a) Le `catch` de `proposeComponentIntegration` devient :

```ts
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur IA.";
      await logAiMessage(admin, siteId, user.id, "assistant", "text", { error: msg });
      return NextResponse.json({ error: msg }, { status: 502 });
    }
```

b) Le retour `unsupported` devient :

```ts
    if (proposal.action !== "component") {
      await logAiMessage(admin, siteId, user.id, "assistant", "text", {
        error: proposal.reason ?? "Demande non prise en charge.",
      });
      return NextResponse.json({ ok: false, action: "unsupported", reason: proposal.reason });
    }
```

c) Avant le `return NextResponse.json({ ok: true, action: "component", … })` final de la branche, insérer :

```ts
    await logAiMessage(admin, siteId, user.id, "assistant", "proposal", {
      action: "component",
      explanation: proposal.explanation,
      component: componentDraft,
    });
```

- [ ] **Step 4 : Journaliser les réponses du mode CSS**

a) Le `catch` de `proposeDesignEdit` devient :

```ts
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur IA.";
    await logAiMessage(admin, siteId, user.id, "assistant", "text", { error: msg });
    return NextResponse.json({ error: msg }, { status: 502 });
  }
```

b) Le retour `unsupported` (action !== "css") devient :

```ts
  if (proposal.action !== "css") {
    await logAiMessage(admin, siteId, user.id, "assistant", "text", {
      error: proposal.reason ?? "Demande non prise en charge.",
    });
    return NextResponse.json({ ok: false, action: "unsupported", reason: proposal.reason });
  }
```

c) Le retour « CSS non valide » devient :

```ts
  if (!clean.ok) {
    await logAiMessage(admin, siteId, user.id, "assistant", "text", {
      error: "L'IA a produit un CSS non valide — réessayez.",
    });
    return NextResponse.json({
      ok: false,
      action: "unsupported",
      reason: "L'IA a produit un CSS non valide — réessayez.",
    });
  }
```

d) Avant le `return NextResponse.json({ ok: true, action: "css", … })` final, insérer :

```ts
  await logAiMessage(admin, siteId, user.id, "assistant", "proposal", {
    action: "css",
    explanation: proposal.explanation,
    css: clean.css,
  });
```

- [ ] **Step 5 : Typecheck + commit**

Run : `npx tsc --noEmit` → 0 erreur. `npm run lint` → 0 erreur.

```bash
git add app/api/site/ai/route.ts
git commit -m "feat(editor): /api/site/ai journalise demandes et propositions dans ai_messages"
```

---

### Task 5 : Journalisation dans `/api/site/ai/commit`

**Files:**
- Modify: `app/api/site/ai/commit/route.ts`

- [ ] **Step 1 : Ajouter l'import**

```ts
import { logAiMessage } from "@/lib/ai-history";
```

- [ ] **Step 2 : Mode composant — journaliser l'acceptation**

Dans la branche composant, juste avant le `return NextResponse.json({ ok: true, version, balance, free: true, … })`, insérer :

```ts
    await logAiMessage(admin, siteId, user.id, "assistant", "commit", { action: "component" });
```

- [ ] **Step 3 : Mode CSS — journaliser l'acceptation**

Juste avant le `return NextResponse.json({ ok: true, version, balance: newBalance, … })` final, insérer :

```ts
  await logAiMessage(admin, siteId, user.id, "assistant", "commit", { action: "css" });
```

- [ ] **Step 4 : Typecheck + commit**

Run : `npx tsc --noEmit` → 0 erreur.

```bash
git add app/api/site/ai/commit/route.ts
git commit -m "feat(editor): le commit IA journalise l'acceptation (kind commit)"
```

---

### Task 6 : Extraction de `TextPanel` et `PhotoPicker`

**Files:**
- Create: `app/editor/components/TextPanel.tsx`
- Create: `app/editor/components/PhotoPicker.tsx`

(Le branchement dans `EditorClient` se fait en Task 10 — ici on crée seulement les composants, le code est repris à l'identique des modales actuelles d'`EditorClient.tsx`.)

- [ ] **Step 1 : Créer `TextPanel.tsx`**

```tsx
"use client";

import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";

export type Panel = {
  path: string;
  label: string;
  type: string;
  maxLen: number | null;
  value: string;
};

type Props = {
  panel: Panel;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

/** Modale d'édition de texte « composé » (champ non-feuille du runtime). */
export default function TextPanel({ panel, onChange, onCancel, onSave }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-night/30 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-[20px] bg-white p-6 shadow-cloud-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 font-archivo text-lg font-semibold text-night">Modifier le texte</h3>
        <Field
          label={panel.label}
          hint={panel.maxLen ? `${panel.value.length} / ${panel.maxLen}` : undefined}
        >
          {panel.type === "text" ? (
            <Input
              autoFocus
              value={panel.value}
              maxLength={panel.maxLen ?? undefined}
              onChange={(e) => onChange(e.target.value)}
            />
          ) : (
            <Textarea
              autoFocus
              rows={4}
              value={panel.value}
              maxLength={panel.maxLen ?? undefined}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Annuler
          </Button>
          <Button size="sm" onClick={onSave}>
            Appliquer
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2 : Créer `PhotoPicker.tsx`**

```tsx
"use client";

import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export type LibPhoto = { path: string; url: string; name: string };

type Props = {
  photos: LibPhoto[] | null; // null = chargement en cours
  onUpload: () => void;
  onPick: (url: string) => void;
  onClose: () => void;
};

/** Choix d'une photo : téléverser ou piocher dans la bibliothèque du site. */
export default function PhotoPicker({ photos, onUpload, onPick, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-night/30 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-[20px] bg-white p-6 shadow-cloud-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-archivo text-lg font-semibold text-night">Changer la photo</h3>
          <Button size="sm" onClick={onUpload}>
            Téléverser une photo
          </Button>
        </div>
        <p className="mb-3 text-sm text-slate">Ou choisissez dans votre bibliothèque :</p>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {photos === null ? (
            <div className="grid place-items-center py-10 text-mist">
              <Spinner size={22} />
            </div>
          ) : photos.length === 0 ? (
            <p className="py-10 text-center text-sm text-mist">
              Votre bibliothèque est vide. Téléversez une première photo.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((ph) => (
                <button
                  key={ph.path}
                  type="button"
                  onClick={() => onPick(ph.url)}
                  className="overflow-hidden rounded-xl border border-sky-300 transition hover:ring-2 hover:ring-brand"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ph.url}
                    alt={ph.name}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3 : Typecheck + commit**

Run : `npx tsc --noEmit` → 0 erreur (les composants ne sont pas encore consommés, c'est normal).

```bash
git add app/editor/components/TextPanel.tsx app/editor/components/PhotoPicker.tsx
git commit -m "refactor(editor): extrait TextPanel et PhotoPicker en composants dédiés"
```

---

### Task 7 : `PreviewFrame` (cadre appareil + dock ✎/⌖)

**Files:**
- Create: `app/editor/components/PreviewFrame.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
"use client";

import type { RefObject } from "react";
import { IconEdit, IconPin, IconStar4 } from "@/components/ui/icons";

export type Device = "desktop" | "tablet" | "mobile";

export const DEVICE_WIDTH: Record<Device, string> = {
  desktop: "100%",
  tablet: "834px",
  mobile: "390px",
};

type Props = {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  initialSrc: string;
  device: Device;
  tool: "edit" | "note";
  integratingName: string | null;
  showEditHint: boolean;
  onSwitchTool: (t: "edit" | "note") => void;
};

/**
 * Cadre « appareil » de l'aperçu : iframe du site, bandeaux d'aide selon le
 * mode, et dock flottant ✎ Modifier / ⌖ Cibler (déplacé depuis le bas de page).
 * Nécessite <GlassFilter /> monté une fois dans la page (filtre #radio-glass).
 */
export default function PreviewFrame({
  iframeRef,
  initialSrc,
  device,
  tool,
  integratingName,
  showEditHint,
  onSwitchTool,
}: Props) {
  return (
    <div
      className="relative h-full overflow-hidden rounded-[20px] border border-white/60 bg-white shadow-cloud transition-[width,max-width] duration-300 ease-out"
      style={{ width: DEVICE_WIDTH[device], maxWidth: "100%" }}
    >
      <iframe
        ref={iframeRef}
        src={initialSrc}
        title="Éditeur de votre site"
        className="h-full w-full border-0"
      />

      {tool === "note" && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-20 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-night/85 px-4 py-2 text-sm text-white shadow-cloud">
          {integratingName ? (
            <>
              <IconStar4 size={14} className="text-[#d8b4fe]" /> Choisissez la section où intégrer
              «&nbsp;{integratingName}&nbsp;»
            </>
          ) : (
            <>
              <IconPin size={14} /> Touchez l&apos;endroit dont vous voulez parler à l&apos;IA
            </>
          )}
        </div>
      )}
      {tool === "edit" && showEditHint && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full bg-night/85 px-4 py-2 text-sm text-white shadow-cloud">
          Touchez un texte ou une photo pour le modifier
        </div>
      )}

      {/* Dock ✎ / ⌖ — flottant en bas de l'aperçu (liquid glass) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-4">
        <div className="gem-dock pointer-events-auto" style={{ width: "min(320px, 100%)" }}>
          <div className="gem-distort" style={{ filter: 'url("#radio-glass")' }} aria-hidden />
          <span
            className="gem-thumb"
            aria-hidden
            style={{ left: tool === "note" ? "50%" : "4px", width: "calc(50% - 4px)" }}
          />
          <button type="button" data-on={tool === "edit"} onClick={() => onSwitchTool("edit")}>
            <IconEdit size={16} style={{ color: tool === "edit" ? "#2563eb" : undefined }} />
            Modifier
          </button>
          <button type="button" data-on={tool === "note"} onClick={() => onSwitchTool("note")}>
            <IconPin size={16} style={{ color: tool === "note" ? "#9b72cb" : undefined }} />
            <span className={tool === "note" ? "gem-text" : undefined}>Cibler</span>
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2 : Typecheck + commit**

Run : `npx tsc --noEmit` → 0 erreur.

```bash
git add app/editor/components/PreviewFrame.tsx
git commit -m "feat(editor): PreviewFrame — cadre appareil + dock Modifier/Cibler flottant"
```

---

### Task 8 : `GalleryPopover` + `ChatMessage`

**Files:**
- Create: `app/editor/components/GalleryPopover.tsx`
- Create: `app/editor/components/ChatMessage.tsx`

- [ ] **Step 1 : Créer `GalleryPopover.tsx`**

```tsx
"use client";

import { IconStar4 } from "@/components/ui/icons";
import type { OwnedEffect } from "../EditorClient";

type Props = {
  effects: OwnedEffect[];
  onPick: (fx: OwnedEffect) => void;
  onClose: () => void;
};

/** Galerie visuelle des effets POSSÉDÉS (boutique Formules), ancrée au-dessus du composer. */
export default function GalleryPopover({ effects, onPick, onClose }: Props) {
  return (
    <div className="absolute inset-x-3 bottom-full z-30 mb-2 rounded-2xl border border-white/70 bg-white/95 p-3 shadow-cloud-lg backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-night">Mes composants</p>
        <button type="button" className="text-xs text-slate underline" onClick={onClose}>
          Fermer
        </button>
      </div>
      {effects.length === 0 ? (
        <a
          className="block rounded-xl border border-dashed border-sky-300 p-4 text-center text-sm text-slate"
          href="/dashboard/marketplace"
        >
          Débloquez des effets dans <b>Formules</b> →
        </a>
      ) : (
        <>
          <div className="grid max-h-[40vh] grid-cols-2 gap-2 overflow-y-auto">
            {effects.map((fx) => (
              <button
                key={fx.id}
                type="button"
                disabled={!fx.compatible}
                className="rounded-xl border border-white/70 bg-white p-2 text-left shadow-cloud transition hover:ring-2 hover:ring-brand disabled:opacity-50 disabled:hover:ring-0"
                title={
                  fx.compatible
                    ? `Intégrer « ${fx.name} »`
                    : "Indisponible sur votre template actuel"
                }
                onClick={() => onPick(fx)}
              >
                <span
                  className="block h-10 w-full rounded-lg"
                  style={{
                    background: `linear-gradient(120deg, ${fx.accentFrom}, ${fx.accentTo})`,
                  }}
                />
                <span className="mt-1.5 flex items-center gap-1 text-[12.5px] font-medium text-night">
                  <IconStar4 size={12} className="text-[#9b72cb]" /> {fx.name}
                  {!fx.compatible && (
                    <em className="ml-auto text-[10px] not-italic text-mist">bientôt</em>
                  )}
                </span>
              </button>
            ))}
          </div>
          <a
            href="/dashboard/marketplace"
            className="mt-2 block text-center text-[12px] text-slate underline"
          >
            Débloquer plus d&apos;effets → Formules
          </a>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2 : Créer `ChatMessage.tsx`**

```tsx
"use client";

import { Spinner } from "@/components/ui/Spinner";
import { IconCheck, IconPin, IconStar4 } from "@/components/ui/icons";
import type { ChatMessage as Msg } from "@/lib/chat-thread";

type Props = {
  msg: Msg;
  balance: number;
  aiLoading: boolean;
  onAccept: () => void;
  onRefine: () => void;
  onCancel: () => void;
};

/** Une entrée du fil : bulle utilisateur, bulle IA, ou carte de proposition. */
export default function ChatMessage({
  msg,
  balance,
  aiLoading,
  onAccept,
  onRefine,
  onCancel,
}: Props) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#2563eb] px-3.5 py-2.5 text-[13.5px] leading-snug text-white shadow-cloud">
          {(msg.targetLabel || msg.effectName) && (
            <p className="mb-1 flex flex-wrap gap-1">
              {msg.targetLabel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
                  <IconPin size={10} /> {msg.targetLabel}
                </span>
              )}
              {msg.effectName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
                  <IconStar4 size={10} /> {msg.effectName}
                </span>
              )}
            </p>
          )}
          {msg.text}
        </div>
      </div>
    );
  }

  if (msg.kind === "text") {
    return (
      <div className="flex justify-start">
        <div
          className={`max-w-[85%] rounded-2xl rounded-bl-md border px-3.5 py-2.5 text-[13.5px] leading-snug shadow-cloud ${
            msg.isError
              ? "border-red-200 bg-red-50 text-[#c0392b]"
              : "border-white/70 bg-white/85 text-night"
          }`}
        >
          {msg.text}
        </div>
      </div>
    );
  }

  // Carte de proposition (aperçu déjà appliqué sur l'iframe quand status === "active")
  return (
    <div className="sgai-card w-full" style={{ padding: "12px 14px" }}>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="sgai-badge flex-none">✦ Aperçu</span>
        {msg.status === "accepted" && (
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-success">
            <IconCheck size={13} /> Appliquée
          </span>
        )}
        {msg.status === "expired" && (
          <span className="text-[12px] text-mist">Proposition expirée</span>
        )}
      </div>
      <p className="text-[13px] leading-snug sgai-soft">{msg.explanation}</p>
      {msg.status === "active" && (
        <>
          <div className="mt-2 flex items-center justify-end gap-1.5">
            <button className="sgai-cancel text-sm" onClick={onCancel}>
              Annuler
            </button>
            <button className="sgai-ghost text-sm" onClick={onRefine}>
              Affiner
            </button>
            <button
              className="sgai-primary flex items-center gap-1.5 text-sm"
              disabled={(msg.action === "css" && balance < 1) || aiLoading}
              onClick={onAccept}
            >
              {aiLoading && <Spinner size={14} />}
              Accepter{" "}
              <span className="rounded-lg bg-white/25 px-1.5 py-0.5 text-[11px] font-extrabold">
                {msg.action === "component" ? "Inclus" : "1 ✦"}
              </span>
            </button>
          </div>
          {msg.action === "css" && balance < 1 && (
            <p className="mt-1.5 text-[12px] text-[#c0392b]">
              Solde insuffisant —{" "}
              <a className="underline" href="/dashboard/credits">
                achetez des étoiles
              </a>
              .
            </p>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3 : Typecheck + commit**

Run : `npx tsc --noEmit` → 0 erreur.

```bash
git add app/editor/components/GalleryPopover.tsx app/editor/components/ChatMessage.tsx
git commit -m "feat(editor): GalleryPopover (effets possédés) + ChatMessage (bulles et propositions)"
```

---

### Task 9 : `ChatPanel` (fil + composer + chips)

**Files:**
- Create: `app/editor/components/ChatPanel.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { IconArrowUp, IconClose, IconMic, IconPin, IconStar4 } from "@/components/ui/icons";
import type { useDictation } from "@/lib/use-dictation";
import type { ChatMessage as Msg } from "@/lib/chat-thread";
import type { PinSelector } from "@/lib/notes-selector";
import ChatMessage from "./ChatMessage";
import GalleryPopover from "./GalleryPopover";
import type { OwnedEffect } from "../EditorClient";

export type Composer = {
  text: string;
  target: PinSelector | null;
  effect: OwnedEffect | null;
};

type Props = {
  messages: Msg[];
  composer: Composer;
  selecting: boolean; // tool === "note"
  aiLoading: boolean;
  balance: number;
  galleryOpen: boolean;
  ownedEffects: OwnedEffect[];
  dictation: ReturnType<typeof useDictation>;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onText: (t: string) => void;
  onSend: () => void;
  onToggleSelect: () => void;
  onRemoveTarget: () => void;
  onRemoveEffect: () => void;
  onToggleGallery: () => void;
  onPickEffect: (fx: OwnedEffect) => void;
  onAccept: () => void;
  onRefine: () => void;
  onCancelProposal: () => void;
  onRetry: () => void;
};

/** Colonne de chat façon Lovable : fil de messages + composer (chips cible/effet, galerie, dictée). */
export default function ChatPanel({
  messages,
  composer,
  selecting,
  aiLoading,
  balance,
  galleryOpen,
  ownedEffects,
  dictation,
  inputRef,
  onText,
  onSend,
  onToggleSelect,
  onRemoveTarget,
  onRemoveEffect,
  onToggleGallery,
  onPickEffect,
  onAccept,
  onRefine,
  onCancelProposal,
  onRetry,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  // Défilement automatique vers le bas à chaque nouveau message / état de chargement.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, aiLoading]);

  // Autosize du textarea (façon ChatGPT), plafonné.
  const resize = useCallback(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [inputRef]);
  useEffect(() => {
    resize();
  }, [composer.text, resize]);

  const lastIndex = messages.length - 1;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Fil */}
      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {messages.length === 0 && (
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4 text-[13.5px] leading-relaxed text-slate">
            <p className="mb-1 font-archivo text-[15px] font-bold text-night">✦ Votre assistant</p>
            Décrivez une modification (« passe les boutons en doré »), ciblez un endroit précis
            avec <b>⌖ Cibler</b>, ou intégrez un composant avec <b>✦</b>.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={m.id}>
            <ChatMessage
              msg={m}
              balance={balance}
              aiLoading={aiLoading}
              onAccept={onAccept}
              onRefine={onRefine}
              onCancel={onCancelProposal}
            />
            {m.role === "assistant" && m.kind === "text" && m.isError && i === lastIndex && (
              <button
                type="button"
                className="mt-1 text-[12px] text-slate underline"
                onClick={onRetry}
              >
                ↻ Réessayer
              </button>
            )}
          </div>
        ))}
        {aiLoading && (
          <div className="flex items-center gap-2 px-1 text-[13px] text-mist">
            <Spinner size={14} /> Génération en cours…
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="relative flex-none px-3 pb-3">
        {galleryOpen && (
          <GalleryPopover effects={ownedEffects} onPick={onPickEffect} onClose={onToggleGallery} />
        )}
        <div className="sgai-promptbox">
          {(composer.target || composer.effect) && (
            <div className="sgai-chiprow">
              {composer.target && (
                <span
                  className="sgai-chip"
                  style={{ background: "linear-gradient(120deg, #2563eb, #60a5fa)" }}
                >
                  <IconPin size={12} /> {composer.target.label || "Élément ciblé"}
                  <button type="button" aria-label="Retirer la cible" onClick={onRemoveTarget}>
                    <IconClose size={11} />
                  </button>
                </span>
              )}
              {composer.effect && (
                <span
                  className="sgai-chip"
                  style={{
                    background: `linear-gradient(120deg, ${composer.effect.accentFrom}, ${composer.effect.accentTo})`,
                  }}
                >
                  <IconStar4 size={12} /> {composer.effect.name}
                  <button type="button" aria-label="Retirer le composant" onClick={onRemoveEffect}>
                    <IconClose size={11} />
                  </button>
                </span>
              )}
            </div>
          )}
          <textarea
            ref={inputRef}
            rows={1}
            className="sgai-input"
            value={composer.text}
            placeholder={
              dictation.listening
                ? "À l'écoute…"
                : composer.effect
                  ? "Précisez l'intégration (optionnel)…"
                  : "Décrivez le changement…"
            }
            onChange={(e) => onText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && composer.text.trim()) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <div className="sgai-promptbar">
            <button
              type="button"
              className={`sgai-fxbtn${selecting ? " is-on" : ""}`}
              onClick={onToggleSelect}
              aria-pressed={selecting}
              aria-label="Cibler un endroit sur l'aperçu"
              title="Cibler un endroit sur l'aperçu"
            >
              <IconPin size={17} />
            </button>
            <button
              type="button"
              className={`sgai-fxbtn${composer.effect ? " is-on" : ""}`}
              onClick={onToggleGallery}
              aria-expanded={galleryOpen}
              aria-label="Mes composants"
              title="Mes composants (animations achetées)"
            >
              <IconStar4 size={17} />
            </button>
            {dictation.supported && (
              <button
                type="button"
                className={`sgai-mic${dictation.listening ? " is-on" : ""}`}
                onClick={dictation.toggle}
                aria-pressed={dictation.listening}
                aria-label={dictation.listening ? "Arrêter la dictée" : "Dicter"}
                title={dictation.listening ? "Arrêter la dictée" : "Dicter"}
              >
                <IconMic size={18} />
              </button>
            )}
            <button
              type="button"
              className="sgai-send ml-auto"
              onClick={onSend}
              disabled={!composer.text.trim() || aiLoading}
              aria-label="Envoyer"
              title="Envoyer"
            >
              <IconArrowUp size={18} />
            </button>
          </div>
        </div>
        <span className="sr-only" aria-live="polite">
          {dictation.listening ? "Dictée en cours, parlez maintenant." : ""}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2 : Typecheck + commit**

Run : `npx tsc --noEmit` → 0 erreur.

```bash
git add app/editor/components/ChatPanel.tsx
git commit -m "feat(editor): ChatPanel — fil de messages + composer avec chips cible/effet"
```

---

### Task 10 : Refonte d'`EditorClient` + chargement de l'historique

**Files:**
- Modify: `app/editor/EditorClient.tsx` (remplacement complet)
- Modify: `app/editor/page.tsx`

- [ ] **Step 1 : Remplacer intégralement `EditorClient.tsx`**

Points clés du nouveau fichier (le contenu complet suit) :
- la logique existante (autosave, postMessage, photo, publication, multi-pages) est **reprise telle quelle** ;
- la modale IA et la barre de proposition flottante disparaissent au profit du fil ;
- `sg:note` attache une chip cible au composer (plus de modale) ;
- `integratingRef` est synchronisé via un `useEffect` qui re-pousse aussi le mode (scope élément/section) ;
- rendu : header existant + `aside` chat (desktop) / bottom sheet (mobile, via `matchMedia`) + `PreviewFrame`.

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GlassFilter } from "@/components/ui/liquid-radio";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  IconAlert,
  IconCheck,
  IconChevron,
  IconClose,
  IconDesktop,
  IconPhone,
  IconStar4,
  IconTablet,
} from "@/components/ui/icons";
import { getAtPath, setAtPath } from "@/lib/content-path";
import { normalizeContent, type SiteContentV2 } from "@/lib/site-content";
import { useDictation } from "@/lib/use-dictation";
import type { PinSelector } from "@/lib/notes-selector";
import {
  appendMessage,
  rowsToThread,
  settleProposal,
  type AiMessageRow,
  type ChatMessage,
} from "@/lib/chat-thread";
import ChatPanel, { type Composer } from "./components/ChatPanel";
import ChatMessageNote from "./components/ChatMessage"; // (non utilisé directement — rendu via ChatPanel)
import PreviewFrame, { type Device } from "./components/PreviewFrame";
import TextPanel, { type Panel } from "./components/TextPanel";
import PhotoPicker, { type LibPhoto } from "./components/PhotoPicker";

export type EditableField = {
  path: string;
  label: string;
  type: string;
  maxLen: number | null;
};

/** Effet acheté (boutique Formules), affiché dans la galerie composants. */
export type OwnedEffect = {
  id: string;
  name: string;
  accentFrom: string;
  accentTo: string;
  compatible: boolean;
};

/** Brouillon d'intégration renvoyé par /api/site/ai (mode composant). */
type ComponentDraft = {
  effectId: string;
  selector: string;
  position: "replace" | "before" | "after" | "inside";
  config?: Record<string, unknown>;
};

type Props = {
  siteId: string;
  slug: string | null;
  balance: number;
  hasUnpublished: boolean;
  editableFields: EditableField[];
  content: Record<string, unknown>;
  ownedEffects: OwnedEffect[];
  integrateEffectId: string | null;
  initialMessages: AiMessageRow[];
};

type SaveState = "idle" | "saving" | "saved" | "error";
type NoticeKind = "info" | "success" | "error";
type Notice = { msg: string; kind: NoticeKind; id: number } | null;
const NOTICE_MS = 4500;

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function EditorClient({
  siteId,
  balance: initialBalance,
  hasUnpublished: initialHasUnpub,
  editableFields,
  content,
  ownedEffects,
  integrateEffectId,
  initialMessages,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const contentRef = useRef<SiteContentV2>(normalizeContent(structuredClone(content)));
  const changesRef = useRef<Record<string, unknown>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeSeq = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingPhoto = useRef<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const lastRequest = useRef<{
    text: string;
    target: PinSelector | null;
    effect: OwnedEffect | null;
  } | null>(null);

  const pages = contentRef.current.pages;
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const [balance, setBalance] = useState(initialBalance);
  const [hasUnpub, setHasUnpub] = useState(initialHasUnpub);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [touched, setTouched] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [device, setDevice] = useState<Device>("desktop");

  // Mode « intégration d'un effet » : la sélection vise alors la SECTION.
  const [integrating, setIntegrating] = useState<OwnedEffect | null>(
    () => ownedEffects.find((e) => e.id === integrateEffectId) ?? null,
  );
  const integratingRef = useRef<OwnedEffect | null>(integrating);

  const [tool, setTool] = useState<"edit" | "note">(integrateEffectId ? "note" : "edit");

  // --- Fil de chat (façon Lovable) ---------------------------------------
  const [messages, setMessages] = useState<ChatMessage[]>(() => rowsToThread(initialMessages));
  const [composer, setComposer] = useState<Composer>(() => {
    const fx = ownedEffects.find((e) => e.id === integrateEffectId) ?? null;
    return {
      text: fx ? "Intègre ce composant à la place de la section désignée." : "",
      target: null,
      effect: fx,
    };
  });
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false); // bottom sheet mobile
  const [isDesktop, setIsDesktop] = useState(true);

  const [aiLoading, setAiLoading] = useState(false);
  // Proposition ACTIVE (la seule actionnable) — miroir du dernier message proposal "active".
  const [aiProposal, setAiProposal] = useState<
    | { id: string; kind: "css"; css: string; explanation: string }
    | { id: string; kind: "component"; component: ComponentDraft; explanation: string }
    | null
  >(null);

  const [photoPicker, setPhotoPicker] = useState<{ path: string } | null>(null);
  const [libPhotos, setLibPhotos] = useState<LibPhoto[] | null>(null);
  const reduce = useReducedMotion();

  // Desktop vs mobile : un SEUL ChatPanel monté (sinon le ref du composer entre en conflit).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Notifications : message typé (info / succès / erreur).
  const notify = useCallback((msg: string, kind: NoticeKind = "info") => {
    if (noticeTimer.current) {
      clearTimeout(noticeTimer.current);
      noticeTimer.current = null;
    }
    if (!msg) {
      setNotice(null);
      return;
    }
    noticeSeq.current += 1;
    setNotice({ msg, kind, id: noticeSeq.current });
    if (kind !== "info") {
      noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS);
    }
  }, []);
  useEffect(() => {
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  // Dictée vocale : le texte reconnu s'ajoute à la fin du composer.
  const dictation = useDictation((chunk) =>
    setComposer((c) => ({ ...c, text: c.text ? `${c.text} ${chunk}` : chunk })),
  );

  useEffect(() => {
    if (!dictation.error) return;
    if (dictation.error === "not-allowed" || dictation.error === "service-not-allowed") {
      notify("Micro refusé — autorisez-le dans votre navigateur pour dicter.", "error");
    } else if (dictation.error === "network") {
      notify("Dictée vocale indisponible sur ce navigateur.", "error");
    } else if (dictation.error === "audio-capture") {
      notify("Aucun micro détecté.", "error");
    }
  }, [dictation.error, notify]);

  // Échap ferme la galerie composants.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGalleryOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const specFor = useCallback(
    (path: string): EditableField | null => {
      for (const f of editableFields) {
        const re = new RegExp("^" + f.path.split("[]").map(escapeRe).join("\\[\\d+\\]") + "$");
        if (re.test(path)) return f;
      }
      return null;
    },
    [editableFields],
  );

  const flushSave = useCallback(async () => {
    if (Object.keys(changesRef.current).length === 0) return;
    setSaveState("saving");
    const snapshot = changesRef.current;
    changesRef.current = {};
    try {
      const res = await fetch("/api/site/draft", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteId, changes: snapshot, pageIndex: currentPageIndex }),
      });
      if (!res.ok) {
        changesRef.current = { ...snapshot, ...changesRef.current };
        throw new Error();
      }
      setSaveState("saved");
      setHasUnpub(true);
    } catch {
      setSaveState("error");
    }
  }, [siteId, currentPageIndex]);

  const scheduleSave = useCallback(() => {
    setTouched(true);
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void flushSave(), 800);
  }, [flushSave]);

  const recordChange = useCallback(
    (path: string, value: string) => {
      changesRef.current[path] = value;
      contentRef.current = setAtPath(contentRef.current, currentPageIndex, path, value);
      scheduleSave();
    },
    [scheduleSave, currentPageIndex],
  );

  const post = useCallback((msg: unknown) => {
    iframeRef.current?.contentWindow?.postMessage(msg, window.location.origin);
  }, []);

  const previewUrl = useCallback(
    (pageIndex: number, bust = false, component?: ComponentDraft | null) => {
      const slug = pages[pageIndex]?.slug ?? "/";
      const params = new URLSearchParams({ siteId, edit: "1" });
      if (slug && slug !== "/") params.set("path", slug);
      if (bust) params.set("t", String(Date.now()));
      if (component) params.set("previewComponent", JSON.stringify(component));
      return `/api/preview?${params.toString()}`;
    },
    [pages, siteId],
  );

  const postMode = useCallback(
    (t: "edit" | "note") => {
      post({
        type: "sg:mode",
        mode: t,
        scope: integratingRef.current ? "section" : "element",
      });
    },
    [post],
  );

  const switchTool = useCallback(
    (t: "edit" | "note") => {
      setTool(t);
      if (t === "edit") {
        setIntegrating(null); // quitter le mode intégration
        setComposer((c) => (c.effect ? { ...c, effect: null } : c));
      }
      postMode(t);
    },
    [postMode],
  );

  // Synchronise le ref + re-pousse le scope (élément vs section) à chaque
  // changement du mode intégration — postMessage est idempotent côté runtime.
  useEffect(() => {
    integratingRef.current = integrating;
    postMode(tool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integrating]);

  const changePage = useCallback(
    async (idx: number) => {
      if (idx === currentPageIndex || !pages[idx]) return;
      if (Object.keys(changesRef.current).length > 0) {
        await flushSave();
      }
      setCurrentPageIndex(idx);
      // La cible appartenait à l'ancienne page : on purge la chip.
      setComposer((c) => (c.target ? { ...c, target: null } : c));
      if (iframeRef.current) iframeRef.current.src = previewUrl(idx);
    },
    [currentPageIndex, pages, previewUrl, flushSave],
  );

  // Messages venant de l'iframe (runtime d'édition).
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const d = e.data || {};
      if (d.type === "sg:ready") {
        postMode(tool);
        return;
      }
      if (d.type === "sg:editText") {
        if (d.leaf) {
          recordChange(d.path, String(d.value ?? ""));
        } else {
          const spec = specFor(d.path);
          const cur = getAtPath(contentRef.current, currentPageIndex, d.path);
          setPanel({
            path: d.path,
            label: spec?.label ?? d.path,
            type: (d.fieldType as string) ?? spec?.type ?? "textarea",
            maxLen: spec?.maxLen ?? (typeof d.maxLen === "number" ? d.maxLen : null),
            value: typeof cur === "string" ? cur : String(d.value ?? ""),
          });
        }
      } else if (d.type === "sg:editPhoto") {
        setLibPhotos(null);
        setPhotoPicker({ path: d.path });
      } else if (d.type === "sg:note") {
        // Mode « Cibler » : le clic attache une chip cible au composer.
        const t = d.target;
        if (t && typeof t.cssSelector === "string") {
          setComposer((c) => ({
            ...c,
            target: {
              path: t.path,
              cssSelector: t.cssSelector,
              label: t.label ?? "",
              xPct: t.xPct,
              yPct: t.yPct,
            },
          }));
          setSheetOpen(true); // mobile : rouvre le chat avec la chip
          setTimeout(() => composerRef.current?.focus(), 50);
        }
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [recordChange, specFor, postMode, tool, currentPageIndex]);

  function savePanel() {
    if (!panel) return;
    const v = panel.maxLen ? panel.value.slice(0, panel.maxLen) : panel.value;
    post({ type: "sg:setValue", path: panel.path, value: v });
    recordChange(panel.path, v);
    setPanel(null);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const path = pendingPhoto.current;
    pendingPhoto.current = null;
    if (!file || !path) return;
    notify("Téléversement de la photo…", "info");
    try {
      const fd = new FormData();
      fd.set("siteId", siteId);
      fd.set("file", file);
      const res = await fetch("/api/site/photo", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        notify(json.error ?? "Échec de l'upload.", "error");
        return;
      }
      post({ type: "sg:setPhoto", path, url: json.url });
      recordChange(path, json.url);
      notify("Photo mise à jour", "success");
    } catch {
      notify("Échec de l'upload.", "error");
    }
  }

  // Charge la bibliothèque (lazy) à l'ouverture du picker.
  useEffect(() => {
    if (!photoPicker) return;
    let alive = true;
    fetch(`/api/site/photos?siteId=${encodeURIComponent(siteId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (alive) setLibPhotos(Array.isArray(j.photos) ? j.photos : []);
      })
      .catch(() => {
        if (alive) setLibPhotos([]);
      });
    return () => {
      alive = false;
    };
  }, [photoPicker, siteId]);

  function pickFromLibrary(url: string) {
    if (!photoPicker) return;
    post({ type: "sg:setPhoto", path: photoPicker.path, url });
    recordChange(photoPicker.path, url);
    notify("Photo mise à jour", "success");
    setPhotoPicker(null);
  }

  function pickUpload() {
    if (!photoPicker) return;
    pendingPhoto.current = photoPicker.path;
    setPhotoPicker(null);
    fileRef.current?.click();
  }

  /** Purge l'aperçu en cours : CSS live (style#sg-ai) ou composant éphémère (reload). */
  const clearPreview = useCallback(
    (proposal: typeof aiProposal) => {
      if (proposal?.kind === "component") {
        if (iframeRef.current) iframeRef.current.src = previewUrl(currentPageIndex, true);
      } else {
        post({ type: "sg:css", css: "" });
      }
    },
    [post, previewUrl, currentPageIndex],
  );

  // --- Actions du chat ----------------------------------------------------

  const sendRequest = useCallback(
    async (text: string, target: PinSelector | null, effect: OwnedEffect | null) => {
      setAiLoading(true);
      try {
        const res = await fetch("/api/site/ai", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            siteId,
            message: text,
            target,
            ...(effect ? { effectId: effect.id } : {}),
          }),
        });
        const json = await res.json();
        if (json.ok && json.action === "css") {
          post({ type: "sg:css", css: json.css });
          const id = crypto.randomUUID();
          const explanation = json.explanation ?? "Modification appliquée.";
          setAiProposal({ id, kind: "css", css: json.css, explanation });
          setMessages((m) =>
            appendMessage(m, {
              id,
              role: "assistant",
              kind: "proposal",
              action: "css",
              explanation,
              status: "active",
            }),
          );
        } else if (json.ok && json.action === "component" && json.componentDraft) {
          if (iframeRef.current) {
            iframeRef.current.src = previewUrl(currentPageIndex, true, json.componentDraft);
          }
          const id = crypto.randomUUID();
          const explanation = json.explanation ?? "Composant intégré.";
          setAiProposal({ id, kind: "component", component: json.componentDraft, explanation });
          setMessages((m) =>
            appendMessage(m, {
              id,
              role: "assistant",
              kind: "proposal",
              action: "component",
              explanation,
              status: "active",
            }),
          );
        } else if (json.action === "unsupported") {
          setMessages((m) =>
            appendMessage(m, {
              id: crypto.randomUUID(),
              role: "assistant",
              kind: "text",
              text: `L'IA ne peut pas le faire : ${json.reason ?? "demande trop large"}.`,
              isError: true,
            }),
          );
        } else {
          setMessages((m) =>
            appendMessage(m, {
              id: crypto.randomUUID(),
              role: "assistant",
              kind: "text",
              text: json.error ?? "Erreur de l'IA.",
              isError: true,
            }),
          );
        }
      } catch {
        setMessages((m) =>
          appendMessage(m, {
            id: crypto.randomUUID(),
            role: "assistant",
            kind: "text",
            text: "Erreur de l'IA.",
            isError: true,
          }),
        );
      }
      setAiLoading(false);
    },
    [siteId, post, previewUrl, currentPageIndex],
  );

  function askAi() {
    const text = composer.text.trim();
    if (!text || aiLoading) return;
    dictation.stop();
    setGalleryOpen(false);
    // Une nouvelle demande invalide la proposition en cours (aperçu compris).
    if (aiProposal) {
      clearPreview(aiProposal);
      setMessages((m) => settleProposal(m, aiProposal.id, "expired"));
      setAiProposal(null);
    }
    lastRequest.current = { text, target: composer.target, effect: composer.effect };
    setMessages((m) =>
      appendMessage(m, {
        id: crypto.randomUUID(),
        role: "user",
        text,
        ...(composer.target?.label ? { targetLabel: composer.target.label } : {}),
        ...(composer.effect ? { effectName: composer.effect.name } : {}),
      }),
    );
    setComposer((c) => ({ ...c, text: "" }));
    void sendRequest(text, composer.target, composer.effect);
  }

  function retryLast() {
    const r = lastRequest.current;
    if (!r || aiLoading) return;
    void sendRequest(r.text, r.target, r.effect);
  }

  function refineProposal() {
    if (!aiProposal) return;
    clearPreview(aiProposal);
    setMessages((m) => settleProposal(m, aiProposal.id, "expired"));
    setAiProposal(null);
    composerRef.current?.focus();
  }

  function cancelProposal() {
    if (!aiProposal) return;
    clearPreview(aiProposal);
    setMessages((m) => settleProposal(m, aiProposal.id, "expired"));
    setAiProposal(null);
    setComposer((c) => ({ ...c, target: null, effect: null }));
    setIntegrating(null);
  }

  async function aiCommit() {
    if (!aiProposal) return;
    dictation.stop();
    setAiLoading(true);
    try {
      const res = await fetch("/api/site/ai/commit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          aiProposal.kind === "component"
            ? { siteId, component: aiProposal.component }
            : { siteId, css: aiProposal.css },
        ),
      });
      const json = await res.json();
      if (res.status === 409) {
        notify(json.error ?? "Solde insuffisant.", "error");
      } else if (!res.ok) {
        notify(json.error ?? "Échec de la validation.", "error");
      } else {
        if (typeof json.balance === "number") setBalance(json.balance);
        if (json.published === false) setHasUnpub(true);
        const wasComponent = aiProposal.kind === "component";
        setMessages((m) => settleProposal(m, aiProposal.id, "accepted"));
        setAiProposal(null);
        setComposer((c) => ({ ...c, target: null, effect: null }));
        setIntegrating(null);
        if (tool === "note") switchTool("edit");
        notify(wasComponent ? "Composant intégré à votre site" : "Modification appliquée", "success");
        if (iframeRef.current) {
          iframeRef.current.src = previewUrl(currentPageIndex, true);
        }
      }
    } catch {
      notify("Échec de la validation.", "error");
    }
    setAiLoading(false);
  }

  function toggleSelect() {
    const next = tool === "note" ? "edit" : "note";
    switchTool(next);
    if (next === "note") setSheetOpen(false); // mobile : laisser voir l'aperçu pour cibler
  }

  function pickEffect(fx: OwnedEffect) {
    setGalleryOpen(false);
    setComposer((c) => ({
      ...c,
      effect: fx,
      text: c.text.trim() ? c.text : "Intègre ce composant à la place de la section désignée.",
    }));
    setIntegrating(fx);
    if (tool !== "note") switchTool("note");
    setSheetOpen(false); // mobile : place à l'aperçu pour choisir la section
  }

  function removeEffect() {
    setComposer((c) => ({ ...c, effect: null }));
    setIntegrating(null);
  }

  async function doPublish() {
    setConfirmPublish(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await flushSave();
    setPublishing(true);
    try {
      const res = await fetch("/api/site/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteId }),
      });
      const json = await res.json();
      if (res.status === 409) {
        notify(json.error ?? "Solde insuffisant.", "error");
      } else if (!res.ok) {
        notify(json.error ?? "Échec de la publication.", "error");
      } else {
        if (typeof json.balance === "number") setBalance(json.balance);
        setHasUnpub(false);
        changesRef.current = {};
        setSaveState("idle");
        notify("Votre site est à jour", "success");
        if (iframeRef.current) {
          iframeRef.current.src = previewUrl(currentPageIndex, true);
        }
      }
    } catch {
      notify("Échec de la publication.", "error");
    }
    setPublishing(false);
  }

  const chatPanel = (
    <ChatPanel
      messages={messages}
      composer={composer}
      selecting={tool === "note"}
      aiLoading={aiLoading}
      balance={balance}
      galleryOpen={galleryOpen}
      ownedEffects={ownedEffects}
      dictation={dictation}
      inputRef={composerRef}
      onText={(t) => setComposer((c) => ({ ...c, text: t }))}
      onSend={askAi}
      onToggleSelect={toggleSelect}
      onRemoveTarget={() => setComposer((c) => ({ ...c, target: null }))}
      onRemoveEffect={removeEffect}
      onToggleGallery={() => setGalleryOpen((v) => !v)}
      onPickEffect={pickEffect}
      onAccept={() => void aiCommit()}
      onRefine={refineProposal}
      onCancelProposal={cancelProposal}
      onRetry={retryLast}
    />
  );

  return (
    <div className="cloud-bg relative flex h-[100dvh] flex-col">
      {/* Barre du haut — minimale */}
      <header className="z-20 flex flex-none items-center justify-between gap-2 px-3 py-2.5 md:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <Button href="/dashboard" variant="ghost" size="sm">
            <span className="inline-flex rotate-180">
              <IconChevron size={16} />
            </span>
            <span className="hidden sm:inline">Quitter</span>
          </Button>

          {pages.length > 1 && (
            <label className="flex min-w-0 items-center">
              <span className="sr-only">Page à modifier</span>
              <select
                className="max-w-[44vw] truncate rounded-lg border border-white/60 bg-white/80 px-2.5 py-1.5 text-sm font-medium text-night shadow-cloud outline-none focus:border-[#2563eb] sm:max-w-[220px]"
                value={currentPageIndex}
                onChange={(e) => void changePage(Number(e.target.value))}
                aria-label="Page à modifier"
              >
                {pages.map((p, i) => (
                  <option key={p.slug ?? i} value={i}>
                    {p.title ?? p.slug}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {/* Aperçu responsive */}
        <div className="gem-dev hidden sm:flex" role="group" aria-label="Aperçu responsive">
          <button type="button" aria-label="Ordinateur" data-on={device === "desktop"} onClick={() => setDevice("desktop")}>
            <IconDesktop size={17} />
          </button>
          <button type="button" aria-label="Tablette" data-on={device === "tablet"} onClick={() => setDevice("tablet")}>
            <IconTablet size={17} />
          </button>
          <button type="button" aria-label="Téléphone" data-on={device === "mobile"} onClick={() => setDevice("mobile")}>
            <IconPhone size={17} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {saveState === "saving" && (
            <span className="hidden items-center text-mist sm:inline-flex" title="Enregistrement…">
              <Spinner size={13} />
            </span>
          )}
          {saveState === "saved" && (
            <span className="hidden items-center text-success sm:inline-flex" title="Enregistré">
              <IconCheck size={14} />
            </span>
          )}
          <span className="gem-stars" title={`${balance} crédits disponibles`}>
            <IconStar4 size={14} className="text-[#9b72cb]" /> {balance}
          </span>
          <Button
            size="sm"
            loading={publishing}
            disabled={!hasUnpub || publishing}
            onClick={() => setConfirmPublish(true)}
          >
            Publier
          </Button>
        </div>
      </header>

      {/* Corps : chat à gauche (desktop) + aperçu à droite */}
      <div className="flex min-h-0 flex-1">
        {isDesktop && (
          <aside className="flex min-h-0 w-[400px] flex-none flex-col">{chatPanel}</aside>
        )}
        <main className="relative flex min-h-0 flex-1 items-stretch justify-center overflow-hidden px-2 pb-3 md:px-4">
          <PreviewFrame
            iframeRef={iframeRef}
            initialSrc={previewUrl(0)}
            device={device}
            tool={tool}
            integratingName={integrating?.name ?? null}
            showEditHint={!touched && !panel}
            onSwitchTool={switchTool}
          />
        </main>
      </div>

      {/* Mobile : bulle d'ouverture + bottom sheet */}
      {!isDesktop && (
        <>
          {!sheetOpen && (
            <button
              type="button"
              className="fixed bottom-4 right-4 z-30 grid h-12 w-12 place-items-center rounded-full bg-night text-white shadow-cloud-lg"
              onClick={() => setSheetOpen(true)}
              aria-label="Ouvrir l'assistant"
            >
              <IconStar4 size={20} />
            </button>
          )}
          <div
            className={`fixed inset-x-0 bottom-0 z-40 flex h-[62dvh] flex-col rounded-t-[24px] border-t border-white/70 bg-white/95 shadow-cloud-lg backdrop-blur transition-transform duration-300 ${
              sheetOpen ? "translate-y-0" : "translate-y-full"
            }`}
            role="dialog"
            aria-label="Assistant IA"
          >
            <button
              type="button"
              className="mx-auto mt-2 h-1.5 w-12 flex-none rounded-full bg-night/15"
              onClick={() => setSheetOpen(false)}
              aria-label="Fermer l'assistant"
            />
            <div className="min-h-0 flex-1">{chatPanel}</div>
          </div>
        </>
      )}

      <GlassFilter />

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFile}
      />

      {/* Notifications — au-dessus de tout */}
      <AnimatePresence>
        {notice && (
          <motion.div
            key="notice"
            className="pointer-events-none fixed inset-x-0 top-16 z-[100] flex justify-center px-3"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 460, damping: 32 }}
          >
            <div
              className={`sg-toast sg-toast--${notice.kind} pointer-events-auto`}
              role={notice.kind === "error" ? "alert" : "status"}
              aria-live={notice.kind === "error" ? "assertive" : "polite"}
            >
              <span className="sg-toast__icon" aria-hidden>
                {notice.kind === "success" ? (
                  <IconCheck size={16} />
                ) : notice.kind === "error" ? (
                  <IconAlert size={16} />
                ) : (
                  <Spinner size={15} />
                )}
              </span>
              <span className="sg-toast__msg">{notice.msg}</span>
              <button
                className="sg-toast__close"
                onClick={() => notify("")}
                aria-label="Fermer la notification"
              >
                <IconClose size={15} />
              </button>
              {notice.kind !== "info" && !reduce && (
                <motion.span
                  key={notice.id}
                  className="sg-toast__bar"
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: NOTICE_MS / 1000, ease: "linear" }}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Édition de texte « composé » */}
      {panel && (
        <TextPanel
          panel={panel}
          onChange={(value) => setPanel((p) => (p ? { ...p, value } : p))}
          onCancel={() => setPanel(null)}
          onSave={savePanel}
        />
      )}

      {/* Choix d'une photo */}
      {photoPicker && (
        <PhotoPicker
          photos={libPhotos}
          onUpload={pickUpload}
          onPick={pickFromLibrary}
          onClose={() => setPhotoPicker(null)}
        />
      )}

      {/* Confirmation de publication */}
      {confirmPublish && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-night/30 p-4"
          onClick={() => setConfirmPublish(false)}
        >
          <div
            className="w-full max-w-md rounded-[20px] bg-white p-6 text-center shadow-cloud-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-archivo text-lg font-semibold text-night">
              Publier vos modifications ?
            </h3>
            <p className="mt-2 text-sm text-slate">
              Cela utilise <b>1 ✦</b>. Solde après : <b>{Math.max(0, balance - 1)} ✦</b>.
            </p>
            {balance < 1 && (
              <p className="mt-2 text-sm text-danger">
                Solde insuffisant —{" "}
                <a className="underline" href="/dashboard/credits">
                  achetez des étoiles
                </a>
                .
              </p>
            )}
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmPublish(false)}>
                Annuler
              </Button>
              <Button size="sm" disabled={balance < 1} onClick={doPublish}>
                Publier maintenant
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

> ⚠️ Supprimer la ligne `import ChatMessageNote from "./components/ChatMessage";` du code ci-dessus si elle déclenche `no-unused-vars` — elle n'est là que par sécurité de copie ; `ChatMessage` est rendu via `ChatPanel`.

> Note : `pageIndexForPath` n'est plus importé (il ne l'était que pour le sélecteur historique) — vérifier qu'aucune autre référence ne subsiste avant de retirer l'import.

- [ ] **Step 2 : Brancher l'historique dans `page.tsx`**

a) Ajouter l'import :

```ts
import { listAiMessages } from "@/lib/ai-history";
```

b) Après `const balance = await getBalance(admin, user.id);`, ajouter :

```ts
  // Fil de chat persistant de l'éditeur (50 derniers messages).
  const history = await listAiMessages(admin, site.id, 50);
```

c) Ajouter la prop au rendu :

```tsx
    <EditorClient
      siteId={site.id}
      slug={site.slug}
      balance={balance}
      hasUnpublished={top ? !top.is_published : false}
      editableFields={editableFields}
      content={(top?.content_json as Record<string, unknown>) ?? {}}
      ownedEffects={ownedEffects}
      integrateEffectId={integrateEffectId}
      initialMessages={history}
    />
```

- [ ] **Step 3 : Typecheck + lint + tests**

Run : `npx tsc --noEmit` → 0 erreur. `npm run lint` → 0 erreur. `npm test` → tous les tests passent.

- [ ] **Step 4 : Commit**

```bash
git add app/editor/EditorClient.tsx app/editor/page.tsx
git commit -m "feat(editor): refonte façon Lovable — chat persistant + ciblage chip + galerie + sheet mobile"
```

---

### Task 11 : Vérification manuelle de bout en bout

**Files:** aucun (vérification).

- [ ] **Step 1 : Appliquer la migration en local**

La base locale = Supabase distant (projet xnjonnamprqrsqeetrtu) déjà utilisé par `.env.local`. Appliquer `0018_ai_messages.sql` via le pooler psql comme pour 0011–0017 (demander à Lucas si l'accès psql n'est pas disponible dans la session).

- [ ] **Step 2 : Lancer le dev server**

Run : `npm run dev` puis ouvrir `http://localhost:3000/editor` (connecté avec un compte possédant un site).

- [ ] **Step 3 : Dérouler la checklist**

1. **Layout desktop** : chat à gauche (400px), aperçu à droite, header inchangé.
2. **Prompt libre** : taper « passe les boutons en doré » sans cibler → message user dans le fil → carte proposition + aperçu CSS live → Accepter (1 ✦) → statut « Appliquée », solde décrémenté.
3. **Ciblage** : ⌖ Cibler (dock ou composer) → clic sur un élément → chip cible dans le composer → envoyer → proposition.
4. **Affiner / Annuler** : vérifier que l'aperçu se purge et que la carte passe en « expirée ».
5. **Galerie** : ✦ → galerie des effets possédés → choisir un effet → chip + mode section → choisir la section → proposition composant → Accepter (Inclus, gratuit).
6. **`?integrate=`** : ouvrir `/editor?integrate=<effectId possédé>` → chip pré-attachée + bandeau section.
7. **Édition manuelle** : ✎ Modifier → clic texte feuille (édition inline), clic texte composé (TextPanel), clic photo (PhotoPicker upload + bibliothèque).
8. **Multi-pages** (site v2 multi-pages) : changer de page → chip cible purgée, fil conservé.
9. **Persistance** : recharger la page → le fil réapparaît (propositions passées « expirées », acceptées « Appliquées »).
10. **Erreur IA** : demander quelque chose de non supporté (« supprime tout le site ») → bulle d'erreur + ↻ Réessayer.
11. **Mobile** (responsive du devtools < 1024px) : bulle ✦ en bas à droite → sheet ; ⌖ replie le sheet ; le clic cible rouvre le sheet avec la chip.
12. **Publication** : bouton Publier → confirmation → succès.

- [ ] **Step 4 : Mettre à jour la mémoire de session (note de suivi)**

Penser à noter : migration **0018 à appliquer en prod** au déploiement.

---

## Auto-revue du plan (faite)

- **Couverture spec** : layout desktop (T7–T10), mobile sheet (T10), persistance (T1–T5, T10), galerie possédés (T8), édition manuelle conservée (T6, T10), erreurs dans le fil (T8–T10), purge chip au changement de page (T10), `?integrate=` (T10), tests (T2, T11). ✓
- **Placeholders** : aucun — tout le code est inline. ✓
- **Cohérence des types** : `Composer`/`OwnedEffect`/`Panel`/`LibPhoto`/`Device`/`ChatMessage`/`AiMessageRow` définis une fois et type-importés ; `aiProposal` porte un `id` qui fait le lien avec le message du fil. ✓
