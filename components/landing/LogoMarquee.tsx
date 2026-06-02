"use client";

import { motion } from "framer-motion";

const BRANDS = [
  "VOGUE",
  "LEICA",
  "CANON",
  "KINFOLK",
  "HASSELBLAD",
  "AESOP",
  "FOAM",
  "NATIONAL GEOGRAPHIC",
];

const DOUBLE_BRANDS = [...BRANDS, ...BRANDS];

export default function LogoMarquee() {
  return (
    <section className="bg-ink-800 border-y border-[var(--line)] py-12 overflow-hidden">
      <div className="mx-auto max-w-[1240px] px-6">
        <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-faint">
          La qualité de site que ces marques attendent — pour vous, en 30 secondes.
        </p>
      </div>

      <div className="marquee-mask marquee-paused relative w-full overflow-hidden">
        <div className="marquee-track flex gap-16 items-center">
          {DOUBLE_BRANDS.map((b, index) => (
            <span
              key={`${b}-${index}`}
              className="font-display text-[26px] md:text-[36px] font-semibold tracking-[0.2em] text-faint/45 hover:text-white transition duration-300 select-none whitespace-nowrap"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
