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
      className="mx-0 h-14 gap-3 border-sky-300 bg-white/60 shadow-cloud-sm backdrop-blur-md"
      itemClassName="bg-brand text-white"
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
