import type { ReactNode } from "react";

type Tone = "plain" | "lav" | "pink" | "mint" | "blue";

// Toutes les teintes partagent la même surface sombre ; l'accent passe
// désormais par le contenu (icône/valeur), pas par un fond coloré criard.
const toneAccent: Record<Tone, string> = {
  plain: "",
  lav: "",
  pink: "",
  mint: "",
  blue: "",
};

export function Card({
  tone = "plain",
  className = "",
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  void toneAccent[tone];
  return (
    <div
      className={`rounded-2xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] ${className}`}
    >
      {children}
    </div>
  );
}
