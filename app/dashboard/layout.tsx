import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBalance } from "@/lib/credits-server";
import { AppShell } from "@/components/ui/AppShell";
import type { NavItem } from "@/components/ui/NavItem";
import {
  IconCloud,
  IconStar4,
  IconCredit,
  IconSettings,
  IconLogout,
  IconPhoto,
} from "@/components/ui/icons";

export const dynamic = "force-dynamic";

const titleMap = {
  "/dashboard": "Mon site",
  "/dashboard/bibliotheque": "Bibliothèque",
  "/dashboard/marketplace": "Formules",
  "/dashboard/credits": "Crédits & facturation",
  "/dashboard/settings": "Paramètres",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const admin = createAdminClient();
  const balance = await getBalance(admin, user.id);

  const nav: NavItem[] = [
    { href: "/dashboard", label: "Mon site", icon: <IconCloud size={18} /> },
    { href: "/dashboard/bibliotheque", label: "Bibliothèque", icon: <IconPhoto size={18} /> },
    {
      href: "/dashboard/marketplace",
      label: "Formules",
      icon: <IconStar4 size={18} />,
    },
    {
      href: "/dashboard/credits",
      label: "Crédits",
      icon: <IconCredit size={18} />,
      badge: balance,
    },
    { href: "/dashboard/settings", label: "Paramètres", icon: <IconSettings size={18} /> },
  ];

  const right = (
    <>
      <a
        href="/dashboard/credits"
        className="hidden items-center gap-1.5 rounded-full bg-blue px-3 py-1.5 text-sm font-semibold text-brand sm:inline-flex"
      >
        {balance} crédits
      </a>
      <span className="hidden text-sm text-mist md:inline">{user.email}</span>
      <form action="/auth/signout" method="post">
        <button
          className="grid h-9 w-9 place-items-center rounded-xl text-slate transition-colors hover:bg-sky-100 hover:text-night"
          aria-label="Déconnexion"
        >
          <IconLogout size={18} />
        </button>
      </form>
    </>
  );

  return (
    <AppShell nav={nav} titleMap={titleMap} right={right}>
      {children}
    </AppShell>
  );
}
