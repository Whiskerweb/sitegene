# Akyra — Sites multi-pages + sous-domaines — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à un site client Akyra d'avoir plusieurs vraies pages (URLs distinctes) servies sur un sous-domaine par client (`lea.akyra.io`, `lea.akyra.io/portfolio`), sans rebuild par publication.

**Architecture:** Schéma de contenu **v2** (`{ site, pages[] }`) + normalisation rétro-compatible v1→v2 côté plateforme. Un **middleware** Next mappe `lea.akyra.io/<path>` → route catch-all `/s/lea/<path>`, qui sert le bundle template prébuildé en injectant `window.__SITE_CONTENT__` + les meta de la page courante. Chaque template embarque un **routeur client** + un **contexte de page** : les composants lisent le contenu de la page courante via contexte (au lieu des globals module actuels).

**Tech Stack:** Next 16.2.6 (App Router, route handlers, middleware), React 19 (plateforme) / React 18 (templates Vite), TypeScript, Supabase, Vite 5 (build templates), Vitest (nouveau, pour les unités de logique pure).

**Référentiel de chemins & git :**
- Ce plan vit dans le repo **`sitegene`** (repo git indépendant `Whiskerweb/sitegene.git`), **distinct** du repo parent `Sitegenerator`. **Tous les commits de ce plan se font dans le repo `sitegene`**, sur la branche `feat/akyra-multipages`.
- `$SG` = racine du repo `sitegene` (== dossier où vit ce plan). Toutes les commandes `cd "$SG"` et chemins ci-dessous sont relatifs à cette racine.
- `$SG/templates/<id>/` = **source** des templates (`alice-r`, `potozon`, `target`).
- `$SG/public/_templates/<id>/` = bundle déployé (committé) servi par la plateforme.
- Spec : `docs/superpowers/specs/2026-06-01-akyra-multipages-sous-domaines-design.md`.

**⚠️ Contrainte transverse — éditeur inline (data-sg-*) :** un éditeur WYSIWYG existe déjà (`lib/edit-runtime.ts`, `app/editor/EditorClient.tsx`, spec `2026-05-30-editeur-notes`). Les composants des templates portent des annotations `data-sg-path="hero.title[0]"` (texte), `data-sg-img="..."` (photo), `data-sg-edit="panel"`. L'éditeur lit/écrit le contenu **à ces chemins** (via `getPath`/`recordChange`/`specFor` dans `EditorClient.tsx`, sur un objet contenu plat). Le passage au multi-pages doit : (a) **préserver ces attributs** dans tout refactor de composant (cf. Task 11), et (b) rendre la résolution de chemin **page-aware** : écrire dans `pages[<page courante>].content.<path>` (cf. **Milestone E**).

---

## Structure des fichiers (décomposition)

**Plateforme (`$SG`)**
- `lib/site-content.ts` — **nouveau** : types v2 + `normalizeContent` (v1→v2) + `findPage` + `pageMeta`. Logique pure, testée.
- `lib/subdomain.ts` — **nouveau** : `parseHost(host)` (host → app|site+slug). Logique pure, testée.
- `middleware.ts` — **nouveau** : rewrite sous-domaine → `/s/<slug>/<path>`.
- `lib/site-server.ts` — **modifié** : `buildSiteHtml` injecte aussi les meta de page.
- `app/s/[slug]/[[...path]]/route.ts` — **nouveau** (remplace `app/s/[slug]/route.ts`).
- `vitest.config.ts` + `package.json` — **modifié** : outillage de test.
- `scripts/build-templates.mjs` — **nouveau** : build Vite + copie `dist`→`public/_templates` + dump (automatise l'étape rebuild).
- `scripts/cli-build-site.mjs`, `app/api/site/draft/route.ts`, `app/api/site/publish/route.ts` — **modifié** : accepter/valider le contenu v2.

**Templates (`$SG/templates/<id>/`, ×3)**
- `src/data/content.ts` — **modifié** : `DEFAULT_CONTENT` devient v2 (`{ site, pages }`) ; sélecteur runtime → contexte.
- `src/site/PageContext.tsx` — **nouveau** : provider + hooks `useSite()`/`usePage()`.
- `src/site/router.tsx` — **nouveau** : pathname → page courante + navigation client.
- `src/components/*` — **modifié** : lisent le contenu via `usePage()`/props.
- `src/pages/*` — **nouveau** : un renderer par type (`HomePage`, `PortfolioPage`, `AboutPage`, `ServicePage`, `ContactPage`, `GenericPage`).
- `src/components/Navbar.tsx` — **modifié** : nav `site.nav` avec menus déroulants.
- `src/App.tsx` — **modifié** : monte provider + routeur.
- `manifest.json` — **modifié** : déclare types de pages + sections + rôles photo.

---

## MILESTONE 0 — Outillage de test (Vitest)

### Task 0 : Installer Vitest dans la plateforme

**Files:**
- Modify: `$SG/package.json`
- Create: `$SG/vitest.config.ts`
- Create: `$SG/lib/__tests__/smoke.test.ts`

- [ ] **Step 1 : Installer Vitest**

Run:
```bash
cd "$SG" && npm i -D vitest@^2
```
Expected: ajout de `vitest` dans `devDependencies`.

- [ ] **Step 2 : Config Vitest**

Create `$SG/vitest.config.ts` :
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "lib/**/__tests__/**/*.test.ts"],
  },
});
```

- [ ] **Step 3 : Ajouter le script `test`**

Dans `$SG/package.json`, ajouter à `scripts` :
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4 : Test smoke**

Create `$SG/lib/__tests__/smoke.test.ts` :
```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5 : Vérifier**

Run: `cd "$SG" && npm test`
Expected: 1 passed.

- [ ] **Step 6 : Commit**
```bash
git add "$SG/package.json" "$SG/vitest.config.ts" "$SG/lib/__tests__/smoke.test.ts" "$SG/package-lock.json"
git commit -m "chore(akyra): vitest pour les unites de logique pure"
```

---

## MILESTONE 1 — Schéma v2 + normalisation (logique pure, TDD)

### Task 1 : Types v2 + `normalizeContent` (v1→v2)

**Files:**
- Create: `$SG/lib/site-content.ts`
- Create: `$SG/lib/site-content.test.ts`

- [ ] **Step 1 : Test d'échec**

Create `$SG/lib/site-content.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { normalizeContent } from "./site-content";

describe("normalizeContent", () => {
  it("wrappe un contenu v1 (plat, sans version) en une page home", () => {
    const v1 = { hero: { brand: "Alice" }, navItems: ["Work"], gallery: ["a.jpg"] };
    const out = normalizeContent(v1);
    expect(out.version).toBe(2);
    expect(out.pages).toHaveLength(1);
    expect(out.pages[0].slug).toBe("/");
    expect(out.pages[0].type).toBe("home");
    // le contenu v1 d'origine est conservé tel quel dans la page home
    expect(out.pages[0].content).toMatchObject(v1);
  });

  it("laisse un contenu v2 inchangé (idempotent)", () => {
    const v2 = {
      version: 2,
      site: { brand: "Alice", nav: [], footer: {} },
      pages: [{ slug: "/", type: "home", title: "T", meta: {}, content: {} }],
    };
    expect(normalizeContent(v2)).toEqual(v2);
  });

  it("préserve __css au niveau racine si présent (v1)", () => {
    const out = normalizeContent({ hero: {}, __css: ".x{}" });
    expect(out.__css).toBe(".x{}");
  });
});
```

- [ ] **Step 2 : Lancer le test (échoue)**

Run: `cd "$SG" && npx vitest run lib/site-content.test.ts`
Expected: FAIL — `normalizeContent` introuvable.

