import { Badge, toneDot } from "./Badge";
import {
  noteStatusMeta,
  siteStatusMeta,
  jobStatusMeta,
  type StatusMeta,
} from "@/lib/ui/status";

type Kind = "note" | "site" | "job";

const maps: Record<Kind, Record<string, StatusMeta>> = {
  note: noteStatusMeta,
  site: siteStatusMeta,
  job: jobStatusMeta,
};

export function StatusPill({
  status,
  kind = "note",
}: {
  status: string;
  kind?: Kind;
}) {
  const meta = maps[kind][status] ?? { label: status, tone: "neutral" as const };
  return (
    <Badge tone={meta.tone}>
      <span className={`h-1.5 w-1.5 rounded-full ${toneDot[meta.tone]} dot-live`} />
      {meta.label}
    </Badge>
  );
}
