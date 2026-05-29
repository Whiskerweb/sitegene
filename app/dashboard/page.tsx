import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBalance } from "@/lib/credits-server";
import NewNote from "./NewNote";

export const dynamic = "force-dynamic";

const noteStatus: Record<string, { label: string; color: string }> = {
  open: { label: "En attente", color: "text-gold-400" },
  in_progress: { label: "En cours", color: "text-violet-400" },
  done: { label: "Fait", color: "text-mint-400" },
  rejected: { label: "Refusé", color: "text-faint" },
};

export default async function Dashboard() {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: sites } = await admin
    .from("sites")
    .select("id, slug, status, template_id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false });
  const site = sites?.[0] ?? null;
  const balance = await getBalance(admin, user.id);

  const { data: notes } = site
    ? await admin
        .from("notes")
        .select("id, message, status, created_at")
        .eq("site_id", site.id)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em]">Mon site</h1>
        <div className="rounded-full border border-line bg-ink-700 px-4 py-2 text-sm">
          <span className="text-faint">Crédits : </span>
          <span className="font-semibold text-mint-400">{balance}</span>
        </div>
      </div>

      {!site ? (
        <p className="mt-8 text-muted">Aucun site associé à votre compte pour l'instant.</p>
      ) : (
        <>
          <div className="mt-6 rounded-[20px] border border-line bg-ink-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${site.status === "live" ? "text-mint-400" : "text-faint"}`}>
                    ● {site.status === "live" ? "En ligne" : site.status}
                  </span>
                </div>
                <div className="mt-1 font-display text-[22px] font-medium">
                  {site.slug ? `/s/${site.slug}` : "Site en préparation"}
                </div>
              </div>
              {site.slug && (
                <a href={`/s/${site.slug}`} target="_blank" rel="noreferrer"
                  className="btn-violet rounded-full px-5 py-2.5 text-sm font-semibold text-white">
                  Voir mon site
                </a>
              )}
            </div>
          </div>

          <div className="mt-6">
            <NewNote siteId={site.id} />
          </div>

          <h2 className="mb-3 mt-10 text-sm font-semibold text-paper">
            Mes demandes ({notes?.length ?? 0})
          </h2>
          <div className="space-y-2">
            {(notes ?? []).map((n) => {
              const s = noteStatus[n.status] ?? noteStatus.open;
              return (
                <div key={n.id} className="rounded-[14px] border border-line bg-ink-800 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm text-paper/90">{n.message}</p>
                    <span className={`shrink-0 text-xs ${s.color}`}>{s.label}</span>
                  </div>
                </div>
              );
            })}
            {(!notes || notes.length === 0) && (
              <p className="text-sm text-faint">Aucune demande pour l'instant.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
