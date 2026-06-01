import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/Button";
import { IconChevron, IconEdit, IconExternal } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

/** Aperçu plein écran du site live, intégré au dashboard (barre de retour). */
export default async function ApercuPage() {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("slug, status")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isLive = site?.status === "live" && !!site?.slug;

  return (
    <div className="flex h-screen flex-col bg-sky-50">
      <header className="glass z-20 flex items-center justify-between gap-3 border-b border-sky-300 px-4 py-2.5">
        <Button href="/dashboard" variant="ghost" size="sm">
          <span className="inline-flex rotate-180">
            <IconChevron size={16} />
          </span>
          Retour au dashboard
        </Button>
        <span className="hidden font-archivo text-sm font-semibold text-night sm:inline">
          Aperçu de votre site
        </span>
        <div className="flex items-center gap-2">
          <Button href="/editor" size="sm">
            <IconEdit size={16} /> Modifier
          </Button>
          {isLive && (
            <Button href={`/s/${site!.slug}`} target="_blank" variant="subtle" size="sm">
              <IconExternal size={16} /> Ouvrir
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {isLive ? (
          <iframe
            src={`/s/${site!.slug}`}
            title="Aperçu de votre site"
            className="h-full w-full border-0"
          />
        ) : (
          <div className="grid h-full place-items-center px-6 text-center text-mist">
            Mettez votre site en ligne pour le prévisualiser ici.
          </div>
        )}
      </div>
    </div>
  );
}
