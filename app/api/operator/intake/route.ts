import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTemplateId } from "@/lib/templates";

/**
 * Intake : reçoit texte brut + photos, dépose un JOB `create_site` (pending).
 * Le worker local (Claude Code) le traitera. Renvoie TOUJOURS du JSON.
 */
export async function POST(request: Request) {
  try {
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

    const { data: job, error: jErr } = await admin
      .from("jobs")
      .insert({ type: "create_site", status: "pending", created_by: profile.id })
      .select("id")
      .single();
    if (jErr || !job) {
      return NextResponse.json(
        { error: `Création du job: ${jErr?.message ?? "inconnue"}` },
        { status: 500 },
      );
    }

    // Upload des photos (sélection ordonnée) dans le bucket intake (staging).
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
      if (upErr) {
        return NextResponse.json(
          { error: `Upload photo ${i}: ${upErr.message}` },
          { status: 500 },
        );
      }
      photos.push({ path, contentType: file.type || "image/jpeg" });
      i++;
    }

    const { error: updErr } = await admin
      .from("jobs")
      .update({ payload: { templateId, firstName, email, rawText, photos } })
      .eq("id", job.id);
    if (updErr) {
      return NextResponse.json(
        { error: `MAJ payload: ${updErr.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ jobId: job.id, photos: photos.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur serveur inconnue.";
    console.error("[intake] erreur:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