- [ ] **Step 3 : Implémentation minimale**

Create `$SG/lib/site-content.ts` :
```ts
/**
 * Schéma de contenu v2 d'un site Akyra : un site = des pages typées + une nav.
 * Les anciens contenus (v1, objet plat mono-page) sont normalisés en v2 au
 * rendu : ils deviennent une unique page `home` portant l'objet v1 intact.
 */
export type PageType =
  | "home"
  | "portfolio"
  | "about"
  | "service"
  | "contact"
  | "generic";

export interface NavItem {
  label: string;
  to?: string; // chemin relatif ("/portfolio") ou ancre ("#contact")
  children?: NavItem[];
}

export interface PageMeta {
  description?: string;
  ogImage?: string;
}

export interface Page {
  slug: string; // "/" pour la home ; sinon "/portfolio", "/prestations/grossesse"
  type: PageType;
  title?: string;
  meta?: PageMeta;
  content: Record<string, unknown>;
}

export interface SiteShell {
  brand?: string;
  theme?: Record<string, unknown>;
  nav?: NavItem[];
  footer?: Record<string, unknown>;
}

export interface SiteContentV2 {
  version: 2;
  site: SiteShell;
  pages: Page[];
  __css?: string;
}

function isV2(raw: unknown): raw is SiteContentV2 {
  return (
    !!raw &&
    typeof raw === "object" &&
    (raw as Record<string, unknown>).version === 2 &&
    Array.isArray((raw as Record<string, unknown>).pages)
  );
}

/** Normalise tout contenu (v1 plat ou v2) vers la forme v2. Idempotent sur v2. */
export function normalizeContent(raw: unknown): SiteContentV2 {
  if (isV2(raw)) return raw;
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const css = typeof obj.__css === "string" ? obj.__css : undefined;
  return {
    version: 2,
    site: {
      brand: (obj.hero as Record<string, unknown> | undefined)?.brand as string | undefined,
      nav: [],
      footer: (obj.footer as Record<string, unknown>) ?? {},
    },
    pages: [{ slug: "/", type: "home", content: obj }],
    ...(css ? { __css: css } : {}),
  };
}
```

- [ ] **Step 4 : Lancer le test (passe)**

Run: `cd "$SG" && npx vitest run lib/site-content.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5 : Commit**
```bash
git add "$SG/lib/site-content.ts" "$SG/lib/site-content.test.ts"
git commit -m "feat(akyra): schema contenu v2 + normalizeContent (retro-compat v1)"
```

### Task 2 : `findPage` + `pageMeta`

**Files:**
- Modify: `$SG/lib/site-content.ts`
- Modify: `$SG/lib/site-content.test.ts`

- [ ] **Step 1 : Tests d'échec** (ajouter au fichier de test)
```ts
import { findPage, pageMeta } from "./site-content";

