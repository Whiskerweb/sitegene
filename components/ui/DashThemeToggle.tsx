"use client";

import { Sun, Monitor, Moon } from "lucide-react";

export type DashThemeMode = "light" | "dark" | "system";

const OPTIONS: { mode: DashThemeMode; Icon: typeof Sun; label: string }[] = [
  { mode: "light", Icon: Sun, label: "Thème clair" },
  { mode: "system", Icon: Monitor, label: "Thème système" },
  { mode: "dark", Icon: Moon, label: "Thème sombre" },
];

/** Toggle de thème du dashboard (clair / système / sombre). */
export function DashThemeToggle({
  mode,
  setMode,
}: {
  mode: DashThemeMode;
  setMode: (m: DashThemeMode) => void;
}) {
  return (
    <div className="flex items-center rounded-full border border-sky-300 bg-white/50 p-0.5">
      {OPTIONS.map(({ mode: m, Icon, label }) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          aria-label={label}
          aria-pressed={mode === m}
          className={`grid h-7 w-7 place-items-center rounded-full transition-colors ${
            mode === m ? "bg-blue text-brand" : "text-mist hover:text-night"
          }`}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}
