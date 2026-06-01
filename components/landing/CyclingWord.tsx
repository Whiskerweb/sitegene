"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { EASE } from "@/lib/motion";

/**
 * Mot qui défile verticalement (photographe → musicien → artisan…).
 * Superposition en grid pour éviter le saut vertical ; mode "wait" pour un
 * relais propre. Respecte prefers-reduced-motion (CSS coupe l'animation).
 */
export default function CyclingWord({
  words,
  intervalMs = 2200,
  className = "",
}: {
  words: string[];
  intervalMs?: number;
  className?: string;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (words.length < 2) return;
    const id = setInterval(
      () => setI((p) => (p + 1) % words.length),
      intervalMs,
    );
    return () => clearInterval(id);
  }, [words.length, intervalMs]);

  return (
    <span
      className="relative inline-grid overflow-hidden align-bottom"
      style={{ paddingBottom: "0.14em" }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={i}
          className={className}
          style={{ gridArea: "1 / 1" }}
          initial={{ y: "105%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-105%", opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
