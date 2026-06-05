import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { primarySiteForUser } from "@/lib/primary-site";
import { Button } from "@/components/ui/Button";
import { IconChevron, IconEdit, IconExternal } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

/**
 * Aperçu plein écran du site live, intégré au dashboard.
 * Chrome Akyra (DA sombre) autour de l'iframe ; l'iframe rend le site client
 * (route /s/<slug>) — on ne style QUE le chrome, jamais le site rendu.
 */
export default async function ApercuPage() {
  const user = await requireUser();
  const admin = createAdminClient();
  const site = await primarySiteForUser<{ slug: string | null; status: string }>(
    admin,
    user.id,
    "slug",
  );

  const isLive = site?.status === "live" && !!site?.slug;

  return (
    <div className="flex h-screen flex-col bg-ink-900">
      <header className="z-20 flex items-center justify-between gap-3 border-b border-[var(--line-strong)] bg-ink-800/80 px-4 py-2.5 backdrop-blur-xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-ink-700 px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-ink-600 hover:text-paper"
        >
          <span className="inline-flex rotate-180">
            <IconChevron size={16} />
          </span>
          Retour au dashboard
        </Link>
        <span className="hidden text-sm font-semibold text-paper sm:inline">
          Aperçu de votre site
        </span>
        <div className="flex items-center gap-2">
          <Button href="/editor" size="sm">
            <IconEdit size={16} /> Modifier
          </Button>
          {isLive && (
            <a
              href={`/s/${site!.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-ink-700 px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-ink-600 hover:text-paper"
            >
              <IconExternal size={16} /> Ouvrir
            </a>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden bg-ink-900">
        {isLive ? (
          <iframe
            src={`/s/${site!.slug}`}
            title="Aperçu de votre site"
            className="h-full w-full border-0"
          />
        ) : (
          <div className="grid h-full place-items-center px-6 text-center text-faint">
            Mettez votre site en ligne pour le prévisualiser ici.
          </div>
        )}
      </div>
    </div>
  );
}
