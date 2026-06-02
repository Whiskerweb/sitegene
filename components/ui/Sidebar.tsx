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
}: {
  items: NavItem[];
  brand?: string;
  roleLabel?: string;
  footer?: ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const roots = new Set(["/dashboard", "/admin"]);
  const isActive = (href: string) =>
    roots.has(href) ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col p-4">
      <Link
        href={items[0]?.href ?? "/"}
        onClick={onNavigate}
        className="mb-8 flex items-center gap-2.5 px-2 pt-2 text-[rgb(var(--m-ink))]"
      >
        <AkyraMark size={26} className="text-violet-400" />
        <span className="text-[18px] font-semibold tracking-tight">{brand}</span>
        {roleLabel && (
          <span className="ml-1 rounded-full bg-[rgb(var(--m-overlay)/0.08)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--m-faint))]">
            {roleLabel}
          </span>
        )}
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors ${
                active
                  ? "bg-violet-500/12 text-[rgb(var(--m-ink))]"
                  : "text-[rgb(var(--m-muted))] hover:bg-[rgb(var(--m-overlay)/0.05)] hover:text-[rgb(var(--m-ink))]"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-violet-400" />
              )}
              <span className={active ? "text-violet-400" : "text-[rgb(var(--m-faint))] group-hover:text-[rgb(var(--m-muted))]"}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge !== 0 && item.badge !== "" && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    active
                      ? "bg-violet-400 text-[#0a0a14]"
                      : "bg-[rgb(var(--m-overlay)/0.08)] text-[rgb(var(--m-faint))]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {footer && <div className="mt-auto pt-4">{footer}</div>}
    </div>
  );
}
