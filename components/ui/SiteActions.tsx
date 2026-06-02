"use client";

import { useState } from "react";
import { AnimatedDock } from "./animated-dock";
import { IconEdit, IconExternal, IconCopy, IconCheck } from "./icons";

/**
 * Barre d'actions de la carte « Mon site », présentée comme un dock animé
 * (magnification au survol). Trois actions majeures : Modifier, Voir en grand
 * (action principale, icône agrandie) et Copier le lien.
 */
export function SiteActions({
  editHref,
  viewHref,
  link,
}: {
  editHref: string;
  viewHref: string;
  link: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <AnimatedDock
      className="mx-0 h-14 gap-3 border-[rgb(var(--m-line))] bg-[rgb(var(--m-overlay)/0.06)] backdrop-blur-md"
      itemClassName="bg-violet-500 text-white"
      items={[
        {
          link: editHref,
          label: "Modifier mon site",
          Icon: <IconEdit size={20} />,
        },
        {
          link: viewHref,
          label: "Voir en grand",
          Icon: <IconExternal size={24} />,
        },
        {
          onClick: copy,
          label: copied ? "Lien copié" : "Copier le lien",
          Icon: copied ? <IconCheck size={20} /> : <IconCopy size={20} />,
        },
      ]}
    />
  );
}
