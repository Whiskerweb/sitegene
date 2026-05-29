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

const statusColor: Record<string, string> = {
  sent: "text-faint",
  opened: "text-gold-400",
  paid: "text-mint-400",
  expired: "text-faint",
};

export default async function AdminHome() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("prospect_codes")
    .select(
      "token, code, status, created_at, prospects(first_name, email), sites(id, template_id, status, slug)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as unknown as Row[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em]">
            Sites & prospects
          </h1>
          <p className="mt-1 text-sm text-muted">
            {rows.length} prospect{rows.length > 1 ? "s" : ""} généré
            {rows.length > 1 ? "s" : ""}.
          </p>
        </div>
        <Link
          href="/admin/new"
          className="btn-violet rounded-full px-5 py-2.5 text-sm font-semibold text-white"
        >
          + Nouveau site
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-10 rounded-[20px] border border-dashed border-line bg-ink-800 p-12 text-center">
          <p className="text-muted">Aucun site pour l'instant.</p>
          <Link
            href="/admin/new"
            className="mt-4 inline-block text-sm font-semibold text-violet-400 hover:text-violet-500"
          >
            Générer le premier →
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-[20px] border border-line">
          <table className="w-full text-sm">
            <thead className="bg-ink-800 text-left text-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Prospect</th>
                <th className="px-5 py-3 font-medium">Template</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium">Site</th>
                <th className="px-5 py-3 font-medium">Reveal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.token}
                  className="border-t border-line bg-ink-900/40"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-paper">
                      {r.prospects?.first_name ?? "—"}
                    </div>
                    <div className="text-xs text-faint">
                      {r.prospects?.email ?? ""}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {r.sites?.template_id ?? "—"}
                  </td>
                  <td className={`px-5 py-3 ${statusColor[r.status] ?? "text-muted"}`}>
                    {r.status}
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {r.sites?.status}
                    {r.sites?.slug ? (
                      <a
                        href={`/s/${r.sites.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 text-violet-400 hover:text-violet-500"
                      >
                        /s/{r.sites.slug}
                      </a>
                    ) : null}
                  </td>
                  <td className="px-5 py-3">
                    <a
                      href={`/r/${r.token}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-violet-400 hover:text-violet-500"
                    >
                      /r/{r.token.slice(0, 8)}…
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
