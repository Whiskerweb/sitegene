import { createClient } from "@/lib/supabase/server";
import ApproveNote from "./ApproveNote";

export const dynamic = "force-dynamic";

type Note = {
  id: string;
  message: string;
  status: string;
  created_at: string;
  sites: { slug: string | null; template_id: string | null } | null;
};

const statusLabel: Record<string, { label: string; color: string }> = {
  open: { label: "À traiter", color: "text-gold-400" },
  in_progress: { label: "En cours (Claude)", color: "text-violet-400" },
  done: { label: "Fait", color: "text-mint-400" },
  rejected: { label: "Refusé", color: "text-faint" },
};

export default async function AdminNotes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notes")
    .select("id, message, status, created_at, sites(slug, template_id)")
    .order("created_at", { ascending: false })
    .limit(100);
  const notes = (data ?? []) as unknown as Note[];

  return (
    <div>
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em]">
        Demandes de modification
      </h1>
      <p className="mt-1 text-sm text-muted">
        Valide une demande → un job part au worker, Claude applique la modif et republie.
      </p>

      <div className="mt-8 space-y-3">
        {notes.length === 0 && (
          <p className="rounded-[16px] border border-dashed border-line bg-ink-800 p-8 text-center text-muted">
            Aucune demande pour l'instant.
          </p>
        )}
        {notes.map((n) => {
          const s = statusLabel[n.status] ?? statusLabel.open;
          return (
            <div key={n.id} className="rounded-[16px] border border-line bg-ink-700 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2 text-xs">
                    <span className={s.color}>{s.label}</span>
                    <span className="text-faint">·</span>
                    <span className="text-faint">
                      {n.sites?.slug ? `/s/${n.sites.slug}` : (n.sites?.template_id ?? "—")}
                    </span>
                  </div>
                  <p className="text-sm text-paper/90">{n.message}</p>
                </div>
                {n.status === "open" && <ApproveNote noteId={n.id} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
