/**
 * Génération LIVE d'un site depuis la landing (prospect, sans compte).
 * Réutilise tout le moteur synchrone `generateSite` : upload photos → overlay
 * → site draft + token reveal. Le prospect voit son vrai site sur /r/{token},
 * puis paie 50 € via le flux existant. Endpoint PUBLIC → garde-fous (honeypot,
 * plafonds, catégorie active). Le copy/IA reste borné par le manifest.
 */
import { NextResponse } from "next/server";
import { fetchDefaultContent, fetchTemplateManifest } from "@/lib/site-server";
import { generateSite, type PhotoUpload } from "@/lib/generate";
import { isTemplateId, type TemplateId } from "@/lib/templates";
import { collectImageSlots } from "@/lib/content-overlay";
import { briefToOverrides } from "@/lib/mistral";
import { getCategory, DEFAULT_CATEGORY } from "@/lib/categories";

/** Laisse le temps à Mistral de réécrire tout le contenu (sinon coupé ~10 s). */
export const maxDuration = 60;

/** Marqueur "système prospect" (prospects.created_by est uuid nullable, sans FK). */
const PROSPECT_SYSTEM_ID = "00000000-0000-0000-0000-000000000000";
const MAX_PHOTOS = 12;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

/** Déduit un nom d'affichage du brief (« Camille, photographe… » → « Camille »). */
function firstNameFromBrief(brief: string): string {
  const firstLine = brief.split(/[\n.]/)[0]?.trim() ?? "";
  const head = firstLine.split(/[,–—-]/)[0]?.trim() ?? "";
  const name = head.replace(/^(je m'appelle|moi c'est|c'est)\s+/i, "").trim();
  return (name || "Votre Studio").slice(0, 40);
}

export async function POST(request: Request) {
  try {
    const origin = new URL(request.url).origin;

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }

    // Honeypot anti-bot (champ caché « company » : doit rester vide).
    if (String(form.get("company") ?? "").trim()) {
      return NextResponse.json({ error: "Rejeté." }, { status: 400 });
    }

    const brief = String(form.get("brief") ?? "").trim();
    if (brief.length < 3) {
      return NextResponse.json(
        { error: "Décrivez votre activité en une phrase." },
        { status: 400 },
      );
    }

    const category =
      getCategory(String(form.get("category") ?? "")) ?? DEFAULT_CATEGORY;
    if (!category.active) {
      return NextResponse.json(
        { error: "Cette catégorie arrive bientôt." },
        { status: 400 },
      );
    }

    let templateId = String(form.get("templateId") ?? "");
    if (
      !isTemplateId(templateId) ||
      !category.templateIds.includes(templateId as TemplateId)
    ) {
      templateId = category.defaultTemplateId;
    }

    const baseContent = (await fetchDefaultContent(origin, templateId)) as
      | Record<string, unknown>
      | null;
    if (!baseContent) {
      return NextResponse.json(
        { error: "Template indisponible." },
        { status: 500 },
      );
    }

    // Photos libres (clé « photo ») → assignées aux slots dans l'ordre.
    // Slots non remplis = photos démo conservées (natif de buildContent).
    const slots = collectImageSlots(baseContent, templateId);
    const files: File[] = [];
    for (const [key, value] of form.entries()) {
      if (key !== "photo") continue;
      if (!(value instanceof File) || value.size === 0) continue;
      if (value.size > MAX_PHOTO_BYTES) continue;
      files.push(value);
      if (files.length >= MAX_PHOTOS) break;
    }
    const photos: PhotoUpload[] = [];
    for (let i = 0; i < files.length && i < slots.length; i++) {
      photos.push({
        slotUrl: slots[i],
        data: await files[i].arrayBuffer(),
        contentType: files[i].type || "image/jpeg",
      });
    }

    // Personnalisation des textes (fallback {} si IA indispo/timeout).
    let textOverrides: Record<string, unknown> = {};
    try {
      const manifest = await fetchTemplateManifest(origin, templateId);
      textOverrides = await briefToOverrides({
        brief,
        manifest,
        defaultContent: baseContent,
        categoryLabel: category.label,
      });
    } catch {
      textOverrides = {};
    }

    const result = await generateSite({
      templateId,
      firstName: firstNameFromBrief(brief),
      email: null,
      textOverrides,
      photos,
      baseContent,
      createdBy: PROSPECT_SYSTEM_ID,
    });

    return NextResponse.json({
      ...result,
      templateId,
      usedDemoPhotos: photos.length === 0,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur de génération.";
    console.error("[prospect/generate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
