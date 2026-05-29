// Test de génération (appelle la vraie lib/generate.ts via tsx).
// node --env-file=.env.local --import tsx scripts/test-generate.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { generateSite } = await import(join(ROOT, "lib/generate.ts"));
const baseContent = JSON.parse(
  readFileSync(
    join(ROOT, "public/_templates/alice-r/default-content.json"),
    "utf8",
  ),
);

const res = await generateSite({
  templateId: "alice-r",
  firstName: "TestProspect",
  email: "test@example.com",
  textOverrides: {
    "hero.brand": "Maison Test",
    "hero.subtitle": "Photographe de test — généré par l'opérateur.",
  },
  photos: [],
  baseContent,
  createdBy: "79e7824f-4423-4e9e-8a4a-a31ead427d8d",
});

writeFileSync("/tmp/sg_token.txt", res.token);
console.log("RESULT", JSON.stringify(res));
