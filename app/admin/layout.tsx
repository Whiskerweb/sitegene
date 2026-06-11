import { requireOperator } from "@/lib/auth";
import { AppShell } from "@/components/ui/AppShell";
import type { NavItem } from "@/components/ui/NavItem";
import {
  IconDesktop,
  IconPhone,
  IconStar4,
  IconPlus,
  IconEdit,
  IconLogout,
} from "@/components/ui/icons";

const titleMap = {
  "/admin": "Tableau de bord",
  "/admin/prospects": "Prospects",
  "/admin/crm": "CRM",
  "/admin/new": "Nouveau site",
  "/admin/notes": "Demandes",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireOperator();

  const nav: NavItem[] = [
    { href: "/admin", label: "Tableau de bord", icon: <IconDesktop size={18} /> },
    { href: "/admin/prospects", label: "Prospects", icon: <IconPhone size={18} /> },
    { href: "/admin/crm", label: "CRM", icon: <IconStar4 size={18} /> },
    { href: "/admin/new", label: "Nouveau site", icon: <IconPlus size={18} /> },
    { href: "/admin/notes", label: "Demandes", icon: <IconEdit size={18} /> },
  ];

  const right = (
    <>
      <span className="hidden text-sm text-gray-500 md:inline">{profile.email}</span>
      <form action="/auth/signout" method="post">
        <button
          className="grid h-9 w-9 place-items-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          aria-label="Déconnexion"
        >
          <IconLogout size={18} />
        </button>
      </form>
    </>
  );

  return (
    <AppShell nav={nav} titleMap={titleMap} right={right} roleLabel="Opérateur">
      {children}
    </AppShell>
  );
}
