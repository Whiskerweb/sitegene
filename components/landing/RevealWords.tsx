"use client";

import { motion } from "framer-motion";
import { headingWord } from "@/lib/motion";

type Props = {
  text: string;
  /** Indices de mots (0-based) à colorer en accent. */
  accent?: number[];
  /** Indices de mots à colorer en or. */
  gold?: number[];
  /** Classe appliquée aux mots `accent` (défaut: `.accent`). Ex: "text-brand". */
  accentClass?: string;
  className?: string;
  /** "load" anime au montage, "view" au scroll. */
  trigger?: "load" | "view";
  as?: "h1" | "h2" | "h3" | "p";
};

export default function RevealWords({
  text,
  accent = [],
  gold = [],
  accentClass = "accent",
  className = "",
  trigger = "view",
  as = "h2",
}: Props) {
  const words = text.split(" ");
  const Tag = motion[as];
  const animateProps =
    trigger === "load"
      ? { initial: "hidden" as const, animate: "visible" as const }
      : {
          initial: "hidden" as const,
          whileInView: "visible" as const,
          viewport: { once: true, margin: "-80px" },
        };

  return (
    <Tag className={className} {...animateProps}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-flex overflow-hidden align-bottom"
          style={{ paddingBottom: "0.08em" }}
        >
          <motion.span
            custom={i}
            variants={headingWord}
            className={
              accent.includes(i)
                ? accentClass
                : gold.includes(i)
                  ? "accent-gold"
                  : undefined
            }
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
