import { createClient } from "@/lib/supabase/server";
import NotesBoard from "./NotesBoard";

export const dynamic = "force-dynamic";

type Note = {
  id: string;
  message: string;
  status: string;
  created_at: string;
  selector: {
    path?: string;
    cssSelector: string;
    label: string;
    xPct: number;
    yPct: number;
    offset?: { dx: number; dy: number };
  } | null;
  sites: { id: string; slug: string | null; status: string | null } | null;
};

export default async function AdminNotes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notes")
    .select("id, message, status, created_at, selector, sites(id, slug, status)")
    .order("created_at", { ascending: false })
    .limit(200);
  const notes = (data ?? []) as unknown as Note[];

  // Regroupe par site.
  const bySite = new Map<string, { slug: string | null; status: string | null; notes: Note[] }>();
  for (const n of notes) {
    if (!n.sites?.id) continue;
    const k = n.sites.id;
    if (!bySite.has(k)) bySite.set(k, { slug: n.sites.slug, status: n.sites.status, notes: [] });
    bySite.get(k)!.notes.push(n);
  }

  return (
    <div>
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em]">
        Demandes de modification
      </h1>
      <p className="mt-1 text-sm text-muted">
        Les notes épinglées apparaissent sur le site du client, là où il les a posées. Valide → le
        worker applique.
      </p>

      <div className="mt-8 space-y-10">
        {bySite.size === 0 && (
          <p className="rounded-[16px] border border-dashed border-line bg-ink-800 p-8 text-center text-muted">
            Aucune demande pour l'instant.
          </p>
        )}
        {[...bySite.entries()].map(([siteId, g]) => (
          <NotesBoard
            key={siteId}
            slug={g.slug}
            isLive={g.status === "live"}
            notes={g.notes.map((n) => ({
              id: n.id,
              message: n.message,
              status: n.status,
              selector: n.selector,
            }))}
          />
        ))}
      </div>
    </div>
  );
}
