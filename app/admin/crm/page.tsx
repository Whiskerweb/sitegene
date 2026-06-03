import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type OutreachRow = {
  id: string;
  status: string;
  step: number;
  max_steps: number;
  next_run_at: string;
  last_sent_at: string | null;
  reveal_token: string | null;
  created_at: string;
  prospects: { first_name: string | null; email: string | null } | null;
};

type Ev = { token: string | null; type: string };

const STATUS: Record<string, { label: string; cls: string }> = {
  queued: { label: "En file", cls: "text-faint border-line" },
  active: { label: "Relances en cours", cls: "text-violet-400 border-violet-400/30" },
  engaged: { label: "A vu son site", cls: "text-gold-400 border-gold-400/30" },
  converted: { label: "Client ✓", cls: "text-mint-400 border-mint-400/30" },
  completed: { label: "Terminé (sans réponse)", cls: "text-muted border-line" },
  unsubscribed: { label: "Désinscrit", cls: "text-[#ef6d6d] border-[#ef6d6d]/30" },
  bounced: { label: "Bounce", cls: "text-[#ef6d6d] border-[#ef6d6d]/30" },
  paused: { label: "En pause", cls: "text-faint border-line" },
  failed: { label: "Échec", cls: "text-[#ef6d6d] border-[#ef6d6d]/30" },
};

const fmtDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
    : "—";

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

function Badge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, cls: "text-faint border-line" };
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default async function CrmPage() {
  const supabase = await createClient();
  const [{ data: outreachData }, { data: eventsData }] = await Promise.all([
    supabase
      .from("outreach")
      .select(
        "id, status, step, max_steps, next_run_at, last_sent_at, reveal_token, created_at, prospects(first_name, email)",
      )
      .order("created_at", { ascending: true }),
    supabase.from("events").select("token, type").limit(5000),
  ]);

  const rows = (outreachData ?? []) as unknown as OutreachRow[];
  const events = (eventsData ?? []) as Ev[];

  // Engagement par token (a-t-il ouvert son reveal ? cliqué « mettre en ligne » ?).
  const eng = new Map<string, { opened: boolean; goLive: boolean }>();
  for (const e of events) {
    if (!e.token) continue;
    const a = eng.get(e.token) ?? { opened: false, goLive: false };
    if (e.type === "reveal_opened") a.opened = true;
    if (e.type === "go_live_clicked") a.goLive = true;
    eng.set(e.token, a);
  }

  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const sent = rows.filter((r) => r.step > 0).length;

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Prospection</h1>
          <p className="mt-1 text-sm text-faint">
            Suivi de la séquence email — {rows.length} prospects · {sent} contactés
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="En file" value={count("queued")} />
        <Stat label="Relances en cours" value={count("active")} accent="text-violet-400" />
        <Stat label="Ont vu leur site" value={count("engaged")} accent="text-gold-400" />
        <Stat label="Clients" value={count("converted")} accent="text-mint-400" />
        <Stat label="Terminés" value={count("completed")} />
        <Stat
          label="Désinscrits / bounce"
          value={count("unsubscribed") + count("bounced")}
          accent="text-[#ef6d6d]"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-ink-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[12px] uppercase tracking-wider text-faint">
              <th className="px-4 py-3 font-medium">Prospect</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Étape</th>
              <th className="px-4 py-3 font-medium">Dernier envoi</th>
              <th className="px-4 py-3 font-medium">Prochaine relance</th>
              <th className="px-4 py-3 font-medium">A vu son site</th>
              <th className="px-4 py-3 font-medium">Site</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const e = r.reveal_token ? eng.get(r.reveal_token) : undefined;
              const scheduled = r.status === "active" || r.status === "queued";
              return (
                <tr key={r.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-paper">
                      {r.prospects?.first_name || "—"}
                    </div>
                    <div className="text-[12px] text-faint">{r.prospects?.email || "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {r.step}/{r.max_steps}
                  </td>
                  <td className="px-4 py-3 text-muted">{fmtDate(r.last_sent_at)}</td>
                  <td className="px-4 py-3 text-muted">
                    {scheduled && r.step < r.max_steps ? fmtDate(r.next_run_at) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {e?.opened ? (
                      <span className="text-gold-400">● {e.goLive ? "+ intéressé" : "oui"}</span>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.reveal_token ? (
                      <a
                        href={`/r/${r.reveal_token}`}
                        target="_blank"
                        className="text-violet-400 hover:underline"
                      >
                        voir
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-faint">
                  Aucun prospect enrôlé pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
