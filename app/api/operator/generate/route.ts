import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { fetchDefaultContent } from "@/lib/site-server";
import { generateSite, type PhotoUpload } from "@/lib/generate";
import { isTemplateId } from "@/lib/templates";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile?.is_operator) {
    return NextResponse.json({ error: "Accès opérateur requis." }, { status: 403 });
  }

  const origin = new URL(request.url).origin;
  const form = await request.formData();

  const templateId = String(form.get("templateId") ?? "");
  const firstName = String(form.get("firstName") ?? "").trim();
  const email = (form.get("email") as string) || null;

  if (!isTemplateId(templateId)) {
    return NextResponse.json({ error: "Template inconnu." }, { status: 400 });
  }
  if (!firstName) {
    return NextResponse.json({ error: "Prénom requis." }, { status: 400 });
  }

  let textOverrides: Record<string, unknown> = {};
  try {
    textOverrides = JSON.parse(String(form.get("overrides") ?? "{}"));
  } catch {
    return NextResponse.json({ error: "overrides invalide." }, { status: 400 });
  }

  const baseContent = (await fetchDefaultContent(origin, templateId)) as
    | Record<string, unknown>
    | null;
  if (!baseContent) {
    return NextResponse.json(
      { error: "Contenu par défaut indisponible." },
      { status: 500 },
    );
  }

  // Photos : entrées de clé "photo:<slotUrl>".
  const photos: PhotoUpload[] = [];
  for (const [key, value] of form.entries()) {
    if (!key.startsWith("photo:")) continue;
    if (!(value instanceof File) || value.size === 0) continue;
    photos.push({
      slotUrl: key.slice(6),
      data: await value.arrayBuffer(),
      contentType: value.type || "image/jpeg",
    });
  }

  try {
    const result = await generateSite({
      templateId,
      firstName,
      email,
      textOverrides,
      photos,
      baseContent,
      createdBy: profile.id,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur de génération.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
