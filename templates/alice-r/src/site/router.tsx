import { useEffect, useState, type ReactNode } from "react";
import type { SiteContentV2, Page } from "./PageContext";

/**
 * Routeur client minimal, AGNOSTIQUE au point de montage.
 * Le même bundle est servi sous plusieurs préfixes :
 *   - sous-domaine racine :   /<reste>
 *   - preview/dev :           /s/<slug>/<reste>
 *   - reveal pré-paiement :   /r/<token>/<reste>
 * Plutôt que de coder un motif `/s/` en dur, on dérive le préfixe à partir des
 * slugs de pages connus : on cherche la page non-home dont le slug est un
 * suffixe (à une frontière `/`) du pathname courant. Le reste = basePrefix
 * (= point de montage). Si rien ne matche → home + basePrefix = pathname.
 *
 * Le contenu est enregistré au niveau module par `useRoute` (toujours monté en
 * tête de l'app), pour que `navigate`/`Link` restent appelables avec leur
 * signature historique (sans passer `content`).
 */

let REGISTERED: SiteContentV2 | null = null;

interface Match {
  page: Page;
  basePrefix: string;
}

function homePage(content: SiteContentV2): Page {
  return content.pages.find((p) => p.slug === "/") ?? content.pages[0];
}

/**
 * Détecte la page + le préfixe de montage depuis un pathname.
 * On choisit le slug non-home le plus long qui est un suffixe du pathname à
 * une frontière `/` (pour éviter de matcher `/folio` dans `/portfolio`).
 */
function detect(content: SiteContentV2, rawPathname: string): Match {
  const pathname = rawPathname || "/";
  const candidates = content.pages
    .filter((p) => p.slug && p.slug !== "/")
    .sort((a, b) => b.slug.length - a.slug.length); // plus long d'abord

  for (const p of candidates) {
    const slug = p.slug; // ex. "/portfolio"
    if (pathname === slug) {
      // monté à la racine du sous-domaine
      return { page: p, basePrefix: "" };
    }
    if (pathname.endsWith(slug)) {
      // Le slug commence par "/", donc endsWith garantit déjà la frontière de
      // segment (ex. "/folio" ne matche PAS "/portfolio"). basePrefix = tout ce
      // qui précède le slug, ex. "/r/<token>" ou "/s/<slug>" ou "".
      const start = pathname.length - slug.length;
      return { page: p, basePrefix: pathname.slice(0, start) };
    }
  }

  // Aucun slug ne matche → home. Le pathname EST le point de montage.
  let basePrefix = pathname;
  if (basePrefix.length > 1 && basePrefix.endsWith("/")) {
    basePrefix = basePrefix.slice(0, -1);
  }
  if (basePrefix === "/") basePrefix = "";
  return { page: homePage(content), basePrefix };
}

/** Cible absolue pour un `to` interne, depuis le pathname courant. */
function resolveHref(pathname: string, to: string): string {
  if (to.startsWith("#")) return pathname + to;
  if (!REGISTERED) return to; // pas encore monté : repli sûr
  const { basePrefix } = detect(REGISTERED, pathname);
  const target = basePrefix + (to === "/" ? "" : to);
  return target || "/";
}

/** Navigation interne : history.pushState + event custom (capté par useRoute). */
export function navigate(to: string) {
  const target = resolveHref(window.location.pathname, to);
  window.history.pushState({}, "", target);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function useRoute(content: SiteContentV2): Page {
  REGISTERED = content;
  const [page, setPage] = useState<Page>(
    () => detect(content, typeof window !== "undefined" ? window.location.pathname : "/").page,
  );
  useEffect(() => {
    REGISTERED = content;
    const onNav = () => setPage(detect(content, window.location.pathname).page);
    window.addEventListener("popstate", onNav);
    return () => window.removeEventListener("popstate", onNav);
  }, [content]);
  return page;
}

/** Lien interne : <a> réel (SEO + clic-droit) qui intercepte le clic gauche. */
export function Link({ to, children, ...rest }: { to: string; children: ReactNode } & Record<string, unknown>) {
  const href =
    typeof window !== "undefined" ? resolveHref(window.location.pathname, to) : to;
  return (
    <a
      href={href}
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
