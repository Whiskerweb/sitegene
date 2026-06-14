import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  classifyEmailChangeRequest,
  hashEmailChangeToken,
  type EmailChangeState,
} from "@/lib/account/email-change";
import { ConfirmEmailButton } from "@/components/account/ConfirmEmailButton";
import { AkyraMark } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { IconAlert } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

const INVALID_COPY: Record<Exclude<EmailChangeState, "valid">, { title: string; body: string }> = {
  invalid: {
    title: "Lien invalide",
    body: "Ce lien de confirmation n'est pas valide. Relancez la demande depuis vos paramètres.",
  },
  expired: {
    title: "Lien expiré",
    body: "Ce lien a expiré (valable 1 heure). Relancez la demande depuis vos paramètres pour en recevoir un nouveau.",
  },
  used: {
    title: "Lien déjà utilisé",
    body: "Cette confirmation a déjà été effectuée. Votre adresse est à jour.",
  },
};

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let req: { new_email: string; expires_at: string; used_at: string | null } | null = null;
  if (token) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("email_change_requests")
      .select("new_email, expires_at, used_at")
      .eq("token_hash", hashEmailChangeToken(token))
      .maybeSingle();
    req = data;
  }

  const state = classifyEmailChangeRequest(req);
  const newEmail = req?.new_email ?? "";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-900 px-4 py-16">
      {/* Ambiance façon landing */}
      <div className="glow-violet absolute inset-x-0 top-0 h-[440px] opacity-70" />
      <div className="absolute -bottom-24 right-[-10%] h-[420px] w-[420px] rounded-full bg-gold-400/10 blur-[130px]" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <AkyraMark size={26} tone="dark" />
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            Akyra
          </span>
        </Link>

        <div className="rounded-2xl border border-[#ececf1] bg-white p-8 shadow-[0_24px_60px_-20px_rgba(8,8,12,0.5)]">
          {state === "valid" ? (
            <ConfirmEmailButton token={token!} newEmail={newEmail} />
          ) : (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-mist">
                <IconAlert size={22} />
              </div>
              <h1 className="mt-4 font-archivo text-xl font-semibold text-night">
                {INVALID_COPY[state].title}
              </h1>
              <p className="mt-2 text-sm text-slate">{INVALID_COPY[state].body}</p>
              <div className="mt-6">
                <Button
                  href={state === "used" ? "/dashboard" : "/dashboard/settings"}
                  variant={state === "used" ? "primary" : "ghost"}
                  size="md"
                  className="w-full"
                >
                  {state === "used" ? "Aller à mon espace" : "Retour aux paramètres"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-[13px] text-white/45">
          Akyra · votre site professionnel, clé en main.
        </p>
      </div>
    </main>
  );
}
