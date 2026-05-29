import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBalance } from "@/lib/credits-server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { IconEdit, IconExternal } from "@/components/ui/icons";
import { NewNote } from "./NewNote";

export const dynamic = "force-dynamic";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export default async function Modifications() {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: site } = await admin
    .from("sites")
    .select("id, slug, status")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const balance = await getBalance(admin, user.id);

  if (!site) {
    return (
      <>
        <PageHeader title="Modifications" />
        <EmptyState
          icon={<IconEdit />}
          title="Aucun site pour l'instant"
          description="Vous pourrez demander des modifications dès que votre site sera créé."
        />
      </>
    );
  }

  const { data: notes } = await admin
    .from("notes")
    .select("id, message, status, created_at, resulting_content_version")
    .eq("site_id", site.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const list = notes ?? [];

  return (
    <>
      <PageHeader
        title="Modifications"
        subtitle="Décrivez vos changements, on les applique et on republie."
      />

      <NewNote siteId={site.id} balance={balance} />

      <h2 className="mb-3 mt-10 font-archivo text-lg font-semibold text-night">
        Historique
      </h2>

      {list.length === 0 ? (
        <EmptyState
          icon={<IconEdit />}
          title="Aucune demande pour l'instant"
          description="Votre première demande de modification apparaîtra ici, avec son suivi."
        />
      ) : (
        <div className="space-y-3">
          {list.map((n) => (
            <Card key={n.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <p className="text-[15px] leading-relaxed text-night">{n.message}</p>
                <StatusPill status={n.status} kind="note" />
              </div>
              <div className="mt-3 flex items-center gap-4 text-[13px] text-mist">
                <span>{fmtDate(n.created_at)}</span>
                {n.status === "done" && n.resulting_content_version && (
                  <span className="inline-flex items-center gap-1 text-success">
                    ✓ Appliqué · version {n.resulting_content_version}
                  </span>
                )}
                {n.status === "done" && site.slug && (
                  <a
                    href={`/s/${site.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-brand hover:text-brand-700"
                  >
                    Voir le résultat <IconExternal size={13} />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {list.length > 0 && balance <= 0 && (
        <div className="mt-6">
          <Button href="/dashboard/credits" variant="subtle">
            Recharger mes crédits
          </Button>
        </div>
      )}
    </>
  );
}
