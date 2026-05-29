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

  // Upload des photos brutes (sélection ordonnée) dans le bucket intake (staging).
  // L'assignation photo → emplacement est faite automatiquement par le worker (Claude vision).
  const photos: { path: string; contentType: string }[] = [];
  const files = form
    .getAll("photos")
    .filter((v): v is File => v instanceof File && v.size > 0);
  let i = 0;
  for (const file of files) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 5);
    const path = `${job.id}/${i}.${ext}`;
    const { error: upErr } = await admin.storage
      .from("intake")
      .upload(path, await file.arrayBuffer(), {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });
    if (!upErr) {
      photos.push({ path, contentType: file.type || "image/jpeg" });
      i++;
    }
  }

  await admin
    .from("jobs")
    .update({ payload: { templateId, firstName, email, rawText, photos } })
    .eq("id", job.id);

  return NextResponse.json({ jobId: job.id });
}
