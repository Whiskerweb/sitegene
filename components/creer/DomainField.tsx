"use client";

/**
 * Sélecteur de domaine avec autocomplétion (étape « pitch » de /creer). L'utilisateur
 * tape, des suggestions filtrées du catalogue apparaissent ; il en choisit une au
 * clavier (↑/↓ + Entrée) ou à la souris. Valeur libre autorisée : un domaine absent
 * du catalogue est conservé tel quel (`onSelect(null)`). Combobox maison léger (aucune
 * dépendance), stylé avec les tokens `.akyra`.
 */

import { useId, useRef, useState } from "react";
import { searchDomains, findDomain, type DomainEntry } from "@/lib/foundry/domain-catalog";

const FAMILY_LABEL: Record<string, string> = {
  musicien: "Musique",
  fitness: "Sport & forme",
  coach: "Coaching",
  "bien-etre": "Bien-être",
  photographe: "Image",
  artisan: "Artisanat & bâtiment",
  restaurant: "Restauration",
  beaute: "Beauté",
  conseil: "Services & conseil",
  autre: "Autre",
};

export default function DomainField({
  value,
  onChange,
  onSelect,
  placeholder = "Ex. Musicien, Coach en développement personnel, Électricien…",
}: {
  value: string;
  onChange: (label: string) => void;
  onSelect: (entry: DomainEntry | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listId = useId();

  const suggestions = searchDomains(value);

  function choose(entry: DomainEntry) {
    onChange(entry.label);
    onSelect(entry);
    setOpen(false);
  }

  function commitFree() {
    // Valeur libre : on conserve la saisie, en récupérant l'entrée exacte si elle
    // correspond pile à un label du catalogue (sinon null).
    onSelect(findDomain(value) ?? null);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && suggestions[activeIdx]) {
        e.preventDefault();
        choose(suggestions[activeIdx]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIdx(0);
          onSelect(null); // ré-édition → invalide l'entrée précédemment choisie
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Léger délai pour laisser le clic d'un item se déclencher avant la fermeture.
          blurTimer.current = setTimeout(commitFree, 120);
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        maxLength={80}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && suggestions[activeIdx] ? `${listId}-${activeIdx}` : undefined}
        className="mt-2 w-full rounded-2xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] px-4 py-3.5 text-[15px] outline-none transition focus:border-[rgb(var(--m-accent))]"
      />

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1.5 max-h-72 w-full overflow-auto rounded-2xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] py-1.5 shadow-cloud"
          // Empêche le blur de l'input pendant le clic (le mousedown garde le focus).
          onMouseDown={(e) => e.preventDefault()}
        >
          {suggestions.map((entry, i) => (
            <li
              key={entry.label}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => {
                if (blurTimer.current) clearTimeout(blurTimer.current);
                choose(entry);
              }}
              className={`flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2 text-[14px] ${
                i === activeIdx ? "bg-[rgb(var(--m-elevated))]" : ""
              }`}
            >
              <span className="text-[rgb(var(--m-ink))]">{entry.label}</span>
              <span className="shrink-0 text-[11.5px] text-[rgb(var(--m-faint))]">
                {FAMILY_LABEL[entry.tradeId] ?? ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
