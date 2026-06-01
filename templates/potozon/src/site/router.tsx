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
