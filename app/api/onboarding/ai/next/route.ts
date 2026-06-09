import { NextResponse, after } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { userOwnsSite, saveIntake, ensureHeaderForIntake } from "@/lib/onboarding";
import { newlyFilledSlots, slotToSection, identityReady, nextTurn, type ChatMsg } from "@/lib/onboarding-ai";
import { triggerSectionGeneration } from "@/lib/onboarding-sections";
import type { Intake } from "@/lib/onboarding-config";

export const maxDuration = 90;

/**
 * Un tour du chatbot d'onboarding temps réel. Le client envoie le transcript
 * complet ({ siteId, history }) ; le serveur extrait les faits du dernier message
 * vers l'intake (persisté), puis renvoie la prochaine question (ou la clôture).
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const siteId = typeof body?.siteId === "string" ? body.siteId : "";
  if (!siteId) return NextResponse.json({ error: "Site manquant." }, { status: 400 });
  if (!(await userOwnsSite(user.id, siteId))) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const history: ChatMsg[] = Array.isArray(body?.history)
    ? body.history
        .filter(
          (m: unknown): m is ChatMsg =>
            !!m &&
            typeof m === "object" &&
            ((m as ChatMsg).role === "user" || (m as ChatMsg).role === "assistant") &&
            typeof (m as ChatMsg).content === "string",
        )
        .map((m: ChatMsg) => ({ role: m.role, content: m.content.slice(0, 4000) }))
        .slice(-40)
    : [];

  const admin = createAdminClient();
  const { data: ob } = await admin
    .from("site_onboarding")
    .select("intake")
    .eq("site_id", siteId)
    .maybeSingle();
  const intake = (ob?.intake ?? {}) as Intake;

  const turn = await nextTurn({ history, intake });
  const merged = { ...intake, ...turn.intakePatch } as Intake & { categoryId?: string };
  if (Object.keys(turn.intakePatch).length > 0) {
    await saveIntake(siteId, turn.intakePatch);

    // Construit le site EN TÂCHE DE FOND, au fil des réponses (le chat reste rapide).
    const origin = new URL(request.url).origin;
    if (!identityReady(intake) && identityReady(merged)) {
      // Identité complétée → header (+ rattrapage des sections déjà répondues).
      after(() => ensureHeaderForIntake(origin, siteId).catch(() => {}));
    } else {
      // Slots de section nouvellement remplis → génère la section correspondante.
      for (const slot of newlyFilledSlots(intake, merged)) {
        const sec = slotToSection(slot);
        if (sec) after(() => triggerSectionGeneration(origin, siteId, sec).catch(() => {}));
      }
    }
  }

  return NextResponse.json({
    assistant: turn.assistant,
    done: turn.done,
    progress: turn.progress,
    intakePatch: turn.intakePatch,
  });
}
