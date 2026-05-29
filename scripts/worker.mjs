// Worker local : exécute les jobs (création/modification de site) en lançant
// Claude Code en local (`claude -p`, abonnement, sans clé API), puis pousse le
// résultat (contenu + site) vers Supabase.
//
//   npm run worker        → boucle (poll toutes les 3 s)
//   npm run worker:once   → traite les jobs en attente puis s'arrête
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ONCE = process.argv.includes("--once");

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

/** Lance `claude -p` en headless (prompt en argument → les @refs images sont prises en compte). */
function runClaude(prompt) {
  return new Promise((resolve, reject) => {
    const p = spawn("claude", ["-p", prompt, "--output-format", "json"], {
      cwd: ROOT,
    });
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("error", reject);
    p.on("close", (code) => {
      if (code !== 0) return reject(new Error(`claude exit ${code}: ${err}`));
      try {
        const env = JSON.parse(out);
        resolve(env.result ?? out);
      } catch {
        resolve(out);
      }
    });
  });
}

/** Extrait un objet JSON d'une réponse texte (gère les ```json ... ```). */
function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function loadTemplateFile(templateId, file) {
  return JSON.parse(
    readFileSync(join(ROOT, "public", "_templates", templateId, file), "utf8"),
  );
}

/** Claude structure le texte brut en overrides de champs. */
async function claudeFillText(templateId, rawText) {
  if (!rawText || !rawText.trim()) return {};
  const manifest = loadTemplateFile(templateId, "manifest.json");
  const scalar = (manifest.fields?.editable ?? []).filter(
    (f) => !String(f.path).includes("[]"),
  );
  const fieldList = scalar.map((f) => `- ${f.path} — ${f.label}`).join("\n");
  const prompt = `Tu remplis le contenu d'un site vitrine de photographe, en français.
Champs disponibles (chemin — description) :
${fieldList}

Infos brutes fournies par le photographe :
"""
${rawText}
"""

Consigne : renvoie UNIQUEMENT un objet JSON { "chemin": "valeur" } pour les champs que tu peux remplir à partir de ces infos. Style premium et concis. N'invente AUCUN fait absent des infos (pas de faux noms de clients, chiffres ou récompenses). Ignore les champs non renseignables. Aucune autre sortie que le JSON.`;

  let text = "";
  try {
    text = await runClaude(prompt);
  } catch (e) {
    log(`  ⚠ Claude indisponible (${e?.message ?? e}) — on garde les défauts.`);
    return {};
  }
  const obj = extractJson(text) ?? {};
  const allowed = new Set(scalar.map((f) => f.path));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (allowed.has(k) && typeof v === "string" && v.trim()) out[k] = v;
  }
  return out;
}

