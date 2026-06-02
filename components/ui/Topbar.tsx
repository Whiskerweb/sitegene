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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[rgb(var(--m-line))] bg-[rgb(var(--m-page)/0.72)] px-5 backdrop-blur-md md:px-8">
      <button
        onClick={onMenu}
        className="grid h-9 w-9 place-items-center rounded-xl text-[rgb(var(--m-muted))] hover:bg-[rgb(var(--m-overlay)/0.06)] hover:text-[rgb(var(--m-ink))] lg:hidden"
        aria-label="Menu"
      >
        <IconMenu />
      </button>
      <h2 className="text-[15px] font-semibold text-[rgb(var(--m-ink))]">{title}</h2>
      <div className="ml-auto flex items-center gap-3">{right}</div>
    </header>
  );
}
