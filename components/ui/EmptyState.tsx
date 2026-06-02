import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[rgb(var(--m-line))] bg-[rgb(var(--m-overlay)/0.02)] p-12 text-center">
      {icon && (
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-violet-500/12 text-violet-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[rgb(var(--m-ink))]">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[rgb(var(--m-muted))]">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
