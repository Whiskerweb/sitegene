import { Check, Circle, Loader2, RotateCw } from "lucide-react";

type SectionStatus = "pending" | "streaming" | "done" | "error";

interface Section {
  key: string;
  title: string;
  status: SectionStatus;
}

interface SectionChecklistProps {
  headerReady: boolean;
  sections: Section[];
}

export default function SectionChecklist({ headerReady, sections }: SectionChecklistProps) {
  return (
    <ul className="flex flex-col gap-2 py-1">
      {/* Première ligne : Style & en-tête */}
      <li className="flex items-center gap-2 text-sm">
        {headerReady ? (
          <Check className="h-4 w-4 flex-none text-emerald-500" />
        ) : (
          <Loader2 className="h-4 w-4 flex-none animate-spin text-violet-500" />
        )}
        <span className="flex-1 font-medium text-slate-800">Style &amp; en-tête</span>
        <span
          className={
            headerReady
              ? "text-xs font-medium text-emerald-600"
              : "text-xs font-medium text-violet-500"
          }
        >
          {headerReady ? "fait" : "Création du style…"}
        </span>
      </li>

      {/* Lignes par section */}
      {sections.map((section) => (
        <li key={section.key} className="flex items-center gap-2 text-sm">
          {section.status === "done" && (
            <Check className="h-4 w-4 flex-none text-emerald-500" />
          )}
          {section.status === "streaming" && (
            <Loader2 className="h-4 w-4 flex-none animate-spin text-violet-500" />
          )}
          {section.status === "error" && (
            <RotateCw className="h-4 w-4 flex-none text-amber-500" />
          )}
          {section.status === "pending" && (
            <Circle className="h-4 w-4 flex-none text-slate-300" />
          )}

          <span
            className={
              section.status === "pending"
                ? "flex-1 text-slate-400"
                : "flex-1 text-slate-800"
            }
          >
            {section.title}
          </span>

          <span
            className={
              section.status === "done"
                ? "text-xs font-medium text-emerald-600"
                : section.status === "streaming"
                  ? "text-xs font-medium text-violet-500"
                  : section.status === "error"
                    ? "text-xs font-medium text-amber-500"
                    : "text-xs text-slate-400"
            }
          >
            {section.status === "done" && "fait"}
            {section.status === "streaming" && "en cours…"}
            {section.status === "error" && "à reprendre"}
            {section.status === "pending" && "à venir"}
          </span>
        </li>
      ))}
    </ul>
  );
}
