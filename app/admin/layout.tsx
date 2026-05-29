import Link from "next/link";
import { requireOperator } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireOperator();

  return (
    <div className="min-h-screen bg-ink-900">
      <header className="sticky top-0 z-40 border-b border-line bg-ink-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full btn-violet text-xs font-bold text-white">
                S
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">
                Sitegene
              </span>
              <span className="rounded-full border border-line bg-ink-700 px-2 py-0.5 text-[11px] uppercase tracking-wider text-faint">
                Opérateur
              </span>
            </Link>
            <nav className="hidden gap-4 text-sm text-muted md:flex">
              <Link href="/admin" className="hover:text-paper">
                Sites
              </Link>
              <Link href="/admin/new" className="hover:text-paper">
                Nouveau site
              </Link>
              <Link href="/admin/notes" className="hover:text-paper">
                Demandes
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-faint">
            <span className="hidden sm:inline">{profile.email}</span>
            <form action="/auth/signout" method="post">
              <button className="rounded-full border border-line px-3 py-1.5 text-muted transition-colors hover:text-paper">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1100px] px-6 py-10">{children}</main>
    </div>
  );
}
