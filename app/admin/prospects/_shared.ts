import type { PipelineStage, PipelineStatus } from "@/lib/types/db";

/** Ligne prospect telle qu'affichée dans le CRM (tableau + kanban). */
export type ProspectRow = {
  id: string;
  first_name: string | null;
  email: string | null;
  category: string | null;
  company_name: string | null;
  city: string | null;
  pipeline_stage: PipelineStage;
  pipeline_status: PipelineStatus;
  lead_score: number;
  last_signal_at: string | null;
  last_contacted_at: string | null;
  lost_reason: string | null;
  created_at: string;
  token: string | null;
  slug: string | null;
};

export type SortKey = "score" | "recent" | "signal";
