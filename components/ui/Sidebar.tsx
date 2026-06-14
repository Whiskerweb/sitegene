"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { NavItem } from "./NavItem";
import { AkyraMark } from "./Logo";

export function Sidebar({
  items,
  brand = "Akyra",
  roleLabel,
  footer,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: {
  items: NavItem[];
  brand?: string;
  roleLabel?: string;
  footer?: ReactNode;
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const roots = new Set(["/dashboard", "/admin"]);
  const isActive = (href: string) =>
    roots.has(href) ? pathname === href : pathname.startsWith(href);

  return (
    <div className="relative flex h-full flex-col bg-[#fafafa]">
      {/* Bloc logo — carré + nom + sous-titre, façon Traaaction */}
      <Link
        href={items[0]?.href ?? "/"}
        onClick={onNavigate}
        className={`flex h-16 shrink-0 items-center border-b border-gray-200/60 transition-colors hover:bg-gray-100/50 ${
          collapsed ? "justify-center px-0" : "gap-2.5 px-4"
        }`}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-gray-200/70">
          <AkyraMark size={20} tone="light" />
        </span>
        {!collapsed && (
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-[13.5px] font-semibold tracking-[-0.01em] text-gray-900">
                {brand}
              </span>
              {roleLabel && (
                <span className="rounded-md bg-violet-50 px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-[0.06em] text-violet-700 ring-1 ring-inset ring-violet-200/60">
                  {roleLabel}
                </span>
              )}
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-gray-400">
              Dashboard
            </span>
          </span>
        )}
      </Link>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto py-3 ${collapsed ? "px-2" : "px-2.5"}`}>
        <ul className="space-y-[3px]">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center rounded-lg text-[13px] transition-colors duration-150 ${
                    collapsed ? "justify-center px-2 py-2.5" : "justify-between px-2.5 py-2"
                  } ${
                    active
                      ? "font-medium text-violet-900"
                      : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
                  }`}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-lg bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_1px_rgba(16,24,40,0.02)] ring-1 ring-gray-200/70"
                    />
                  )}
                  <span
                    className={`relative flex min-w-0 items-center ${
                      collapsed ? "" : "gap-2.5"
                    }`}
                  >
                    <span
                      className={
                        active
                          ? "text-violet-600"
                          : "text-gray-400 group-hover:text-gray-700"
                      }
                    >
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="truncate tracking-[-0.005em]">{item.label}</span>
                    )}
                  </span>
                  {!collapsed &&
                    item.badge != null &&
                    item.badge !== 0 &&
                    item.badge !== "" && (
                      <span
                        className={`relative rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          active
                            ? "bg-violet-100 text-violet-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {footer && (
        <div className={`border-t border-gray-200/60 py-2.5 ${collapsed ? "px-2" : "px-2.5"}`}>
          {footer}
        </div>
      )}

      {/* Bouton de rétraction flottant (desktop) — façon Traaaction */}
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Déplier le menu" : "Réduire le menu"}
          className="absolute top-1/2 -right-3 z-50 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-[0_2px_6px_rgba(16,24,40,0.08)] transition-colors hover:border-gray-300 hover:text-gray-700"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            width="14"
            height="14"
            className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
          >
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
