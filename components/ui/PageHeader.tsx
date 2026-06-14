import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1
          className="text-[26px] font-bold tracking-tight text-[rgb(var(--m-ink))] md:text-[30px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-[15px] text-[rgb(var(--m-muted))]">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
