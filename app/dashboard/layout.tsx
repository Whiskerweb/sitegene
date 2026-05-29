import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return (
    <div className="min-h-screen bg-ink-900">
      <header className="sticky top-0 z-40 border-b border-line bg-ink-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-[900px] items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full btn-violet text-xs font-bold text-white">S</span>
            <span className="font-display text-lg font-semibold tracking-tight">Sitegene</span>
          </Link>
          <form action="/auth/signout" method="post">
            <button className="rounded-full border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:text-paper">
              Déconnexion
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-[900px] px-6 py-10">{children}</main>
    </div>
  );
}
