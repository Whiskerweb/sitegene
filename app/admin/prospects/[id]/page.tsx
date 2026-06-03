import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Prospect, ProspectTimelineEntry } from "@/lib/types/db";
import {
  CategoryChip,
  ScoreBadge,
  StageBadge,
  StatusBadge,
  fmtDateTime,
  relativeTime,
} from "@/app/admin/_components";
import { ProspectActions } from "./ProspectActions";

export const dynamic = "force-dynamic";

type CodeEmbed = {
  token: string | null;
  status: string | null;
  sites: { slug: string | null; status: string | null } | null;
};

/** Libellé + couleur d'un évènement de timeline selon (channel, kind). */
function tlMeta(channel: string, kind: string): { label: string; dot: string } {
  if (channel === "email") {
    const m: Record<string, string> = {
      sent: "Email envoyé",
      delivered: "Email délivré",
      opened: "Email ouvert",
      clicked: "Lien email cliqué",
      bounced: "Email rejeté (bounce)",
      complained: "Plainte spam",
      unsubscribed: "Désinscription",
      failed: "Échec d'envoi",
    };
    return { label: m[kind] ?? `Email : ${kind}`, dot: "bg-violet-400" };
  }
  if (channel === "site") {
    const m: Record<string, string> = {
      reveal_opened: "A ouvert son reveal",
      button_click: "Clic sur le site",
      go_live_clicked: "A cliqué « mettre en ligne »",
      purchased: "Achat",
    };
    return { label: m[kind] ?? `Site : ${kind}`, dot: "bg-gold-400" };
  }
  if (channel === "payment") {
    const m: Record<string, string> = { initial_50: "Paiement initial (50 €)", topup: "Recharge crédits" };
    return { label: m[kind] ?? `Paiement : ${kind}`, dot: "bg-mint-400" };
  }
  if (channel === "note") return { label: `Demande de modif (${kind})`, dot: "bg-faint" };
  if (channel === "stage") return { label: `Pipeline : ${kind}`, dot: "bg-violet-400" };
  return { label: kind, dot: "bg-faint" };
}

export default async function ProspectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: prospect }, { data: timeline }] = await Promise.all([
    supabase
      .from("prospects")
      .select("*, prospect_codes(token, status, sites(slug, status))")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("v_prospect_timeline")
      .select("ts, channel, kind, label, meta")
      .eq("prospect_id", id)
      .order("ts", { ascending: false })
      .limit(200),
  ]);

  if (!prospect) notFound();

  const p = prospect as unknown as Prospect & { prospect_codes: CodeEmbed[] | null };
  const code = p.prospect_codes?.[0];
  const events = (timeline ?? []) as unknown as Omit<ProspectTimelineEntry, "prospect_id">[];

  return (
    <div>
      <Link href="/admin/prospects" className="text-sm text-faint hover:text-paper">
        ← Tous les prospects
      </Link>

      {/* En-tête */}
      <div className="mt-3 rounded-2xl border border-line bg-ink-800 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[26px] font-semibold tracking-[-0.02em]">
              {p.first_name || p.company_name || "Prospect"}
            </h1>
            <div className="mt-1 text-sm text-muted">{p.email || "—"}</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <CategoryChip category={p.category} />
              <StageBadge stage={p.pipeline_stage} />
              <StatusBadge status={p.pipeline_status} />
              <ScoreBadge score={p.lead_score} />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 text-right text-[12px] text-faint">
            <span>Dernier signal : {relativeTime(p.last_signal_at)}</span>
            <span>Dernier contact : {relativeTime(p.last_contacted_at)}</span>
            <div className="flex gap-3">
              {code?.token ? (
                <a href={`/r/${code.token}`} target="_blank" rel="noreferrer" className="text-violet-400 hover:text-violet-500">
                  voir le reveal ↗
                </a>
              ) : null}
              {code?.sites?.slug ? (
                <a href={`/s/${code.sites.slug}`} target="_blank" rel="noreferrer" className="text-violet-400 hover:text-violet-500">
                  /s/{code.sites.slug} ↗
                </a>
              ) : null}
            </div>
          </div>
        </div>
        {p.lost_reason ? (
          <div className="mt-3 text-[12px] text-faint">Motif de perte : {p.lost_reason}</div>
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Timeline */}
        <div className="rounded-2xl border border-line bg-ink-800 p-6">
          <h2 className="font-display text-lg font-semibold">Historique</h2>
          <p className="mt-1 text-[12px] text-faint">
            Tous les signaux fusionnés : emails, visites du reveal, paiements, modifs, transitions.
          </p>
          {events.length === 0 ? (
            <p className="mt-6 text-sm text-faint">Aucun évènement pour l&apos;instant.</p>
          ) : (
            <ol className="mt-5 space-y-3">
              {events.map((e, i) => {
                const m = tlMeta(e.channel, e.kind);
                return (
                  <li key={i} className="flex gap-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.dot}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-paper">{m.label}</div>
                      {e.label && e.label !== e.kind ? (
                        <div className="truncate text-[12px] text-faint">{e.label}</div>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-[11px] text-faint">{fmtDateTime(e.ts)}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Infos éditables + actions */}
        <ProspectActions prospect={p} />
      </div>
    </div>
  );
}
