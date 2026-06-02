import { FAQ_ITEMS, type FaqItem } from "@/lib/faq";

/** Accordéon FAQ — tokens marketing scopés. */
export default function FaqAccordion({ items = FAQ_ITEMS }: { items?: FaqItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((f) => (
        <details
          key={f.q}
          className="group rounded-[18px] border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] px-6 transition-colors duration-300 hover:border-[rgb(var(--m-accent)/0.3)] [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="flex cursor-pointer items-center justify-between gap-4 py-5 text-[16px] font-medium text-[rgb(var(--m-ink))]">
            {f.q}
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[rgb(var(--m-overlay)/0.15)] text-lg text-[rgb(var(--m-muted))] transition-all duration-300 group-open:rotate-45 group-open:border-[rgb(var(--m-accent))] group-open:text-[rgb(var(--m-accent))]">
              +
            </span>
          </summary>
          <p className="pb-6 pr-10 text-[14px] leading-[1.65] text-[rgb(var(--m-muted))]">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
