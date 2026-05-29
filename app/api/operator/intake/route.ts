import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTemplateId } from "@/lib/templates";

/**
 * Intake : reçoit texte brut + photos, dépose un JOB `create_site` (pending).
 * Le worker local (Claude Code) le traitera. Ne génère PAS le site ici.
 */
export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile?.is_operator) {
    return NextResponse.json({ error: "Accès opérateur requis." }, { status: 403 });
  }

  const form = await request.formData();
  const templateId = String(form.get("templateId") ?? "");
  const firstName = String(form.get("firstName") ?? "").trim();
  const email = (form.get("email") as string) || null;
  const rawText = String(form.get("rawText") ?? "");

  if (!isTemplateId(templateId)) {
    return NextResponse.json({ error: "Template inconnu." }, { status: 400 });
  }
  if (!firstName) {
    return NextResponse.json({ error: "Prénom requis." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Crée le job d'abord (pour avoir l'id = dossier de staging des photos).
  const { data: job, error: jErr } = await admin
    .from("jobs")
    .insert({ type: "create_site", status: "pending", created_by: profile.id })
    .select("id")
    .single();
  if (jErr || !job) {
    return NextResponse.json({ error: jErr?.message ?? "Job." }, { status: 500 });
  }

  // Upload des photos brutes dans le bucket intake (staging).
  const photos: { slotUrl: string; path: string; contentType: string }[] = [];
  for (const [key, value] of form.entries()) {
    if (!key.startsWith("photo:")) continue;
    if (!(value instanceof File) || value.size === 0) continue;
    const slotUrl = key.slice(6);
    const base = slotUrl.split("/").pop() || "photo.jpg";
    const path = `${job.id}/${base}`;
    const { error: upErr } = await admin.storage
      .from("intake")
      .upload(path, await value.arrayBuffer(), {
        contentType: value.type || "image/jpeg",
        upsert: true,
      });
    if (!upErr) {
      photos.push({ slotUrl, path, contentType: value.type || "image/jpeg" });
    }
  }

  await admin
    .from("jobs")
    .update({ payload: { templateId, firstName, email, rawText, photos } })
    .eq("id", job.id);

  return NextResponse.json({ jobId: job.id });
}
