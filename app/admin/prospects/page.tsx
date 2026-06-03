import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isTerminalStatus } from "@/lib/crm/stages";
import {
  CategoryChip,
  ScoreBadge,
  StageBadge,
  StatusBadge,
  relativeTime,
  fmtDate,
} from "@/app/admin/_components";
import { ProspectsFilters } from "./ProspectsFilters";
import { ProspectsKanban } from "./ProspectsKanban";
import type { ProspectRow, SortKey } from "./_shared";

export const dynamic = "force-dynamic";

type RawRow = Omit<ProspectRow, "token" | "slug"> & {
  prospect_codes: { token: string | null; sites: { slug: string | null } | null }[] | null;
};

type SP = {
  view?: string;
  cat?: string;
  stage?: string;
  status?: string;
  q?: string;
  sort?: string;
  all?: string;
};

const SELECT =
  "id, first_name, email, category, company_name, city, pipeline_stage, pipeline_status, lead_score, last_signal_at, last_contacted_at, lost_reason, created_at, prospect_codes(token, sites(slug))";

export default async function ProspectsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const view = sp.view === "table" ? "table" : "kanban";
  const sort: SortKey = sp.sort === "recent" ? "recent" : sp.sort === "signal" ? "signal" : "score";
  const showAll = sp.all === "1";
  const supabase = await createClient();

  let query = supabase.from("prospects").select(SELECT).limit(500);

  if (sp.cat) query = query.eq("category", sp.cat);
  if (sp.stage) query = query.eq("pipeline_stage", sp.stage);
  if (sp.status) query = query.eq("pipeline_status", sp.status);
  else if (!showAll) query = query.in("pipeline_status", ["EN_COURS", "GAGNE"]);

  if (sp.q) {
    const term = sp.q.replace(/[%,()]/g, " ").trim();
    if (term) query = query.or(`first_name.ilike.%${term}%,email.ilike.%${term}%,company_name.ilike.%${term}%`);
  }

  if (sort === "recent") query = query.order("created_at", { ascending: false });
  else if (sort === "signal") query = query.order("last_signal_at", { ascending: false, nullsFirst: false });
  else
    query = query
      .order("lead_score", { ascending: false })
      .order("last_signal_at", { ascending: false, nullsFirst: false });

  const { data, error } = await query;

  const rows: ProspectRow[] = ((data ?? []) as unknown as RawRow[]).map((r) => {
    const code = r.prospect_codes?.[0];
    return {
      id: r.id,
      first_name: r.first_name,
      email: r.email,
      category: r.category,
      company_name: r.company_name,
      city: r.city,
      pipeline_stage: r.pipeline_stage,
      pipeline_status: r.pipeline_status,
      lead_score: r.lead_score,
      last_signal_at: r.last_signal_at,
      last_contacted_at: r.last_contacted_at,
      lost_reason: r.lost_reason,
      created_at: r.created_at,
      token: code?.token ?? null,
      slug: code?.sites?.slug ?? null,
    };
  });

  const nbClients = rows.filter((r) => r.pipeline_status === "GAGNE").length;
  const nbHot = rows.filter((r) => r.lead_score >= 40 && !isTerminalStatus(r.pipeline_status)).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em]">Prospects</h1>
          <p className="mt-1 text-sm text-muted">
            {rows.length} affichés · {nbClients} clients · {nbHot} chauds 🔥 — CRM auto-mis-à-jour
          </p>
        </div>
        <Link
          href="/admin/new"
          className="btn-violet rounded-full px-5 py-2.5 text-sm font-semibold text-white"
        >
          + Nouveau site
        </Link>
      </div>

      <div className="mt-6">
        <ProspectsFilters view={view} sp={sp} showAll={showAll} sort={sort} />
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl border border-[#ef6d6d]/30 bg-ink-800 p-6 text-sm text-[#ef6d6d]">
          Erreur de chargement : {error.message}
          <div className="mt-1 text-faint">
            (As-tu appliqué les migrations 0011-0013 ? Les colonnes CRM sont peut-être absentes.)
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-10 rounded-[20px] border border-dashed border-line bg-ink-800 p-12 text-center">
          <p className="text-muted">Aucun prospect ne correspond à ces filtres.</p>
        </div>
      ) : view === "table" ? (
        <ProspectsTable rows={rows} />
      ) : (
        <div className="mt-6">
          <ProspectsKanban prospects={rows} />
        </div>
      )}
    </div>
  );
}

/** Vue Tableau (style Airtable) — rendu serveur, dense et triable. */
function ProspectsTable({ rows }: { rows: ProspectRow[] }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-[20px] border border-line">
      <table className="w-full min-w-[920px] text-sm">
        <thead className="bg-ink-800 text-left text-faint">
          <tr>
            <th className="px-5 py-3 font-medium">Prospect</th>
            <th className="px-4 py-3 font-medium">Catégorie</th>
            <th className="px-4 py-3 font-medium">Étape</th>
            <th className="px-4 py-3 font-medium">Température</th>
            <th className="px-4 py-3 font-medium">Dernier signal</th>
            <th className="px-4 py-3 font-medium">Dernier contact</th>
            <th className="px-4 py-3 font-medium">Liens</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-line bg-ink-900/40 hover:bg-ink-800/60">
              <td className="px-5 py-3">
                <Link href={`/admin/prospects/${r.id}`} className="block">
                  <div className="font-medium text-paper hover:text-violet-400">
                    {r.first_name || r.company_name || "—"}
                  </div>
                  <div className="text-xs text-faint">{r.email || "—"}</div>
                </Link>
              </td>
              <td className="px-4 py-3"><CategoryChip category={r.category} /></td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <StageBadge stage={r.pipeline_stage} />
                  <StatusBadge status={r.pipeline_status} />
                </div>
              </td>
              <td className="px-4 py-3"><ScoreBadge score={r.lead_score} /></td>
              <td className="px-4 py-3 text-faint">{relativeTime(r.last_signal_at)}</td>
              <td className="px-4 py-3 text-faint">{fmtDate(r.last_contacted_at)}</td>
              <td className="px-4 py-3">
                {r.token ? (
                  <a
                    href={`/r/${r.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-violet-400 hover:text-violet-500"
                  >
                    reveal
                  </a>
                ) : (
                  <span className="text-faint">—</span>
                )}
                {r.slug ? (
                  <>
                    {" · "}
                    <a
                      href={`/s/${r.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-violet-400 hover:text-violet-500"
                    >
                      /s/{r.slug}
                    </a>
                  </>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
