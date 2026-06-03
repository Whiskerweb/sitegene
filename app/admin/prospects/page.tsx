import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { stageRank } from "@/lib/crm/stages";
import { CRM_CATEGORIES, categoryLabel } from "@/lib/crm/categories";
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
import type { PipelineStage, PipelineStatus } from "@/lib/types/db";

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
};

const SELECT =
  "id, first_name, email, category, company_name, city, pipeline_stage, pipeline_status, lead_score, last_signal_at, last_contacted_at, lost_reason, created_at, prospect_codes(token, sites(slug))";

type StatRow = { category: string | null; pipeline_stage: PipelineStage; pipeline_status: PipelineStatus };
type CatStat = {
  id: string | null;
  total: number;
  contactes: number;
  vus: number;
  clients: number;
  desinscrits: number;
};

/** Agrège les compteurs par catégorie (l'essentiel du CRM : qui a reçu quoi, par métier). */
function aggregateByCategory(rows: StatRow[]): CatStat[] {
  const map = new Map<string | null, CatStat>();
  for (const r of rows) {
    const key = r.category ?? null;
    const s = map.get(key) ?? { id: key, total: 0, contactes: 0, vus: 0, clients: 0, desinscrits: 0 };
    s.total++;
    if (stageRank(r.pipeline_stage) >= 1) s.contactes++;
    if (stageRank(r.pipeline_stage) >= 2) s.vus++;
    if (r.pipeline_status === "GAGNE") s.clients++;
    if (r.pipeline_status === "DESABONNE" || r.pipeline_status === "BOUNCE") s.desinscrits++;
    map.set(key, s);
  }
  // Ordre : catégories connues d'abord, « non classé » à la fin.
  const order: (string | null)[] = [...CRM_CATEGORIES.map((c) => c.id as string), null];
  const out: CatStat[] = [];
  for (const id of order) {
    const s = map.get(id);
    if (s) {
      out.push(s);
      map.delete(id);
    }
  }
  out.push(...map.values()); // catégories inattendues, par sécurité
  return out;
}

export default async function ProspectsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const view = sp.view === "table" ? "table" : "kanban";
  const sort: SortKey = sp.sort === "recent" ? "recent" : sp.sort === "signal" ? "signal" : "score";
  const supabase = await createClient();

  // Requête principale (filtrée) — AUCUN statut masqué par défaut : les
  // désinscrits restent visibles et clairement marqués « pas intéressé ».
  let query = supabase.from("prospects").select(SELECT).limit(500);
  if (sp.cat) query = query.eq("category", sp.cat);
  if (sp.stage) query = query.eq("pipeline_stage", sp.stage);
  if (sp.status) query = query.eq("pipeline_status", sp.status);
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

  // Compteurs globaux par catégorie (indépendants des filtres) — le cœur du CRM.
  const [{ data, error }, { data: statData }] = await Promise.all([
    query,
    supabase.from("prospects").select("category, pipeline_stage, pipeline_status").limit(5000),
  ]);

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

  const stats = aggregateByCategory(((statData ?? []) as unknown as StatRow[]) ?? []);
  const totals = stats.reduce(
    (a, s) => ({
      total: a.total + s.total,
      contactes: a.contactes + s.contactes,
      vus: a.vus + s.vus,
      clients: a.clients + s.clients,
      desinscrits: a.desinscrits + s.desinscrits,
    }),
    { total: 0, contactes: 0, vus: 0, clients: 0, desinscrits: 0 },
  );

  return (
    <div>
      <div>
        <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em]">Prospection</h1>
        <p className="mt-1 text-sm text-muted">
          Qui a reçu un site, par catégorie — mise à jour automatique (emails · visites · paiements).
        </p>
      </div>

      {/* ===== L'essentiel : compteurs PAR CATÉGORIE (cliquables) ===== */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <CategoryCard
          href={`/admin/prospects?view=${view}`}
          active={!sp.cat}
          label="Toutes catégories"
          stat={{ id: null, ...totals }}
        />
        {stats.map((s) => (
          <CategoryCard
            key={s.id ?? "(null)"}
            href={s.id ? `/admin/prospects?view=${view}&cat=${encodeURIComponent(s.id)}` : `/admin/prospects?view=${view}`}
            active={sp.cat === s.id}
            label={categoryLabel(s.id)}
            stat={s}
          />
        ))}
      </div>

      <div className="mt-6">
        <ProspectsFilters view={view} sp={sp} sort={sort} />
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl border border-[#ef6d6d]/30 bg-ink-800 p-6 text-sm text-[#ef6d6d]">
          Erreur de chargement : {error.message}
          <div className="mt-1 text-faint">
            (As-tu appliqué les migrations CRM 0011-0015 ? Des colonnes sont peut-être absentes.)
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-10 rounded-[20px] border border-dashed border-line bg-ink-800 p-12 text-center">
          <p className="text-muted">Aucun prospect ne correspond à ces filtres.</p>
        </div>
      ) : view === "table" ? (
        <GroupedTable rows={rows} />
      ) : (
        <div className="mt-6">
          <ProspectsKanban prospects={rows} />
        </div>
      )}
    </div>
  );
}

