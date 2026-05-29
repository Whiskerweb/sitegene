import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBalance } from "@/lib/credits-server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { creditReasonLabel } from "@/lib/ui/status";

export const dynamic = "force-dynamic";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export default async function Credits() {
  const user = await requireUser();
  const admin = createAdminClient();
  const balance = await getBalance(admin, user.id);

  const [{ data: ledger }, { data: sub }] = await Promise.all([
    admin
      .from("credit_ledger")
      .select("id, delta, reason, balance_after, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("subscriptions")
      .select("status, monthly_credit_allowance, current_period_end")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
  ]);
  const moves = ledger ?? [];

  return (
    <>
      <PageHeader
        title="Crédits & facturation"
        subtitle="Vos crédits servent à faire évoluer votre site."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <GlassCard className="border border-sky-300 p-7">
          <p className="text-sm font-medium text-slate">Solde actuel</p>
          <p className="mt-1 font-archivo text-[52px] font-bold leading-none text-brand">
            {balance}
          </p>
          <p className="mt-2 text-sm text-mist">1 crédit = 1 modification de votre site.</p>
        </GlassCard>

        <Card tone="lav" className="p-7">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate">Abonnement</p>
            {sub ? <Badge tone="success">Actif</Badge> : <Badge tone="neutral">Bientôt</Badge>}
          </div>
          {sub ? (
            <>
              <p className="mt-2 font-archivo text-xl font-bold text-night">
                {sub.monthly_credit_allowance} crédits / mois
              </p>
              <p className="mt-1 text-sm text-mist">
                Renouvelé le {fmtDate(sub.current_period_end as string)}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-slate">
              Un abonnement pour recharger vos crédits automatiquement chaque mois arrive très
              bientôt. En attendant, on vous offre des crédits à l'inscription.
            </p>
          )}
        </Card>
      </div>

      <h2 className="mb-3 mt-10 font-archivo text-lg font-semibold text-night">Historique</h2>
      <Card className="overflow-hidden">
        {moves.length === 0 ? (
          <p className="p-6 text-sm text-slate">Aucun mouvement pour l'instant.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-sky-300 bg-surface-2 text-left text-mist">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Motif</th>
                <th className="px-5 py-3 text-right font-medium">Mouvement</th>
                <th className="px-5 py-3 text-right font-medium">Solde</th>
              </tr>
            </thead>
            <tbody>
              {moves.map((m) => (
                <tr key={m.id} className="border-t border-sky-300">
                  <td className="px-5 py-3 text-mist">{fmtDate(m.created_at)}</td>
                  <td className="px-5 py-3 text-slate">
                    {creditReasonLabel[m.reason as string] ?? m.reason}
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-semibold ${
                      (m.delta as number) >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {(m.delta as number) >= 0 ? "+" : ""}
                    {m.delta}
                  </td>
                  <td className="px-5 py-3 text-right text-night">{m.balance_after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
