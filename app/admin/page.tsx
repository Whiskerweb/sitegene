import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { categoryLabel } from "@/lib/crm/categories";
import { Stat } from "@/app/admin/_components";

export const dynamic = "force-dynamic";

const euros = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/** Fenêtres temporelles (hors render : la règle react-hooks/purity interdit
 *  Date.now()/new Date() dans le corps d'un composant). */
function timeWindows() {
  const now = new Date();
  return {
    label: now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    monthStart: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    d30: new Date(now.getTime() - 30 * 86400000).toISOString(),
  };
}

type FunnelRow = {
  category: string;
  total: number;
  contactes: number;
  reveal_vu: number;
  go_live: number;
  clients: number;
  perdus: number;
  taux_reveal_to_client_pct: number | null;
};

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { label: monthLabel, monthStart, d30 } = timeWindows();

  const [
    monthPayments,
    activeSubs,
    totalProspects,
    clients,
    revealsActifs,
    hot,
    sent30,
    bounced30,
    complained30,
    funnel,
  ] = await Promise.all([
    supabase.from("payments").select("amount_cents, kind").gte("created_at", monthStart),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["active", "trialing"]),
    supabase.from("prospects").select("id", { count: "exact", head: true }),
    supabase.from("prospects").select("id", { count: "exact", head: true }).eq("pipeline_status", "GAGNE"),
    supabase
      .from("prospects")
      .select("id", { count: "exact", head: true })
      .in("pipeline_stage", ["REVEAL_VU", "ENGAGE", "GO_LIVE_INTENT"])
      .eq("pipeline_status", "EN_COURS"),
    supabase
      .from("prospects")
      .select("id", { count: "exact", head: true })
      .gte("lead_score", 40)
      .eq("pipeline_status", "EN_COURS"),
    supabase.from("email_events").select("id", { count: "exact", head: true }).eq("event", "sent").gte("created_at", d30),
    supabase.from("email_events").select("id", { count: "exact", head: true }).eq("event", "bounced").gte("created_at", d30),
    supabase.from("email_events").select("id", { count: "exact", head: true }).eq("event", "complained").gte("created_at", d30),
    supabase.from("v_crm_funnel_by_category").select("*"),
  ]);

  const pays = (monthPayments.data ?? []) as { amount_cents: number | null; kind: string | null }[];
  const netNew = pays.reduce((s, p) => s + (p.amount_cents ?? 0), 0);
  const nbInitial = pays.filter((p) => p.kind === "initial_50").length;

  const funnelRows = (funnel.data ?? []) as unknown as FunnelRow[];
  const sumReveal = funnelRows.reduce((s, r) => s + (r.reveal_vu ?? 0), 0);
  const sumClients = funnelRows.reduce((s, r) => s + (r.clients ?? 0), 0);
  const tauxGlobal = sumReveal > 0 ? Math.round((1000 * sumClients) / sumReveal) / 10 : null;

  const sent = sent30.count ?? 0;
  const bounceRate = sent > 0 ? Math.round((1000 * (bounced30.count ?? 0)) / sent) / 10 : 0;
  const complaintRate = sent > 0 ? Math.round((1000 * (complained30.count ?? 0)) / sent) / 10 : 0;
  const bounceAlert = bounceRate > 2;
  const complaintAlert = complaintRate > 0.3;

  const migrationsMissing = funnel.error || totalProspects.error;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em]">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted">Santé de la prospection & du revenu — {monthLabel}</p>
        </div>
        <Link href="/admin/prospects" className="btn-violet rounded-full px-5 py-2.5 text-sm font-semibold text-white">
          Voir les prospects →
        </Link>
      </div>

      {migrationsMissing ? (
        <div className="mt-6 rounded-2xl border border-gold-400/30 bg-ink-800 p-5 text-sm text-gold-400">
          Les vues/colonnes CRM ne sont pas encore en base. Applique les migrations 0011-0013 pour
          activer le tableau de bord.
        </div>
      ) : null}

      {/* North Star + drivers */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Revenu net-new (ce mois)"
          value={euros(netNew)}
          accent="text-mint-400"
          hint={`${nbInitial} ventes initiales`}
        />
        <Stat label="Abonnés actifs" value={activeSubs.count ?? 0} accent="text-violet-400" hint="récurrent (MRR)" />
        <Stat
          label="Taux reveal-vu → payé"
          value={tauxGlobal != null ? `${tauxGlobal} %` : "—"}
          accent="text-gold-400"
          hint="signal fiable (hors opens)"
        />
        <Stat label="Reveals actifs" value={revealsActifs.count ?? 0} hint="à relancer / suivre" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Prospects (total)" value={totalProspects.count ?? 0} />
        <Stat label="Clients" value={clients.count ?? 0} accent="text-mint-400" />
        <Stat label="Chauds 🔥" value={hot.count ?? 0} accent="text-[#ffcf5c]" hint="score ≥ 40, à attaquer" />
        <Link href="/admin/prospects?sort=score" className="rounded-2xl border border-line bg-ink-800 p-5 transition-colors hover:border-violet-400/40">
          <div className="font-display text-[18px] font-semibold text-violet-400">Action du jour →</div>
          <div className="mt-2 text-[13px] text-faint">Trier par température et attaquer les plus chauds</div>
        </Link>
      </div>

      {/* Funnel par catégorie */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold">Entonnoir par catégorie</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-ink-800 text-left text-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Contactés</th>
                <th className="px-4 py-3 text-right font-medium">Reveal vu</th>
                <th className="px-4 py-3 text-right font-medium">Go-live</th>
                <th className="px-4 py-3 text-right font-medium">Clients</th>
                <th className="px-4 py-3 text-right font-medium">Taux</th>
              </tr>
            </thead>
            <tbody>
              {funnelRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-faint">
                    Aucune donnée.
                  </td>
                </tr>
              ) : (
                funnelRows.map((r) => (
                  <tr key={r.category} className="border-t border-line bg-ink-900/40">
                    <td className="px-5 py-3 text-paper">{categoryLabel(r.category === "(non classé)" ? null : r.category)}</td>
                    <td className="px-4 py-3 text-right text-muted">{r.total}</td>
                    <td className="px-4 py-3 text-right text-muted">{r.contactes}</td>
                    <td className="px-4 py-3 text-right text-gold-400">{r.reveal_vu}</td>
                    <td className="px-4 py-3 text-right text-[#ffcf5c]">{r.go_live}</td>
                    <td className="px-4 py-3 text-right text-mint-400">{r.clients}</td>
                    <td className="px-4 py-3 text-right text-paper">
                      {r.taux_reveal_to_client_pct != null ? `${r.taux_reveal_to_client_pct} %` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Délivrabilité */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold">Santé délivrabilité (30 j)</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label="Emails envoyés" value={sent} />
          <Stat
            label="Taux de bounce"
            value={`${bounceRate} %`}
            accent={bounceAlert ? "text-[#ef6d6d]" : "text-mint-400"}
            hint="cible < 2 %"
          />
          <Stat
            label="Taux de plainte"
            value={`${complaintRate} %`}
            accent={complaintAlert ? "text-[#ef6d6d]" : "text-mint-400"}
            hint="cible < 0,3 %"
          />
        </div>
        {bounceAlert || complaintAlert ? (
          <div className="mt-3 rounded-xl border border-[#ef6d6d]/30 bg-ink-800 px-4 py-3 text-sm text-[#ef6d6d]">
            ⚠️ Seuil de délivrabilité dépassé — lève le pied sur les envois et vérifie ta liste.
          </div>
        ) : null}
      </div>
    </div>
  );
}
