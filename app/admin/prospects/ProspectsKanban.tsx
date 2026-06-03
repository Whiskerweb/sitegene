"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PIPELINE_STAGES, LOST_REASONS, leadTemperature } from "@/lib/crm/stages";
import { categoryLabel } from "@/lib/crm/categories";
import { relativeTime } from "@/app/admin/_components";
import { setProspectStatus } from "@/app/admin/_actions";
import type { ProspectRow } from "./_shared";
import type { PipelineStage } from "@/lib/types/db";

export function ProspectsKanban({ prospects }: { prospects: ProspectRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [lostFor, setLostFor] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const byStage = new Map<PipelineStage, ProspectRow[]>();
  for (const s of PIPELINE_STAGES) byStage.set(s.id, []);
  for (const p of prospects) byStage.get(p.pipeline_stage)?.push(p);
  for (const list of byStage.values()) list.sort((a, b) => b.lead_score - a.lead_score);

  function act(id: string, status: "PERDU" | "NON_QUALIFIE" | "EN_COURS", reason?: string | null) {
    setMenuFor(null);
    setLostFor(null);
    startTransition(async () => {
      const res = await setProspectStatus(id, status, reason ?? null);
      if (!res.ok) setErr(res.error);
      else {
        setErr(null);
        router.refresh();
      }
    });
  }

  return (
    <div>
      {err ? (
        <div className="mb-3 rounded-lg border border-[#ef6d6d]/30 bg-ink-800 px-3 py-2 text-sm text-[#ef6d6d]">
          {err}
        </div>
      ) : null}

      <div className="flex gap-3 overflow-x-auto pb-3">
        {PIPELINE_STAGES.map((stage) => {
          const list = byStage.get(stage.id) ?? [];
          return (
            <div key={stage.id} className="flex w-[250px] shrink-0 flex-col">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className={`text-[12px] font-semibold uppercase tracking-wider ${stage.cls.split(" ")[0]}`}>
                  {stage.label}
                </span>
                <span className="text-[12px] text-faint">{list.length}</span>
              </div>

              <div className="flex flex-col gap-2">
                {list.map((p) => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={() => setDragId(p.id)}
                    onDragEnd={() => setDragId(null)}
                    className="group relative rounded-xl border border-line bg-ink-800 p-3 transition-colors hover:border-violet-400/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/admin/prospects/${p.id}`} className="min-w-0 flex-1">
                        <div className="truncate font-medium text-paper hover:text-violet-400">
                          {p.first_name || p.company_name || "—"}
                        </div>
                        <div className="truncate text-[11px] text-faint">{p.email || "—"}</div>
                      </Link>
                      <button
                        type="button"
                        onClick={() => setMenuFor(menuFor === p.id ? null : p.id)}
                        className="shrink-0 rounded px-1.5 text-faint hover:text-paper"
                        aria-label="Actions"
                      >
                        ⋯
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-faint">{categoryLabel(p.category)}</span>
                      <span className={`text-[11px] font-medium ${leadTemperature(p.lead_score).cls}`}>
                        {leadTemperature(p.lead_score).label} · {p.lead_score}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-faint">
                      <span>{relativeTime(p.last_signal_at)}</span>
                      {p.token ? (
                        <a
                          href={`/r/${p.token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-violet-400 hover:text-violet-500"
                          onClick={(e) => e.stopPropagation()}
                        >
                          reveal ↗
                        </a>
                      ) : null}
                    </div>

                    {menuFor === p.id && (
                      <div className="absolute right-2 top-9 z-10 w-44 rounded-lg border border-line bg-ink-700 p-1 shadow-xl">
                        {lostFor === p.id ? (
                          <>
                            <div className="px-2 py-1 text-[11px] text-faint">Motif de perte :</div>
                            {LOST_REASONS.filter((r) => r.id !== "no_response").map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => act(p.id, "PERDU", r.id)}
                                className="block w-full rounded px-2 py-1.5 text-left text-[13px] text-muted hover:bg-ink-600 hover:text-paper"
                              >
                                {r.label}
                              </button>
                            ))}
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setLostFor(p.id)}
                              className="block w-full rounded px-2 py-1.5 text-left text-[13px] text-muted hover:bg-ink-600 hover:text-paper"
                            >
                              Marquer perdu…
                            </button>
                            <button
                              type="button"
                              onClick={() => act(p.id, "NON_QUALIFIE")}
                              className="block w-full rounded px-2 py-1.5 text-left text-[13px] text-muted hover:bg-ink-600 hover:text-paper"
                            >
                              Non qualifié
                            </button>
                            <Link
                              href={`/admin/prospects/${p.id}`}
                              className="block w-full rounded px-2 py-1.5 text-left text-[13px] text-violet-400 hover:bg-ink-600"
                            >
                              Ouvrir la fiche →
                            </Link>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {list.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-line/60 p-3 text-center text-[11px] text-faint/60">
                    vide
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Zones de dépôt terminales (glisser une carte ici) */}
      <div className="mt-2 grid grid-cols-2 gap-3">
        {(["PERDU", "NON_QUALIFIE"] as const).map((target) => (
          <div
            key={target}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dragId && act(dragId, target)}
            className={`rounded-xl border border-dashed p-3 text-center text-[12px] transition-colors ${
              dragId ? "border-[#ef6d6d]/50 text-[#ef6d6d]" : "border-line text-faint"
            }`}
          >
            Glisser ici → {target === "PERDU" ? "Perdu" : "Non qualifié"}
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-faint">
        Les étapes avancent automatiquement selon les signaux (email, visite du reveal, paiement). Tu
        n&apos;agis manuellement que pour disqualifier ou réactiver un prospect.
      </p>

      {isPending ? <span className="sr-only">mise à jour…</span> : null}
    </div>
  );
}
