"use client";

import type { ReactNode } from "react";
import { IconMenu } from "./icons";

export function Topbar({
  title,
  right,
  onMenu,
}: {
  title: string;
  right?: ReactNode;
  onMenu?: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-sky-300 bg-white/70 px-5 backdrop-blur-md md:px-8">
      <button
        onClick={onMenu}
        className="grid h-9 w-9 place-items-center rounded-xl text-slate hover:bg-sky-100 lg:hidden"
        aria-label="Menu"
      >
        <IconMenu />
      </button>
      <h2 className="font-archivo text-[15px] font-semibold text-night">{title}</h2>
      <div className="ml-auto flex items-center gap-3">{right}</div>
    </header>
  );
}