describe("findPage", () => {
  const c = normalizeContent({
    version: 2,
    site: { brand: "A" },
    pages: [
      { slug: "/", type: "home", title: "Accueil", content: {} },
      { slug: "/portfolio", type: "portfolio", title: "Portfolio", content: {} },
    ],
  } as any);

  it("trouve la home pour un path vide ou '/'", () => {
    expect(findPage(c, "")!.slug).toBe("/");
    expect(findPage(c, "/")!.slug).toBe("/");
  });
  it("trouve une page par chemin, slash final ignoré", () => {
    expect(findPage(c, "/portfolio")!.slug).toBe("/portfolio");
    expect(findPage(c, "/portfolio/")!.slug).toBe("/portfolio");
  });
  it("retombe sur la home si chemin inconnu", () => {
    expect(findPage(c, "/inconnu")!.slug).toBe("/");
  });

  it("pageMeta renvoie titre/description de la page", () => {
    const m = pageMeta(c, "/portfolio");
    expect(m.title).toBe("Portfolio");
  });
});
```

- [ ] **Step 2 : Lancer (échoue)**

Run: `cd "$SG" && npx vitest run lib/site-content.test.ts`
Expected: FAIL — `findPage` introuvable.

- [ ] **Step 3 : Implémentation** (ajouter à `site-content.ts`)
```ts
/** Normalise un path en chemin de page : "" → "/", retire le slash final. */
function normPath(path: string): string {
  if (!path || path === "/") return "/";
  const p = path.startsWith("/") ? path : `/${path}`;
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

/** Page correspondant au chemin ; à défaut, la home ("/"). */
export function findPage(content: SiteContentV2, path: string): Page | undefined {
  const want = normPath(path);
  return (
    content.pages.find((p) => normPath(p.slug) === want) ??
    content.pages.find((p) => normPath(p.slug) === "/")
  );
}

/** Meta SEO de la page (titre, description, ogImage), avec repli sur la marque. */
export function pageMeta(
  content: SiteContentV2,
  path: string,
): { title: string; description?: string; ogImage?: string } {
  const page = findPage(content, path);
  const brand = content.site.brand ?? "";
  return {
    title: page?.title ?? brand,
    description: page?.meta?.description,
    ogImage: page?.meta?.ogImage,
  };
}
```

- [ ] **Step 4 : Lancer (passe)**

Run: `cd "$SG" && npx vitest run lib/site-content.test.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**
```bash
git add "$SG/lib/site-content.ts" "$SG/lib/site-content.test.ts"
git commit -m "feat(akyra): findPage + pageMeta (selection page courante)"
```

---

## MILESTONE 2 — Routage par sous-domaine

### Task 3 : `parseHost` (logique pure, TDD)

**Files:**
- Create: `$SG/lib/subdomain.ts`
- Create: `$SG/lib/subdomain.test.ts`

- [ ] **Step 1 : Test d'échec**

Create `$SG/lib/subdomain.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { parseHost } from "./subdomain";

describe("parseHost", () => {
  it("apex et www → app", () => {
    expect(parseHost("akyra.io").kind).toBe("app");
    expect(parseHost("www.akyra.io").kind).toBe("app");
  });
  it("sous-domaine client → site + slug", () => {
    expect(parseHost("lea.akyra.io")).toEqual({ kind: "site", slug: "lea" });
  });
  it("sous-domaine réservé → app", () => {
    expect(parseHost("admin.akyra.io").kind).toBe("app");
    expect(parseHost("api.akyra.io").kind).toBe("app");
  });
  it("dev: lea.localhost:3000 → site", () => {
    expect(parseHost("lea.localhost:3000")).toEqual({ kind: "site", slug: "lea" });
  });
  it("localhost nu → app", () => {
    expect(parseHost("localhost:3000").kind).toBe("app");
  });
  it("domaine inconnu (preview vercel) → app", () => {
    expect(parseHost("akyra-test.vercel.app").kind).toBe("app");
  });
});
```

- [ ] **Step 2 : Lancer (échoue)**

Run: `cd "$SG" && npx vitest run lib/subdomain.test.ts`
Expected: FAIL.

- [ ] **Step 3 : Implémentation**

Create `$SG/lib/subdomain.ts` :
```ts
import { RESERVED_SLUGS, isValidSlug } from "./templates";

/** Domaines racine où un sous-domaine = un site client. */
const SITE_ROOTS = ["akyra.io", "localhost"];

export type HostKind =
  | { kind: "app" }
  | { kind: "site"; slug: string };

/**
 * Décide, à partir du header Host, si la requête vise l'app (apex/www/réservé/
 * domaine inconnu) ou un site client (`<slug>.akyra.io`, `<slug>.localhost`).
 */
export function parseHost(host: string | null | undefined): HostKind {
  if (!host) return { kind: "app" };
  const hostname = host.split(":")[0].toLowerCase(); // retire le port
  const root = SITE_ROOTS.find(
    (r) => hostname === r || hostname.endsWith(`.${r}`),
  );
  if (!root) return { kind: "app" }; // domaine non géré (preview vercel, etc.)
  if (hostname === root) return { kind: "app" }; // apex / localhost nu
  const sub = hostname.slice(0, -(root.length + 1)); // retire ".akyra.io"
  if (sub === "www") return { kind: "app" };
  if (sub.includes(".")) return { kind: "app" }; // pas de multi-niveau en v1
  if (RESERVED_SLUGS.has(sub) || !isValidSlug(sub)) return { kind: "app" };
  return { kind: "site", slug: sub };
}
```

- [ ] **Step 4 : Lancer (passe)**

Run: `cd "$SG" && npx vitest run lib/subdomain.test.ts`
Expected: PASS.

> Note : `isValidSlug` rejette déjà les slugs réservés ET valide la forme. Le double test (`RESERVED_SLUGS.has || !isValidSlug`) est volontairement explicite/défensif.

- [ ] **Step 5 : Commit**
```bash
git add "$SG/lib/subdomain.ts" "$SG/lib/subdomain.test.ts"
git commit -m "feat(akyra): parseHost (host -> app|site+slug)"
```

### Task 4 : Middleware de rewrite sous-domaine

**Files:**
- Create: `$SG/middleware.ts`

- [ ] **Step 1 : Implémentation**

Create `$SG/middleware.ts` :
```ts
import { NextRequest, NextResponse } from "next/server";
import { parseHost } from "@/lib/subdomain";

/**
 * Sous-domaine client : `<slug>.akyra.io/<path>` est réécrit en interne vers
 * `/s/<slug>/<path>` (la route catch-all rend le site). L'app (apex/www/réservé)
 * passe sans modification. Les assets et l'API sont exclus via le matcher.
 */
export function middleware(req: NextRequest) {
  const parsed = parseHost(req.headers.get("host"));
  if (parsed.kind !== "site") return NextResponse.next();

  const url = req.nextUrl.clone();
  // évite la double-réécriture si déjà sous /s/
  if (url.pathname.startsWith("/s/")) return NextResponse.next();
  url.pathname = `/s/${parsed.slug}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // exclut _next, assets, API, bundles de templates et fichiers à extension
  matcher: ["/((?!_next/|api/|_templates/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
```

- [ ] **Step 2 : Vérifier le build/typecheck**

Run: `cd "$SG" && npx tsc --noEmit`
Expected: pas d'erreur sur `middleware.ts` (l'alias `@/` est résolu par `tsconfig`).

- [ ] **Step 3 : Vérification manuelle (dev)**

Run: `cd "$SG" && npm run dev` puis ouvrir `http://alice-r.localhost:3000/`
Expected (en dev, `isTemplateId` autorise le slug template) : la home du template `alice-r` s'affiche via la réécriture `/s/alice-r`. (La route catch-all de la Task 6 doit être en place ; sinon tester après la Task 6.)

- [ ] **Step 4 : Commit**
```bash
git add "$SG/middleware.ts"
git commit -m "feat(akyra): middleware sous-domaine -> /s/<slug>"
```

---

## MILESTONE 3 — Rendu multi-pages côté plateforme

### Task 5 : `buildSiteHtml` injecte les meta de page

**Files:**
- Modify: `$SG/lib/site-server.ts`
- Create: `$SG/lib/site-server.test.ts`

- [ ] **Step 1 : Test d'échec**

Create `$SG/lib/site-server.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { buildHeadInjection } from "./site-server";

describe("buildHeadInjection", () => {
  it("injecte le contenu + le titre échappé de la page", () => {
    const html = buildHeadInjection(
      { version: 2, site: {}, pages: [] } as any,
      { title: "Mon <Titre>", description: "desc" },
    );
    expect(html).toContain("window.__SITE_CONTENT__=");
    expect(html).toContain("<title>Mon &lt;Titre&gt;</title>");
    expect(html).toContain('name="description"');
    // pas de break-out de script
    expect(html).not.toContain("</script><");
  });
});
```

- [ ] **Step 2 : Lancer (échoue)**

Run: `cd "$SG" && npx vitest run lib/site-server.test.ts`
Expected: FAIL — `buildHeadInjection` introuvable.

- [ ] **Step 3 : Implémentation** — remplacer le corps de `$SG/lib/site-server.ts` par :
```ts
/**
 * Construit le HTML d'un site client : shell du bundle template prébuildé
 * (public/_templates/<id>/index.html) + injection runtime du contenu (v2) et
 * des meta de la page courante AVANT l'exécution du bundle. Aucun rebuild.
 */
import type { SiteContentV2 } from "./site-content";

/** JSON sûr inline (`<` échappé → pas de break-out </script>). */
function safeJson(obj: unknown): string {
  return JSON.stringify(obj ?? {}).replace(/</g, "\\u003c");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export interface HeadMeta {
  title: string;
  description?: string;
  ogImage?: string;
}

/** Bloc à injecter en fin de <head> : contenu + meta + CSS perso éventuel. */
export function buildHeadInjection(content: SiteContentV2, meta: HeadMeta): string {
  const css =
    content && typeof content === "object" && typeof content.__css === "string"
      ? content.__css
      : "";
  const cssTag = css ? `<style id="sg-custom">${css}</style>` : "";
  const titleTag = `<title>${escapeHtml(meta.title)}</title>`;
  const descTag = meta.description
    ? `<meta name="description" content="${escapeHtml(meta.description)}">`
    : "";
  const ogTags =
    `<meta property="og:title" content="${escapeHtml(meta.title)}">` +
    (meta.ogImage ? `<meta property="og:image" content="${escapeHtml(meta.ogImage)}">` : "");
  return (
    `<script>window.__SITE_CONTENT__=${safeJson(content)};</script>` +
    titleTag + descTag + ogTags + cssTag
  );
}

export async function buildSiteHtml(
  origin: string,
  templateId: string,
  content: SiteContentV2,
  meta: HeadMeta,
): Promise<string | null> {
  const res = await fetch(`${origin}/_templates/${templateId}/index.html`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  let html = await res.text();
  const inject = buildHeadInjection(content, meta);
  // retire un <title> existant du shell (sera remplacé par celui de la page)
  html = html.replace(/<title>.*?<\/title>/i, "");
  if (html.includes("</head>")) {
    html = html.replace("</head>", () => `${inject}</head>`);
  } else {
    html = inject + html;
  }
  return html;
}

export async function fetchDefaultContent(
  origin: string,
  templateId: string,
): Promise<unknown | null> {
  const res = await fetch(`${origin}/_templates/${templateId}/default-content.json`, {
    cache: "no-store",
  });
  return res.ok ? res.json() : null;
}

export async function fetchTemplateManifest(
  origin: string,
  templateId: string,
): Promise<unknown | null> {
  const res = await fetch(`${origin}/_templates/${templateId}/manifest.json`, {
    cache: "no-store",
  });
  return res.ok ? res.json() : null;
}
```

- [ ] **Step 4 : Lancer (passe)**

Run: `cd "$SG" && npx vitest run lib/site-server.test.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**
```bash
git add "$SG/lib/site-server.ts" "$SG/lib/site-server.test.ts"
git commit -m "feat(akyra): buildSiteHtml injecte les meta de page courante"
```

### Task 6 : Route catch-all `/s/[slug]/[[...path]]`

**Files:**
- Create: `$SG/app/s/[slug]/[[...path]]/route.ts`
- Delete: `$SG/app/s/[slug]/route.ts`

- [ ] **Step 1 : Lire la doc Next 16 sur les optional catch-all dans les route handlers**

Run: `ls "$SG/node_modules/next/dist/docs/" 2>/dev/null && grep -rl "catch-all\|optional" "$SG/node_modules/next/dist/docs/" 2>/dev/null | head`
Lire le guide pertinent (AGENTS.md impose de lire la doc locale avant d'écrire du code Next).

- [ ] **Step 2 : Créer la route catch-all**

Create `$SG/app/s/[slug]/[[...path]]/route.ts` :
```ts
import { createPublicClient } from "@/lib/supabase/public";
import { buildSiteHtml, fetchDefaultContent } from "@/lib/site-server";
import { normalizeContent, pageMeta } from "@/lib/site-content";
import { isTemplateId } from "@/lib/templates";

/**
 * Serveur de sites clients multi-pages : /s/<slug>/<...path>.
 * Récupère le site `live` + son contenu publié, normalise en v2, sélectionne la
 * page courante d'après le path, et sert le bundle template avec le contenu +
 * les meta de cette page injectés. En dev, /s/<templateId>/... = mode démo.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; path?: string[] }> },
) {
  const { slug, path } = await params;
  const pagePath = "/" + (path ?? []).join("/");
  const origin = new URL(request.url).origin;
  const supabase = createPublicClient();

  let templateId: string | null = null;
  let rawContent: unknown = null;

  const { data: site } = await supabase
    .from("sites")
    .select("id, template_id, status")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (site && site.template_id) {
    templateId = site.template_id;
    const { data: sc } = await supabase
      .from("site_content")
      .select("content_json, version")
      .eq("site_id", site.id)
      .eq("is_published", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    rawContent = sc?.content_json ?? (await fetchDefaultContent(origin, site.template_id));
  } else if (process.env.NODE_ENV !== "production" && isTemplateId(slug)) {
    templateId = slug;
    rawContent = await fetchDefaultContent(origin, slug);
  }

  if (!templateId) {
    return new Response("Site introuvable.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const content = normalizeContent(rawContent);
  const meta = pageMeta(content, pagePath);
  const html = await buildSiteHtml(origin, templateId, content, meta);
  if (!html) return new Response("Template indisponible.", { status: 500 });

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex", // à lever quand on ouvrira l'indexation
    },
  });
}
```

- [ ] **Step 3 : Supprimer l'ancienne route**

Run: `git rm "$SG/app/s/[slug]/route.ts"`

- [ ] **Step 4 : Vérifier (dev)**

Run: `cd "$SG" && npm run dev`
Ouvrir : `http://localhost:3000/s/alice-r` (home) et `http://localhost:3000/s/alice-r/portfolio`.
Expected : la home rend ; `/portfolio` rend (page home en repli tant que le template v2 n'est pas livré — Milestone 4). Pas d'erreur 500. `<title>` présent dans le HTML (voir source).

- [ ] **Step 5 : Commit**
```bash
git add "$SG/app/s/[slug]/[[...path]]/route.ts"
git commit -m "feat(akyra): route catch-all /s/<slug>/<...path> (rendu multi-pages)"
```

---

## MILESTONE 4 — Template `alice-r` multi-pages (RÉFÉRENCE)

> Ce milestone établit le pattern complet sur un template. Les Milestones 5 le rejouent sur `potozon` et `target`. Tout se passe dans `$SG/templates/alice-r/`.
> Pré-requis dev : `cd "$SG/templates/alice-r" && npm install`.

### Task 7 : Contexte de page + hooks

**Files:**
- Create: `$SG/templates/alice-r/src/site/PageContext.tsx`

- [ ] **Step 1 : Implémentation**
```tsx
import { createContext, useContext, type ReactNode } from "react";

export type PageType =
  | "home" | "portfolio" | "about" | "service" | "contact" | "generic";

export interface NavItem { label: string; to?: string; children?: NavItem[] }
export interface Page {
  slug: string;
  type: PageType;
  title?: string;
  meta?: { description?: string; ogImage?: string };
  content: any; // shape dépend du type ; typé au point d'usage dans les pages
}
export interface SiteShell {
  brand?: string;
  theme?: Record<string, unknown>;
  nav?: NavItem[];
  footer?: any;
}
export interface SiteContentV2 { version: 2; site: SiteShell; pages: Page[] }

interface Ctx { site: SiteShell; page: Page }
const PageCtx = createContext<Ctx | null>(null);

export function PageProvider({ value, children }: { value: Ctx; children: ReactNode }) {
  return <PageCtx.Provider value={value}>{children}</PageCtx.Provider>;
}

export function useSite(): SiteShell {
  const c = useContext(PageCtx);
  if (!c) throw new Error("useSite hors PageProvider");
  return c.site;
}
export function usePage(): Page {
  const c = useContext(PageCtx);
  if (!c) throw new Error("usePage hors PageProvider");
  return c.page;
}
```

- [ ] **Step 2 : Commit**
```bash
git add "$SG/templates/alice-r/src/site/PageContext.tsx"
git commit -m "feat(alice-r): PageContext + hooks useSite/usePage"
```

### Task 8 : Routeur client (pathname → page courante)

**Files:**
- Create: `$SG/templates/alice-r/src/site/router.tsx`

- [ ] **Step 1 : Implémentation**
```tsx
import { useEffect, useState, type ReactNode } from "react";
import type { SiteContentV2, Page } from "./PageContext";

/**
 * Routeur client minimal. Lit location.pathname, retire le préfixe éventuel
 * `/s/<slug>` (dev/preview), matche pages[].slug, et re-render au pushState.
 * Le serveur sert le même bundle pour toute URL → deep-link direct OK.
 */
function stripPrefix(pathname: string): string {
  // dev/preview : /s/<slug>/<reste>  → /<reste>
  const m = pathname.match(/^\/s\/[^/]+(\/.*)?$/);
  const p = m ? m[1] ?? "/" : pathname;
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p || "/";
}

function pick(content: SiteContentV2, pathname: string): Page {
  const want = stripPrefix(pathname);
  return (
    content.pages.find((p) => p.slug === want) ??
    content.pages.find((p) => p.slug === "/") ??
    content.pages[0]
  );
}

/** Navigation interne : history.pushState + event custom (capté par useRoute). */
export function navigate(to: string) {
  // on garde le préfixe /s/<slug> courant s'il existe (dev/preview)
  const m = window.location.pathname.match(/^\/s\/[^/]+/);
  const prefix = m ? m[0] : "";
  const target = to.startsWith("#") ? window.location.pathname + to : prefix + to;
  window.history.pushState({}, "", target);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function useRoute(content: SiteContentV2): Page {
  const [page, setPage] = useState<Page>(() =>
    pick(content, typeof window !== "undefined" ? window.location.pathname : "/"),
  );
  useEffect(() => {
    const onNav = () => setPage(pick(content, window.location.pathname));
    window.addEventListener("popstate", onNav);
    return () => window.removeEventListener("popstate", onNav);
  }, [content]);
  return page;
}

/** Lien interne : <a> réel (SEO + clic-droit) qui intercepte le clic gauche. */
export function Link({ to, children, ...rest }: { to: string; children: ReactNode } & Record<string, unknown>) {
  return (
    <a
      href={to}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
```

- [ ] **Step 2 : Commit**
```bash
git add "$SG/templates/alice-r/src/site/router.tsx"
git commit -m "feat(alice-r): routeur client (pathname -> page, navigation, Link)"
```

### Task 9 : `content.ts` → v2 (`site` + `pages`)

**Files:**
- Modify: `$SG/templates/alice-r/src/data/content.ts`

- [ ] **Step 1 : Restructurer `DEFAULT_CONTENT` en v2**

Transformer l'objet plat actuel en :
```ts
const DEFAULT_CONTENT = {
  version: 2,
  site: {
    brand: "Alice R",
    nav: [
      { label: "Accueil", to: "/" },
      { label: "Portfolio", to: "/portfolio" },
      { label: "À propos", to: "/a-propos" },
      { label: "Contact", to: "/contact" },
    ],
    footer: {
      title: "Every Frame Tells a Story. Let’s Create Yours.",
      email: "hello@alicer.studio",
      socials: ["Instagram", "Pinterest", "Behance"],
    },
    theme: {}, // accents/géométrie structurels restent dans les composants
  },
  pages: [
    {
      slug: "/", type: "home", title: "Alice R — Photographe",
      meta: { description: "Photographie de portraits, mariages et marques." },
      content: {
        arcPhotos: [/* … les 13 entrées actuelles … */],
        hero: {/* … */}, features: [/* … */], featuredQuote: {/* … */},
        scrollText: "…", servicesIntro: "…", services: [/* … */],
        collaborations: [/* … */], works: [/* … */], beyond: {/* … */},
        testimonials: [/* … */], faqs: [/* … */],
        galleryOrder: [10,11,12,13,1,2,3,4,5,6,7,8],
      },
    },
    {
      slug: "/portfolio", type: "portfolio", title: "Portfolio — Alice R",
      content: { galleries: [{ category: "Sélection", order: [10,11,12,13,1,2,3,4,5,6,7,8] }] },
    },
    {
      slug: "/a-propos", type: "about", title: "À propos — Alice R",
      content: { scrollText: "…", featuredQuote: {/* … */}, beyond: {/* … */}, testimonials: [/* … */] },
    },
    {
      slug: "/contact", type: "contact", title: "Contact — Alice R",
      content: { email: "hello@alicer.studio", zones: [], pricing: [], faqs: [/* … */] },
    },
  ],
} as const;
```
> Reprendre **les valeurs réelles existantes** (arcPhotos, hero, services, etc.) — ne rien inventer ; déplacer le contenu actuel dans `pages[0].content`. Les pages portfolio/about/contact réutilisent des sous-ensembles du même contenu pour la démo par défaut.

- [ ] **Step 2 : Sélecteur runtime → contexte (plus de re-exports globaux)**

Remplacer la fin du fichier (sélection `C` + re-exports nommés) par :
```ts
import { normalizeDefault } from "../site/normalize"; // cf. Step 3

const C =
  typeof window !== "undefined" && (window as any).__SITE_CONTENT__
    ? ((window as any).__SITE_CONTENT__ as typeof DEFAULT_CONTENT)
    : DEFAULT_CONTENT;

// Exposé pour le dump plateforme (default-content.json).
export const __DEFAULT_CONTENT__ = DEFAULT_CONTENT;

// Contenu v2 effectif (injecté > défaut), normalisé.
export const SITE = normalizeDefault(C);
```
> Les anciens `export const hero = …` au niveau module sont **supprimés** : les composants liront via `usePage()` (Task 11).

- [ ] **Step 3 : helper `normalizeDefault`** — Create `$SG/templates/alice-r/src/site/normalize.ts` :
```ts
import type { SiteContentV2 } from "./PageContext";
/** Garantit la forme v2 (les anciens contenus injectés v1 → 1 page home). */
export function normalizeDefault(raw: any): SiteContentV2 {
  if (raw && raw.version === 2 && Array.isArray(raw.pages)) return raw;
  return {
    version: 2,
    site: { brand: raw?.hero?.brand, nav: [], footer: raw?.footer ?? {} },
    pages: [{ slug: "/", type: "home", content: raw ?? {} }],
  };
}
```

- [ ] **Step 4 : Vérifier le typecheck**

Run: `cd "$SG/templates/alice-r" && npx tsc --noEmit`
Expected : erreurs UNIQUEMENT dans les composants qui importent encore les anciens globals (corrigés Task 11).

- [ ] **Step 5 : Commit**
```bash
git add "$SG/templates/alice-r/src/data/content.ts" "$SG/templates/alice-r/src/site/normalize.ts"
git commit -m "feat(alice-r): DEFAULT_CONTENT v2 (site + pages)"
```

### Task 10 : `App.tsx` monte provider + routeur ; pages renderers

**Files:**
- Create: `$SG/templates/alice-r/src/pages/HomePage.tsx`, `PortfolioPage.tsx`, `AboutPage.tsx`, `ContactPage.tsx`, `ServicePage.tsx`, `GenericPage.tsx`
- Modify: `$SG/templates/alice-r/src/App.tsx`

- [ ] **Step 1 : `App.tsx`**
```tsx
import { SITE } from "./data/content";
import { PageProvider } from "./site/PageContext";
import { useRoute } from "./site/router";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import PortfolioPage from "./pages/PortfolioPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import ServicePage from "./pages/ServicePage";
import GenericPage from "./pages/GenericPage";

const RENDERERS: Record<string, () => JSX.Element> = {
  home: HomePage, portfolio: PortfolioPage, about: AboutPage,
  contact: ContactPage, service: ServicePage, generic: GenericPage,
};

export default function App() {
  const page = useRoute(SITE);
  const Renderer = RENDERERS[page.type] ?? HomePage;
  return (
    <PageProvider value={{ site: SITE.site, page }}>
      <main className="grain relative w-full">
        <Navbar />
        <Renderer />
        <Footer />
      </main>
    </PageProvider>
  );
}
```

- [ ] **Step 2 : `HomePage.tsx`** — recompose les sections actuelles, en lisant le contenu de la page via `usePage()` :
```tsx
import { usePage } from "../site/PageContext";
import Hero from "../components/Hero";
import FeaturedQuote from "../components/FeaturedQuote";
import ScrollText from "../components/ScrollText";
import Services from "../components/Services";
import Marquee from "../components/Marquee";
import Works from "../components/Works";
import Stats from "../components/Stats";
import Testimonials from "../components/Testimonials";
import FAQ from "../components/FAQ";
import Gallery from "../components/Gallery";

export default function HomePage() {
  const { content } = usePage();
  return (
    <>
      <Hero data={content} />
      <FeaturedQuote data={content.featuredQuote} />
      <ScrollText text={content.scrollText} />
      <Services intro={content.servicesIntro} items={content.services} />
      <Marquee items={content.collaborations} />
      <Works items={content.works} />
      <Stats data={content.beyond} />
      <Testimonials items={content.testimonials} />
      <FAQ items={content.faqs} />
      <Gallery order={content.galleryOrder} />
    </>
  );
}
```

- [ ] **Step 3 : Les 5 autres renderers** — chacun compose un sous-ensemble des mêmes composants :
  - `PortfolioPage` : titre + `Gallery` par `content.galleries[]` (une grille par catégorie).
  - `AboutPage` : `ScrollText` + `FeaturedQuote` + `Stats` + `Testimonials`.
  - `ContactPage` : bloc coordonnées (`content.email`), `content.zones`, table `content.pricing`, `FAQ`.
  - `ServicePage` : `Hero` réduit + description + `Gallery` dédiée + table tarif + CTA.
  - `GenericPage` : map `content.blocks[]` → rendu `richText|imageText|gallery|cta`.
  Chacun lit `usePage()`. Écrire le markup en réutilisant les classes Tailwind/DA existantes des composants.

- [ ] **Step 4 : Commit**
```bash
git add "$SG/templates/alice-r/src/App.tsx" "$SG/templates/alice-r/src/pages/"
git commit -m "feat(alice-r): App router + renderers de pages (home/portfolio/about/contact/service/generic)"
```

### Task 11 : Composants → contenu par props ; Navbar à déroulants

**Files:**
- Modify: tous les `$SG/templates/alice-r/src/components/*.tsx`

- [ ] **Step 1 : Refactorer chaque composant** — remplacer l'import des globals (`import { services } from "../data/content"`) par des **props** reçues du renderer (voir signatures Task 10, ex. `Services({ intro, items })`). Le composant ne lit plus le module de contenu.
  > **⚠️ PRÉSERVER les attributs `data-sg-path` / `data-sg-img` / `data-sg-edit`** déjà présents sur les éléments (éditeur inline). Ne PAS les supprimer ni les renommer. Les chemins restent **relatifs au contenu de la page** (`hero.title[0]`, `services[0].name`…) — ils ne préfixent pas `pages[...]` (c'est l'éditeur qui résout vers la page courante, Milestone E). Après refactor, vérifier qu'un `grep -c "data-sg-" src/components/*.tsx` donne un total ≥ à celui d'avant le refactor.

- [ ] **Step 2 : `Navbar.tsx`** — lit `useSite().nav` et rend une nav à **menus déroulants** (`children`), liens via `<Link>` du routeur :
```tsx
import { useSite } from "../site/PageContext";
import { Link } from "../site/router";

export default function Navbar() {
  const { brand, nav = [] } = useSite();
  return (
    <nav className="/* classes DA existantes */">
      <Link to="/">{brand}</Link>
      <ul className="flex gap-6">
        {nav.map((item) => (
          <li key={item.label} className="relative group">
            {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
            {item.children?.length ? (
              <ul className="absolute hidden group-hover:block /* dropdown DA */">
                {item.children.map((c) => (
                  <li key={c.label}><Link to={c.to!}>{c.label}</Link></li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 3 : `Footer.tsx`** — lit `useSite().footer`.

- [ ] **Step 4 : Typecheck + dev**

Run: `cd "$SG/templates/alice-r" && npx tsc --noEmit && npm run dev`
Ouvrir `http://localhost:5173/` puis cliquer Portfolio / À propos / Contact.
Expected : navigation client sans rechargement ; chaque page rend son contenu ; deep-link (`/portfolio` rechargé) OK ; menus déroulants fonctionnels.

- [ ] **Step 5 : Commit**
```bash
git add "$SG/templates/alice-r/src/components/"
git commit -m "feat(alice-r): composants pilotes par props + Navbar a menus deroulants"
```

### Task 12 : `manifest.json` v2

**Files:**
- Modify: `$SG/templates/alice-r/manifest.json`

- [ ] **Step 1 : Déclarer les types de pages supportés** — ajouter une clé `pages` :
```jsonc
{
  "id": "alice-r",
  "name": "Aurelia",
  "schema": 2,
  "pageTypes": ["home", "portfolio", "about", "service", "contact", "generic"],
  "sections": {
    "home": ["hero","features","featuredQuote","scrollText","services","collaborations","works","beyond","testimonials","faqs","gallery"],
    "portfolio": ["galleries"],
    "about": ["scrollText","featuredQuote","beyond","testimonials"],
    "service": ["hero","description","gallery","pricing","faqs","cta"],
    "contact": ["email","zones","pricing","faqs"],
    "generic": ["blocks"]
  },
  "photoSlots": 13,
  "photos": [ /* inchangé */ ]
}
```
> Conserver `photos`/`photoSlots` actuels. `fields.editable/locked` peuvent rester pour l'éditeur mono-page existant (non régressif).

- [ ] **Step 2 : Commit**
```bash
git add "$SG/templates/alice-r/manifest.json"
git commit -m "feat(alice-r): manifest v2 (pageTypes + sections)"
```

### Task 13 : Build + dump + déploiement du bundle

**Files:**
- Create: `$SG/scripts/build-templates.mjs`
- Modify: `$SG/package.json` (script `templates:build`)
- Generated: `$SG/public/_templates/alice-r/*`

- [ ] **Step 1 : Script de build/copie**

Create `$SG/scripts/build-templates.mjs` :
```js
// Build un template Vite et copie dist/ → public/_templates/<id>/, puis dump.
// Usage : node scripts/build-templates.mjs alice-r [potozon target]
import { execSync } from "node:child_process";
import { cpSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ids = process.argv.slice(2);
if (!ids.length) throw new Error("usage: build-templates.mjs <id> [<id>...]");

for (const id of ids) {
  const src = join(ROOT, "templates", id);
  if (!existsSync(src)) throw new Error(`template introuvable: ${id}`);
  console.log(`▶ build ${id}`);
  execSync("npm run build", { cwd: src, stdio: "inherit" });
  const out = join(ROOT, "public", "_templates", id);
  // garde default-content.json / manifest.json (régénérés par le dump), remplace le reste
  for (const sub of ["assets", "img", "index.html"]) {
    rmSync(join(out, sub), { recursive: true, force: true });
  }
  cpSync(join(src, "dist"), out, { recursive: true });
  console.log(`✓ ${id} → public/_templates/${id}`);
}
// régénère default-content.json + manifest
execSync("node --import tsx scripts/dump-default-content.mjs", { cwd: ROOT, stdio: "inherit" });
```

- [ ] **Step 2 : Script npm**

Dans `$SG/package.json` scripts : `"templates:build": "node scripts/build-templates.mjs"`.

- [ ] **Step 3 : Builder alice-r**

Run: `cd "$SG" && npm run templates:build alice-r`
Expected : build Vite OK, `public/_templates/alice-r/index.html` + `assets/` mis à jour, `default-content.json` régénéré (forme v2).

- [ ] **Step 4 : Vérifier de bout en bout via la plateforme**

Run: `cd "$SG" && npm run dev`
Ouvrir `http://localhost:3000/s/alice-r` et `http://localhost:3000/s/alice-r/portfolio` et `…/a-propos` et `…/contact`.
Expected : chaque URL rend la bonne page, `<title>` correct dans le source HTML, navigation client OK, deep-link OK. Tester aussi `http://alice-r.localhost:3000/portfolio` (middleware).

- [ ] **Step 5 : Commit**
```bash
git add "$SG/scripts/build-templates.mjs" "$SG/package.json" "$SG/public/_templates/alice-r/"
git commit -m "feat(alice-r): build/deploy bundle v2 multi-pages"
```

---

## MILESTONE 5 — Templates `potozon` et `target` (rejouer le pattern)

### Task 14 : `potozon` multi-pages

**Files:** `$SG/templates/potozon/src/*`, `manifest.json`, `public/_templates/potozon/*`

- [ ] **Step 1** : Rejouer Tasks 7→13 sur `potozon` en réutilisant `PageContext.tsx`/`router.tsx`/`normalize.ts` (copier depuis `alice-r` — fichiers identiques, indépendants de la DA).
- [ ] **Step 2** : Adapter `content.ts` v2 avec les **valeurs réelles** de potozon (18 photos, cartes galerie). Mapper ses sections aux 6 types de pages.
- [ ] **Step 3** : Refactorer ses composants pour lire via props/`usePage()`, Navbar à déroulants.
- [ ] **Step 4** : `manifest.json` v2 (pageTypes + sections + photos inchangés).
- [ ] **Step 5** : `npm run templates:build potozon`, vérifier `/s/potozon`, `/s/potozon/portfolio`…
- [ ] **Step 6 : Commit** `feat(potozon): multi-pages v2`

### Task 15 : `target` multi-pages

**Files:** `$SG/templates/target/src/*`, `manifest.json`, `public/_templates/target/*`

- [ ] **Step 1→6** : Identique à Task 14 pour `target` (15 photos, DA éditoriale). Commit `feat(target): multi-pages v2`.

---

## MILESTONE E — Éditeur inline « page-aware » (couplage data-sg-*)

> Rend l'éditeur WYSIWYG existant compatible v2 : il édite le contenu de **la page actuellement affichée** dans l'iframe d'aperçu. À faire APRÈS qu'au moins `alice-r` soit multi-pages (Milestone 4), car la vérification a besoin d'un site v2 réel. Tout dans `$SG/app/editor/` + `$SG/lib/`.

### Task E1 : Résolution de chemin page-aware (`getPath`/`recordChange` → page courante)

**Files:**
- Create: `$SG/lib/content-path.ts` + `$SG/lib/content-path.test.ts`
- Modify: `$SG/app/editor/EditorClient.tsx`

- [ ] **Step 1 : Test d'échec** — Create `$SG/lib/content-path.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { getAtPath, setAtPath, pageIndexForPath } from "./content-path";

const v2 = {
  version: 2, site: {},
  pages: [
    { slug: "/", type: "home", content: { hero: { title: ["A", "B"] } } },
    { slug: "/portfolio", type: "portfolio", content: { galleries: [{ category: "X" }] } },
  ],
};

describe("content-path (page-aware)", () => {
  it("pageIndexForPath mappe un chemin d'URL vers l'index de page", () => {
    expect(pageIndexForPath(v2, "/")).toBe(0);
    expect(pageIndexForPath(v2, "/portfolio")).toBe(1);
    expect(pageIndexForPath(v2, "/inconnu")).toBe(0); // repli home
  });
  it("getAtPath lit dans le content de la page indiquée", () => {
    expect(getAtPath(v2, 0, "hero.title[1]")).toBe("B");
    expect(getAtPath(v2, 1, "galleries[0].category")).toBe("X");
  });
  it("setAtPath écrit dans pages[idx].content sans muter l'original", () => {
    const next = setAtPath(v2, 0, "hero.title[0]", "Z");
    expect(getAtPath(next, 0, "hero.title[0]")).toBe("Z");
    expect(getAtPath(v2, 0, "hero.title[0]")).toBe("A"); // immutable
  });
});
```

- [ ] **Step 2 : Lancer (échoue)** — Run: `cd "$SG" && npx vitest run lib/content-path.test.ts` → FAIL.

- [ ] **Step 3 : Implémentation** — Create `$SG/lib/content-path.ts` :
```ts
import { normalizeContent, findPage, type SiteContentV2 } from "./site-content";

/** Découpe "a.b[0].c" en segments ["a","b",0,"c"]. */
function parsePath(path: string): (string | number)[] {
  const out: (string | number)[] = [];
  for (const seg of path.split(".")) {
    const m = seg.match(/^([^[]+)((\[\d+\])*)$/);
    if (!m) { out.push(seg); continue; }
    out.push(m[1]);
    for (const idx of m[2].matchAll(/\[(\d+)\]/g)) out.push(Number(idx[1]));
  }
  return out;
}

/** Index de la page correspondant à un chemin d'URL (repli sur la home). */
export function pageIndexForPath(content: SiteContentV2, urlPath: string): number {
  const page = findPage(content, urlPath);
  const i = page ? content.pages.indexOf(page) : 0;
  return i < 0 ? 0 : i;
}

/** Lit une valeur dans pages[pageIndex].content au chemin donné. */
export function getAtPath(content: SiteContentV2, pageIndex: number, path: string): unknown {
  let cur: any = content.pages[pageIndex]?.content;
  for (const k of parsePath(path)) {
    if (cur == null) return undefined;
    cur = cur[k as any];
  }
  return cur;
}

/** Renvoie une COPIE de content avec la valeur posée dans pages[pageIndex].content. */
export function setAtPath(
  content: SiteContentV2,
  pageIndex: number,
  path: string,
  value: unknown,
): SiteContentV2 {
  const next = structuredClone(content);
  const segs = parsePath(path);
  let cur: any = (next.pages[pageIndex].content ??= {});
  for (let i = 0; i < segs.length - 1; i++) {
    const k = segs[i];
    if (cur[k as any] == null) cur[k as any] = typeof segs[i + 1] === "number" ? [] : {};
    cur = cur[k as any];
  }
  cur[segs[segs.length - 1] as any] = value;
  return next;
}

/** Normalise un contenu brut puis renvoie {content, pageIndex} pour une URL. */
export function resolveForUrl(raw: unknown, urlPath: string): { content: SiteContentV2; pageIndex: number } {
  const content = normalizeContent(raw);
  return { content, pageIndex: pageIndexForPath(content, urlPath) };
}
```

- [ ] **Step 4 : Lancer (passe)** — Run: `cd "$SG" && npx vitest run lib/content-path.test.ts` → PASS.

- [ ] **Step 5 : Brancher dans `EditorClient.tsx`** — l'éditeur tient l'index de page courant (`currentPageIndex`, dérivé de l'URL chargée dans l'iframe, cf. Task E2). Remplacer les usages plats :
  - `getPath(contentRef.current, d.path)` → `getAtPath(contentRef.current, currentPageIndex, d.path)`.
  - `recordChange(d.path, v)` met à jour le contenu via `setAtPath(contentRef.current, currentPageIndex, d.path, v)` (au lieu d'un set racine).
  - La sauvegarde `/api/site/draft` envoie le `content_json` v2 complet (inchangé structurellement — c'est l'objet entier qui est persisté).
  > Si `contentRef.current` est encore au format v1 (ancien site), `normalizeContent` le promeut en v2 (1 page home, `currentPageIndex=0`) → l'éditeur continue de fonctionner sur les sites mono-page.

- [ ] **Step 6 : Commit**
```bash
git add lib/content-path.ts lib/content-path.test.ts app/editor/EditorClient.tsx
git commit -m "feat(editeur): resolution de chemin page-aware (pages[idx].content)"
```

### Task E2 : Sélecteur de page dans l'éditeur

**Files:**
- Modify: `$SG/app/editor/EditorClient.tsx`

- [ ] **Step 1 : Ajouter un sélecteur de page** — une liste déroulante listant `content.pages[].title ?? slug`. Au changement :
  - met à jour `currentPageIndex` ;
  - navigue l'iframe d'aperçu vers l'URL de la page (`/s/<slug><page.slug>` en dev, ou `/apercu?...&path=<page.slug>` selon le montage actuel de l'iframe) — réutiliser le même mécanisme d'URL d'aperçu déjà en place, en ajoutant le `path` de la page.
- [ ] **Step 2 : Au `sg:ready` de l'iframe** — l'éditeur (re)pousse `sg:mode` ET recale `currentPageIndex` sur la page chargée (l'URL de l'iframe fait foi).
- [ ] **Step 3 : Vérification manuelle** — ouvrir l'éditeur sur un site `alice-r` v2 : changer de page dans le sélecteur recharge l'aperçu sur la bonne page ; éditer un texte sur `/portfolio` écrit bien dans `pages[1].content` (vérifier le `content_json` sauvegardé).
- [ ] **Step 4 : Commit** `feat(editeur): selecteur de page (multi-pages)`

### Task E3 : Champs éditables par type de page (`__SG_FIELDS__`)

**Files:**
- Modify: `$SG/app/editor/EditorClient.tsx` (ou la route `/apercu` qui appelle `injectEditChrome`)
- Modify: `$SG/lib/edit-runtime.ts` (uniquement si la whitelist doit varier par page)

- [ ] **Step 1** : `injectEditChrome` reçoit `editableFields`. En v2, choisir les champs selon le **type de la page courante** (depuis `manifest.sections[pageType]` / une whitelist par type). Pour la v1 du multi-pages, une **union plate** de tous les champs connus est acceptable (l'éditeur tolère un chemin non whitelisté → champ `textarea` générique). Documenter ce choix par un `log`/commentaire.
- [ ] **Step 2 : Vérification** — éditer un champ propre à une page `service` (ex. `pricing[0].price`) : le panneau s'ouvre, la valeur se sauvegarde au bon chemin de la bonne page.
- [ ] **Step 3 : Commit** `feat(editeur): champs editables par type de page (v1: union plate)`

---

## MILESTONE 6 — Pipeline de publication v2

### Task 16 : `cli-build-site` + API draft/publish acceptent et valident le v2

**Files:**
- Modify: `$SG/scripts/cli-build-site.mjs`
- Modify: `$SG/app/api/site/draft/route.ts`, `$SG/app/api/site/publish/route.ts`
- Create: `$SG/lib/validate-content.ts` + `$SG/lib/validate-content.test.ts`

- [ ] **Step 1 : Test d'échec de la validation**

Create `$SG/lib/validate-content.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { validateContentV2 } from "./validate-content";

describe("validateContentV2", () => {
  const base = { version: 2, site: { nav: [{ label: "Accueil", to: "/" }] },
    pages: [{ slug: "/", type: "home", content: {} }] };
  it("accepte un v2 valide", () => {
    expect(validateContentV2(base).ok).toBe(true);
  });
  it("refuse l'absence de page '/'", () => {
    const bad = { ...base, pages: [{ slug: "/x", type: "home", content: {} }] };
    expect(validateContentV2(bad).ok).toBe(false);
  });
  it("refuse un nav.to vers une page inexistante", () => {
    const bad = { ...base, site: { nav: [{ label: "X", to: "/inconnu" }] } };
    expect(validateContentV2(bad).ok).toBe(false);
  });
  it("refuse un type de page inconnu", () => {
    const bad = { ...base, pages: [...base.pages, { slug: "/y", type: "wat", content: {} }] };
    expect(validateContentV2(bad).ok).toBe(false);
  });
});
```

- [ ] **Step 2 : Lancer (échoue)**

Run: `cd "$SG" && npx vitest run lib/validate-content.test.ts`
Expected: FAIL.

- [ ] **Step 3 : Implémentation** — Create `$SG/lib/validate-content.ts` :
```ts
import { z } from "zod";

const PAGE_TYPES = ["home", "portfolio", "about", "service", "contact", "generic"] as const;

const navItem: z.ZodType<any> = z.lazy(() =>
  z.object({
    label: z.string(),
    to: z.string().optional(),
    children: z.array(navItem).optional(),
  }),
);

const schema = z.object({
  version: z.literal(2),
  site: z.object({
    brand: z.string().optional(),
    theme: z.record(z.unknown()).optional(),
    nav: z.array(navItem).optional(),
    footer: z.record(z.unknown()).optional(),
  }),
  pages: z.array(
    z.object({
      slug: z.string(),
      type: z.enum(PAGE_TYPES),
      title: z.string().optional(),
      meta: z.object({ description: z.string().optional(), ogImage: z.string().optional() }).optional(),
      content: z.record(z.unknown()),
    }),
  ),
});

export function validateContentV2(raw: unknown): { ok: true } | { ok: false; error: string } {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.message };
  const c = parsed.data;
  const slugs = new Set(c.pages.map((p) => p.slug.replace(/\/$/, "") || "/"));
  if (!slugs.has("/")) return { ok: false, error: "Page d'accueil '/' manquante." };
  // tous les nav.to internes pointent vers une page existante
  const checkNav = (items: typeof c.site.nav = []): string | null => {
    for (const it of items ?? []) {
      if (it.to && !it.to.startsWith("#") && !slugs.has(it.to.replace(/\/$/, "") || "/")) {
        return `nav.to inconnu: ${it.to}`;
      }
      const sub = it.children && checkNav(it.children);
      if (sub) return sub;
    }
    return null;
  };
  const navErr = checkNav(c.site.nav);
  if (navErr) return { ok: false, error: navErr };
  return { ok: true };
}
```
> `zod` est déjà une dépendance de `$SG`.

- [ ] **Step 4 : Lancer (passe)**

Run: `cd "$SG" && npx vitest run lib/validate-content.test.ts`
Expected: PASS.

- [ ] **Step 5 : Brancher la validation** — dans `app/api/site/draft/route.ts` et `app/api/site/publish/route.ts`, après avoir reçu le `content_json`, si `content_json.version === 2` appeler `validateContentV2` et renvoyer `400` avec `error` si `!ok`. (Laisser passer les contenus v1 sans validation, normalisés au rendu.)

- [ ] **Step 6 : `cli-build-site.mjs`** — vérifier que la liaison image-par-nom de fichier parcourt **toutes** les pages (`pages[].content`, profondeur arbitraire), pas seulement la racine. Réutiliser une fonction de parcours récursif analogue à `rewriteImages` du dump.

- [ ] **Step 7 : Vérification manuelle** — générer un site v2 multi-pages de test via `cli-build-site` et confirmer son rendu sur `/s/<slug>/...` + visibilité `/admin`.

- [ ] **Step 8 : Commit**
```bash
git add "$SG/lib/validate-content.ts" "$SG/lib/validate-content.test.ts" "$SG/app/api/site/draft/route.ts" "$SG/app/api/site/publish/route.ts" "$SG/scripts/cli-build-site.mjs"
git commit -m "feat(akyra): validation + publication du contenu v2 multi-pages"
```

---

## MILESTONE 7 — Déploiement hébergement (manuel, hors code)

### Task 17 : Wildcard DNS + domaine Vercel

- [ ] **Step 1** : Sur Vercel (projet Akyra), ajouter le domaine wildcard `*.akyra.io` (TLS wildcard auto).
- [ ] **Step 2** : Chez le registrar DNS, créer l'enregistrement wildcard `*.akyra.io` → cible Vercel (CNAME/ALIAS selon registrar). Conserver `akyra.io`/`www`.
- [ ] **Step 3** : Vérifier `https://<slug>.akyra.io/` et `https://<slug>.akyra.io/portfolio` sur un site `live` réel.
> Note : si l'utilisateur veut valider le DNS/Vercel avant, faire cette task plus tôt — elle est indépendante du code.

---

## Self-review (couverture spec)

- **§4 Sous-domaines** → Tasks 3, 4, 17. ✓
- **§5.1 Schéma v2** → Tasks 1, 9. ✓
- **§5.2 Types de pages** → Tasks 10, 11, 12 (alice-r) ; 14, 15 (autres). ✓
- **§5.3 Routeur client** → Task 8. ✓
- **§5.4 Rendu serveur + meta** → Tasks 5, 6. ✓
- **§5.5 Rétro-compat v1→v2** → Tasks 1, 9 (normalize). ✓
- **§5.6 Pipeline publication** → Task 16. ✓
- **§9bis pipeline build** → Task 13. ✓
- **§8 Tests** → unités (Tasks 1,2,3,5,16,E1) + vérif manuelle (Tasks 4,6,11,13,14,15,E2,E3). ✓
- **Couplage éditeur inline (data-sg-*)** → préservation des attributs (Task 11 Step 1) + résolution page-aware (Tasks E1,E2,E3). ✓

**Cohérence des types** : `SiteContentV2`/`Page`/`NavItem` définis Task 1 (plateforme) ; dupliqués Task 7 (template, contexte indépendant) — volontaire (deux packages séparés, pas d'import croisé). `normalizeContent` (plateforme) ↔ `normalizeDefault` (template) : noms distincts, mêmes invariants.

**Pas de placeholder bloquant** : les renderers de pages (Task 10 Step 3) et le refactor composant (Task 11 Step 1) sont décrits comme procédure car le markup réutilise la DA propre à chaque composant existant — le worker dispose des signatures exactes (Task 10) et du pattern (HomePage complet). C'est une adaptation mécanique, pas une invention d'architecture.
