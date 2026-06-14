/**
 * Plan photo : déduit du `manifest.photos` du template choisi le NOMBRE EXACT de
 * photos attendues et le rôle de chacune, formulé pour le métier du client.
 * Déterministe (instantané, fiable) — pas d'appel IA. SERVEUR uniquement.
 *
 * Le mapping réel des URLs vers les slots reste géré par `photoSlotUrls`
 * (lib/intake-map.ts) au moment du build ; ici on produit le message
 * « envoie N photos : … » montré au client.
 */
import { fetchTemplateManifest } from "@/lib/site-server";
import type { Intake } from "@/lib/onboarding-config";

type ManifestPhoto = { slot?: string; path?: string; role?: string; required?: boolean; note?: string };

export type ImageSlot = { path: string; role: string; description: string; required: boolean };
export type ImagePlan = { count: number; requiredCount: number; slots: ImageSlot[] };

/** Libellé FR d'un rôle de photo, contextualisé au métier. */
function describeRole(role: string | undefined, trade: string): string {
  const r = (role ?? "image").toLowerCase();
  const ctx = trade ? ` (${trade})` : "";
  if (r === "hero") return `Photo principale d'en-tête${ctx} — la plus forte, en grand`;
  if (r === "avatar") return "Portrait / photo de profil";
  if (r === "work") return `Une réalisation marquante${ctx}`;
  if (r === "gallery") return `Photo de galerie${ctx}`;
  if (r === "service") return `Photo illustrant une prestation${ctx}`;
  return `Photo d'illustration${ctx}`;
}

function tradeWord(intake: Intake): string {
  return (intake.trade || intake.jobTitle || intake.genre || "").toString().trim();
}

/**
 * Construit le plan photo pour `templateId`, adapté à l'intake. Si le manifest
 * est introuvable, renvoie un plan générique (6 photos).
 */
export async function imagePlanFor(
  origin: string,
  templateId: string,
  intake: Intake,
): Promise<ImagePlan> {
  const trade = tradeWord(intake);
  const manifest = (await fetchTemplateManifest(origin, templateId)) as
    | { photos?: ManifestPhoto[] }
    | null;
  const photos = Array.isArray(manifest?.photos) ? manifest!.photos! : [];

  if (photos.length === 0) {
    const slots: ImageSlot[] = Array.from({ length: 6 }, (_, i) => ({
      path: `photo[${i}]`,
      role: i === 0 ? "hero" : "image",
      description: describeRole(i === 0 ? "hero" : "image", trade),
      required: i < 4,
    }));
    return { count: slots.length, requiredCount: 4, slots };
  }

  const slots: ImageSlot[] = photos.map((p) => ({
    path: p.path ?? p.slot ?? "",
    role: p.role ?? "image",
    description: describeRole(p.role, trade),
    required: p.required !== false,
  }));
  return {
    count: slots.length,
    requiredCount: slots.filter((s) => s.required).length,
    slots,
  };
}

/** Message chat lisible : « Envoyez N photos : … ». */
export function imagePlanMessage(plan: ImagePlan): string {
  const lines = plan.slots.map((s, i) => `${i + 1}. ${s.description}`);
  return (
    `Pour finaliser votre site, j'ai besoin de **${plan.count} photo${plan.count > 1 ? "s" : ""}** ` +
    `(${plan.requiredCount} indispensable${plan.requiredCount > 1 ? "s" : ""}) :\n` +
    lines.join("\n")
  );
}
