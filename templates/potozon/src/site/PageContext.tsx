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
