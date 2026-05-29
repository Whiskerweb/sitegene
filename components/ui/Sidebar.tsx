"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { NavItem } from "./NavItem";

export function Sidebar({
  items,
  brand = "Sitegene",
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
        className="mb-7 flex items-center gap-2 px-2 pt-2"
      >
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand text-sm font-bold text-white">
          S
        </span>
        <span className="font-archivo text-lg font-bold tracking-tight text-night">
          {brand}
        </span>
        {roleLabel && (
          <span className="ml-1 rounded-full bg-sky-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate">
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
              className={`flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-[15px] font-medium transition-colors ${
                active
                  ? "bg-blue text-brand"
                  : "text-slate hover:bg-sky-100 hover:text-night"
              }`}
            >
              <span className={active ? "text-brand" : "text-mist"}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge !== 0 && item.badge !== "" && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    active ? "bg-brand text-white" : "bg-surface text-slate"
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
