import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBalance } from "@/lib/credits-server";
import { reconcileBillingSession } from "@/lib/billing";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { BillingPanel } from "@/components/billing/BillingPanel";
import { creditReasonLabel } from "@/lib/ui/status";

export const dynamic = "force-dynamic";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export default async function Credits({
  searchParams,
}: {
  searchParams: Promise<{ sub?: string; topup?: string; session_id?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireUser();
  const admin = createAdminClient();

  // Filet de sécurité : si on revient d'un paiement, on réconcilie la session
  // (crédite/active) immédiatement, sans attendre le webhook. Idempotent.
  if (sp.session_id && (sp.topup === "success" || sp.sub === "success")) {
    await reconcileBillingSession(sp.session_id, user.id);
  }

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
      .select("status, current_period_end")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const moves = ledger ?? [];
  // Abonné si une ligne active existe ET (période inconnue OU non expirée).
  const isSub =
    !!sub &&
    (!sub.current_period_end ||
      new Date(sub.current_period_end as string).getTime() > Date.now());
  const justPaid = sp.sub === "success" || sp.topup === "success";

  return (
    <>
      <PageHeader
        title="Crédits & facturation"
        subtitle="Faites évoluer votre site autant que vous voulez."
      />

      {justPaid && (
        <div className="mb-6 rounded-2xl border border-success/30 bg-success-50 px-5 py-4 text-sm font-medium text-success">
          Paiement reçu — votre compte se met à jour dans un instant. Actualisez la page si besoin.
        </div>
      )}

      <BillingPanel
        isSub={isSub}
        balance={balance}
        periodEnd={(sub?.current_period_end as string) ?? null}
      />

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
