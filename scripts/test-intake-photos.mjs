// Test : simule un intake avec photos, pour vérifier l'assignation vision du worker.
// node --env-file=.env.local scripts/test-intake-photos.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const OP = "79e7824f-4423-4e9e-8a4a-a31ead427d8d";
const imgs = ["p1", "p2", "p3", "p7", "p9"];

const { data: job, error } = await admin
  .from("jobs")
  .insert({ type: "create_site", status: "pending", created_by: OP })
  .select("id")
  .single();
if (error) throw error;

const photos = [];
for (let i = 0; i < imgs.length; i++) {
  const buf = readFileSync(
    join(ROOT, `public/_templates/alice-r/img/${imgs[i]}.jpg`),
  );
  const path = `${job.id}/${i}.jpg`;
  await admin.storage
    .from("intake")
    .upload(path, buf, { contentType: "image/jpeg", upsert: true });
  photos.push({ path, contentType: "image/jpeg" });
}

await admin
  .from("jobs")
  .update({
    payload: {
      templateId: "alice-r",
      firstName: "PhotoTest",
      email: null,
      rawText:
        "Studio Vision — portraitiste et photographe de mariage à Paris. Style naturel et lumineux.",
      photos,
    },
  })
  .eq("id", job.id);

writeFileSync("/tmp/sg_photojob.txt", job.id);
console.log(`✓ job ${job.id} créé avec ${photos.length} photos`);
