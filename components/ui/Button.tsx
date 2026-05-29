"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "ghost" | "subtle" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-cloud-sm hover:bg-brand-700",
  ghost: "border border-sky-300 bg-white/60 text-slate hover:bg-sky-100 hover:text-night",
  subtle: "bg-surface-2 text-night hover:bg-sky-200",
  danger: "bg-danger text-white hover:opacity-90",
};
const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-[15px]",
  lg: "px-6 py-3.5 text-[15px]",
};

type Props = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  href?: string;
  target?: string;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  href,
  target,
  className = "",
  children,
  ...props
}: Props) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    if (target) {
      return (
        <a href={href} target={target} rel="noreferrer" className={cls}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} disabled={loading || props.disabled} {...props}>
      {loading && <Spinner size={16} />}
      {children}
    </button>
  );
}