/** Claude (vision) assigne chaque emplacement à l'index de la meilleure photo. */
async function claudeAssignPhotos(jobId, manifest, slotUrls, buffers) {
  const fallback = {};
  slotUrls.forEach((u, i) => (fallback[u] = Math.min(i, buffers.length - 1)));
  if (buffers.length === 0) return fallback;

  const tmpRel = `.intake-tmp/${jobId}`;
  const tmpAbs = join(ROOT, tmpRel);
  try {
    mkdirSync(tmpAbs, { recursive: true });
    const refs = [];
    buffers.forEach((b, i) => {
      writeFileSync(join(ROOT, `${tmpRel}/${i}.jpg`), Buffer.from(b.data));
      refs.push(`Photo ${i} : @${tmpRel}/${i}.jpg`);
    });
    const roleBySlot = {};
    (manifest.photos || []).forEach((p) => {
      roleBySlot[p.slot] = p.role + (p.note ? ` (${p.note})` : "");
    });
    const slotList = slotUrls
      .map((u) => {
        const name = (u.split("/").pop() || "").replace(/\.\w+$/, "");
        return `- ${name} — ${roleBySlot[name] || "image"}`;
      })
      .join("\n");
    const prompt = `Tu places les photos d'un photographe sur les emplacements de son site.
Emplacements (nom — rôle) :
${slotList}

Photos disponibles (index → image) :
${refs.join("\n")}

Regarde chaque photo et assigne à CHAQUE emplacement l'index de la photo la plus adaptée (visage/portrait serré → avatars ; photo large et marquante → hero ; variété pour la galerie ; cohérence du sujet selon le rôle). Une même photo peut servir plusieurs emplacements. Renvoie UNIQUEMENT un JSON { "<nom_emplacement>": <index_photo_entier> }.`;
    const obj = extractJson(await runClaude(prompt));
    if (!obj) return fallback;
    const out = {};
    for (const u of slotUrls) {
      const name = (u.split("/").pop() || "").replace(/\.\w+$/, "");
      const idx = obj[name];
      out[u] =
        Number.isInteger(idx) && idx >= 0 && idx < buffers.length
          ? idx
          : fallback[u];
    }
    return out;
  } catch (e) {
    log(`  ⚠ assignation vision échouée (${e?.message ?? e}) — ordre par défaut.`);
    return fallback;
  } finally {
    try {
      rmSync(tmpAbs, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

async function processCreateSite(job) {
  const { templateId, firstName, email, rawText, photos = [] } = job.payload;
  const baseContent = loadTemplateFile(templateId, "default-content.json");
  const manifest = loadTemplateFile(templateId, "manifest.json");
  const { collectImageSlots } = await import(join(ROOT, "lib/content-overlay.ts"));
  const slotUrls = collectImageSlots(baseContent, templateId);

  log(`  → Claude structure le texte (${(rawText || "").length} car.)`);
  const textOverrides = await claudeFillText(templateId, rawText);
  log(`  → ${Object.keys(textOverrides).length} champs remplis`);

  // Télécharge les photos de staging (ordonnées).
  const buffers = [];
  for (const ph of photos) {
    const { data, error } = await admin.storage.from("intake").download(ph.path);
    if (error || !data) continue;
    buffers.push({ data: await data.arrayBuffer(), contentType: ph.contentType });
  }

  // Assignation auto photo → emplacement.
  let photoUploads = [];
  if (buffers.length > 0) {
    log(`  → Claude assigne ${buffers.length} photos sur ${slotUrls.length} emplacements`);
    const assign = await claudeAssignPhotos(job.id, manifest, slotUrls, buffers);
    photoUploads = slotUrls
      .map((url) => {
        const b = buffers[assign[url]];
        return b ? { slotUrl: url, data: b.data, contentType: b.contentType } : null;
      })
      .filter(Boolean);
  }

  const { generateSite } = await import(join(ROOT, "lib/generate.ts"));
  return generateSite({
    templateId,
    firstName,
    email,
    textOverrides,
    photos: photoUploads,
    baseContent,
    createdBy: job.created_by,
  });
}

async function processModifySite(job) {
  const { siteId, instruction, noteId } = job.payload;
  const { data: site } = await admin
    .from("sites")
    .select("id, template_id, status, owner_user_id")
    .eq("id", siteId)
    .single();
  const { data: sc } = await admin
    .from("site_content")
    .select("content_json, version")
    .eq("site_id", siteId)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const prompt = `Voici le contenu JSON d'un site de photographe :
${JSON.stringify(sc.content_json)}

Demande de modification du client : "${instruction}"

Consigne : applique la demande et renvoie UNIQUEMENT le contenu JSON COMPLET modifié (même structure exacte). Ne touche pas aux champs structurels (arcPhotos, couleurs, scrollAccents, cards, galleryOrder) ni aux URLs d'images. Aucune autre sortie que le JSON.`;
  const text = await runClaude(prompt);
  const newContent = extractJson(text);
  if (!newContent) throw new Error("Claude n'a pas renvoyé de JSON valide.");

  const nextVersion = (sc.version ?? 0) + 1;
  await admin.from("site_content").insert({
    site_id: siteId,
    version: nextVersion,
    content_json: newContent,
    is_published: site.status === "live",
    created_by: "ai",
  });

  // Note résolue + décompte d'un crédit au propriétaire.
  if (noteId) {
    await admin
      .from("notes")
      .update({
        status: "done",
        credits_charged: true,
        resulting_content_version: nextVersion,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", noteId);
    if (site.owner_user_id) {
      const { grantCredits } = await import(join(ROOT, "lib/credits-server.ts"));
      await grantCredits(admin, site.owner_user_id, -1, "note_spend", {
        note_id: noteId,
      });
    }
  }
  return { siteId, version: nextVersion };
}

async function processOne() {
  const { data: job } = await admin
    .from("jobs")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!job) return false;

  log(`Job ${job.id} (${job.type}) → running`);
  await admin
    .from("jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", job.id);

  try {
    const result =
      job.type === "create_site"
        ? await processCreateSite(job)
        : await processModifySite(job);
    await admin
      .from("jobs")
      .update({
        status: "done",
        result,
        site_id: result.siteId ?? job.site_id,
        finished_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    log(`Job ${job.id} ✓ done`, JSON.stringify(result));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin
      .from("jobs")
      .update({ status: "error", error: msg, finished_at: new Date().toISOString() })
      .eq("id", job.id);
    log(`Job ${job.id} ✗ error: ${msg}`);
  }
  return true;
}

log(`Worker démarré (${ONCE ? "once" : "boucle"}).`);
if (ONCE) {
  let any = false;
  while (await processOne()) any = true;
  if (!any) log("Aucun job en attente.");
  process.exit(0);
} else {
  // boucle de poll
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const did = await processOne();
      if (!did) await new Promise((r) => setTimeout(r, 3000));
    } catch (e) {
      log("Erreur boucle:", e?.message ?? e);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}
