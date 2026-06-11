"use client";

import type { ReactNode } from "react";
import { IconMenu } from "./icons";

export function Topbar({
  title,
  right,
  onMenu,
  onToggleSidebar,
  collapsed,
}: {
  title: string;
  right?: ReactNode;
  onMenu?: () => void;
  onToggleSidebar?: () => void;
  collapsed?: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-gray-100 bg-[#fafafa]/80 px-4 backdrop-blur-md md:px-8">
      {/* Menu mobile */}
      <button
        onClick={onMenu}
        className="grid h-9 w-9 place-items-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden"
        aria-label="Menu"
      >
        <IconMenu />
      </button>

      {/* Rétraction de la sidebar (desktop) */}
      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          aria-label={collapsed ? "Déplier le menu" : "Réduire le menu"}
          title={collapsed ? "Déplier le menu" : "Réduire le menu"}
          className="hidden h-9 w-9 place-items-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:grid"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
            <rect
              x="3"
              y="4"
              width="18"
              height="16"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <line
              x1="9.5"
              y1="4"
              x2="9.5"
              y2="20"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </svg>
        </button>
      )}

      <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-gray-900">
        {title}
      </h2>
      <div className="ml-auto flex items-center gap-3">{right}</div>
    </header>
  );
}
