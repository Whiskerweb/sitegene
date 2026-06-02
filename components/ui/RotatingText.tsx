"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { EASE } from "@/lib/motion";

/**
 * Fait défiler une liste de messages avec un fondu/glissement vertical fluide.
 * Respecte prefers-reduced-motion (le navigateur coupe l'animation via CSS si
 * besoin ; ici on garde l'enchaînement mais discret).
 */
export default function RotatingText({
  messages,
  intervalMs = 2800,
  className = "",
}: {
  messages: string[];
  intervalMs?: number;
  className?: string;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (messages.length < 2) return;
    const id = setInterval(
      () => setI((p) => (p + 1) % messages.length),
      intervalMs,
    );
    return () => clearInterval(id);
  }, [messages.length, intervalMs]);

  return (
    <span className="relative inline-grid overflow-hidden align-middle">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={i}
          className={className}
          style={{ gridArea: "1 / 1" }}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          {messages[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
