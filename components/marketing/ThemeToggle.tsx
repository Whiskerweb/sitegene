"use client";

import { Sun, Monitor, Moon } from "lucide-react";
import { useMarketingTheme, type ThemeMode } from "./theme";

const OPTIONS: { mode: ThemeMode; Icon: typeof Sun; label: string }[] = [
  { mode: "light", Icon: Sun, label: "Thème clair" },
  { mode: "system", Icon: Monitor, label: "Thème système" },
  { mode: "dark", Icon: Moon, label: "Thème sombre" },
];

export default function ThemeToggle({ size = 13 }: { size?: number }) {
  const { mode, setMode } = useMarketingTheme();
  return (
    <div className="flex items-center rounded-full border border-[rgb(var(--m-line))] bg-[rgb(var(--m-overlay)/0.04)] p-0.5">
      {OPTIONS.map(({ mode: m, Icon, label }) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          aria-label={label}
          aria-pressed={mode === m}
          className={`grid h-6 w-6 place-items-center rounded-full transition-colors ${
            mode === m
              ? "bg-[rgb(var(--m-overlay)/0.1)] text-[rgb(var(--m-ink))]"
              : "text-[rgb(var(--m-faint))] hover:text-[rgb(var(--m-ink))]"
          }`}
        >
          <Icon size={size} />
        </button>
      ))}
    </div>
  );
}
