import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = {
  token: string;
  code: string | null;
  status: string;
  created_at: string;
  prospects: { first_name: string | null; email: string | null } | null;
  sites: { id: string; template_id: string | null; status: string; slug: string | null } | null;
};

type Ev = { token: string | null; type: string };

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-ink-800 p-5">
      <div className={`font-display text-[32px] font-semibold leading-none ${accent ?? "text-paper"}`}>
        {value}
      </div>
      <div className="mt-2 text-[13px] text-faint">{label}</div>
    </div>
  );
}

function Dot({ on, color = "mint" }: { on: boolean; color?: "mint" | "gold" | "violet" }) {
  if (!on) return <span className="text-faint">—</span>;
  const c =
    color === "gold" ? "text-gold-400" : color === "violet" ? "text-violet-400" : "text-mint-400";
  return <span className={c}>●</span>;
}

export default async function AdminHome() {
  const supabase = await createClient();
  const [{ data: codesData }, { data: eventsData }] = await Promise.all([
    supabase
      .from("prospect_codes")
      .select(
        "token, code, status, created_at, prospects(first_name, email), sites(id, template_id, status, slug)",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("events").select("token, type").limit(5000),
  ]);

  const rows = (codesData ?? []) as unknown as Row[];
  const events = (eventsData ?? []) as Ev[];

  // Agrégation des events par token.
  const agg = new Map<string, { opened: boolean; clicks: number; goLive: boolean }>();
  for (const e of events) {
    if (!e.token) continue;
    const a = agg.get(e.token) ?? { opened: false, clicks: 0, goLive: false };
    if (e.type === "reveal_opened") a.opened = true;
    else if (e.type === "button_click") a.clicks += 1;
    else if (e.type === "go_live_clicked") a.goLive = true;
    agg.set(e.token, a);
  }

  const isPaid = (r: Row) => r.status === "paid";
  const stats = {
    sent: rows.length,
    opened: rows.filter((r) => agg.get(r.token)?.opened).length,
    goLive: rows.filter((r) => agg.get(r.token)?.goLive).length,
    paid: rows.filter(isPaid).length,
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em]">
            Prospection
          </h1>
          <p className="mt-1 text-sm text-muted">Mini-CRM — suivi de l'entonnoir.</p>
        </div>
        <Link
          href="/admin/new"
          className="btn-violet rounded-full px-5 py-2.5 text-sm font-semibold text-white"
        >
          + Nouveau site
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Sites envoyés" value={stats.sent} />
        <Stat label="Ouverts" value={stats.opened} accent="text-gold-400" />
        <Stat label="« Mettre en ligne » cliqué" value={stats.goLive} accent="text-violet-400" />
        <Stat label="Achetés" value={stats.paid} accent="text-mint-400" />
      </div>

      {rows.length === 0 ? (
        <div className="mt-10 rounded-[20px] border border-dashed border-line bg-ink-800 p-12 text-center">
          <p className="text-muted">Aucun prospect pour l'instant.</p>
          <Link href="/admin/new" className="mt-4 inline-block text-sm font-semibold text-violet-400 hover:text-violet-500">
            Générer le premier →
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-[20px] border border-line">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-ink-800 text-left text-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Prospect</th>
                <th className="px-5 py-3 font-medium">Template</th>
                <th className="px-5 py-3 font-medium">Envoyé</th>
                <th className="px-3 py-3 text-center font-medium">Ouvert</th>
                <th className="px-3 py-3 text-center font-medium">Clics</th>
                <th className="px-3 py-3 text-center font-medium">Go-live</th>
                <th className="px-3 py-3 text-center font-medium">Acheté</th>
                <th className="px-5 py-3 font-medium">Liens</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const a = agg.get(r.token);
                return (
                  <tr key={r.token} className="border-t border-line bg-ink-900/40">
                    <td className="px-5 py-3">
                      <div className="font-medium text-paper">
                        {r.prospects?.first_name ?? "—"}
                      </div>
                      <div className="text-xs text-faint">{r.prospects?.email ?? ""}</div>
                    </td>
                    <td className="px-5 py-3 text-muted">{r.sites?.template_id ?? "—"}</td>
                    <td className="px-5 py-3 text-faint">{fmtDate(r.created_at)}</td>
                    <td className="px-3 py-3 text-center"><Dot on={!!a?.opened} color="gold" /></td>
                    <td className="px-3 py-3 text-center text-muted">{a?.clicks ?? 0}</td>
                    <td className="px-3 py-3 text-center"><Dot on={!!a?.goLive} color="violet" /></td>
                    <td className="px-3 py-3 text-center"><Dot on={isPaid(r)} color="mint" /></td>
                    <td className="px-5 py-3">
                      <a href={`/r/${r.token}`} target="_blank" rel="noreferrer" className="text-violet-400 hover:text-violet-500">
                        reveal
                      </a>
                      {r.sites?.slug ? (
                        <>
                          {" · "}
                          <a href={`/s/${r.sites.slug}`} target="_blank" rel="noreferrer" className="text-violet-400 hover:text-violet-500">
                            /s/{r.sites.slug}
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
      )}
    </div>
  );
}