/** Carte-compteur d'une catégorie : total envoyé + funnel + désinscrits, cliquable (filtre). */
function CategoryCard({
  href,
  active,
  label,
  stat,
}: {
  href: string;
  active: boolean;
  label: string;
  stat: CatStat;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl border p-4 transition-colors ${
        active ? "border-violet-400/60 bg-ink-700" : "border-line bg-ink-800 hover:border-violet-400/30"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-[13px] font-semibold text-paper">{label}</span>
        <span className="font-display text-[22px] font-semibold leading-none text-paper">{stat.total}</span>
      </div>
      <div className="mt-2 space-y-0.5 text-[11px] text-faint">
        <div>
          {stat.contactes} contactés · {stat.vus} ont vu leur site
        </div>
        <div>
          <span className="text-mint-400">{stat.clients} clients</span>
          {" · "}
          <span className={stat.desinscrits > 0 ? "text-[#ef6d6d]" : ""}>
            {stat.desinscrits} désinscrits
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Tableau groupé PAR CATÉGORIE — une section claire par métier. */
function GroupedTable({ rows }: { rows: ProspectRow[] }) {
  const order: (string | null)[] = [...CRM_CATEGORIES.map((c) => c.id as string), null];
  const known = new Set(order);
  const groups = order
    .map((id) => ({ id, rows: rows.filter((r) => (r.category ?? null) === id) }))
    .filter((g) => g.rows.length > 0);
  const others = rows.filter((r) => !known.has(r.category ?? null));
  if (others.length > 0) groups.push({ id: others[0].category ?? null, rows: others });

  return (
    <div className="mt-6 space-y-8">
      {groups.map((g) => {
        const vus = g.rows.filter((r) => stageRank(r.pipeline_stage) >= 2).length;
        const clients = g.rows.filter((r) => r.pipeline_status === "GAGNE").length;
        const desinscrits = g.rows.filter(
          (r) => r.pipeline_status === "DESABONNE" || r.pipeline_status === "BOUNCE",
        ).length;
        return (
          <section key={g.id ?? "(null)"}>
            <div className="mb-2 flex flex-wrap items-center gap-3 px-1">
              <CategoryChip category={g.id} />
              <span className="text-[12px] text-faint">
                {g.rows.length} envoyés · {vus} ont vu · <span className="text-mint-400">{clients} clients</span>
                {desinscrits > 0 ? (
                  <>
                    {" · "}
                    <span className="text-[#ef6d6d]">{desinscrits} désinscrits (pas intéressés)</span>
                  </>
                ) : null}
              </span>
            </div>
            <div className="overflow-x-auto rounded-[20px] border border-line">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-ink-800 text-left text-faint">
                  <tr>
                    <th className="px-5 py-3 font-medium">Prospect</th>
                    <th className="px-4 py-3 font-medium">Étape</th>
                    <th className="px-4 py-3 font-medium">Température</th>
                    <th className="px-4 py-3 font-medium">Dernier signal</th>
                    <th className="px-4 py-3 font-medium">Dernier contact</th>
                    <th className="px-4 py-3 font-medium">Liens</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r) => {
                    const out = r.pipeline_status === "DESABONNE" || r.pipeline_status === "BOUNCE";
                    return (
                      <tr
                        key={r.id}
                        className={`border-t border-line bg-ink-900/40 hover:bg-ink-800/60 ${out ? "opacity-60" : ""}`}
                      >
                        <td className="px-5 py-3">
                          <Link href={`/admin/prospects/${r.id}`} className="block">
                            <div className="font-medium text-paper hover:text-violet-400">
                              {r.first_name || r.company_name || "—"}
                            </div>
                            <div className="text-xs text-faint">{r.email || "—"}</div>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <StageBadge stage={r.pipeline_stage} />
                            <StatusBadge status={r.pipeline_status} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {out ? <span className="text-[12px] text-faint">—</span> : <ScoreBadge score={r.lead_score} />}
                        </td>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
