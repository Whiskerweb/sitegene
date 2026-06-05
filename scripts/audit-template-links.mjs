#!/usr/bin/env node
/**
 * [5.1] Audit des liens de TOUS les templates (public/_templates/*).
 *
 * Parcourt chaque fichier .html et vérifie chaque <a href="...">  :
 *  - "#ancre"        → l'élément id="ancre" doit exister dans le fichier ;
 *  - "#"             → mort s'il porte data-sg-path SANS data-sg-page
 *                      (les data-sg-page sont réécrits au rendu) ;
 *  - "page.html"     → le fichier doit exister dans le dossier du template
 *                      (et être déclaré dans manifest.pages) ;
 *  - http(s)/mailto/tel → ignorés (externes).
 *
 * Les liens morts sont LOGGÉS ici et neutralisés au rendu par le runtime
 * sg-mask (lib/site-server.ts) : .nav-link--disabled + tooltip.
 *
 * Usage : node scripts/audit-template-links.mjs [templateId]
 * Sortie : rapport console + code de sortie 1 si liens cassés.
 */
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "public", "_templates");
const only = process.argv[2];

const templates = readdirSync(ROOT).filter((d) => {
  if (only && d !== only) return false;
  try {
    return statSync(join(ROOT, d)).isDirectory();
  } catch {
    return false;
  }
});

let broken = 0;
let deadHash = 0;
let checked = 0;

for (const tid of templates) {
  const dir = join(ROOT, tid);
  const htmlFiles = readdirSync(dir).filter((f) => f.endsWith(".html"));
  let manifestPages = [];
  try {
    const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
    manifestPages = (manifest.pages ?? []).map((p) => p.file).filter(Boolean);
  } catch {
    /* pas de manifest → pas de pages déclarées */
  }

  const issues = [];
  for (const file of htmlFiles) {
    const html = readFileSync(join(dir, file), "utf8");
    const ids = new Set(
      Array.from(html.matchAll(/\bid=["']([^"']+)["']/g)).map((m) => m[1]),
    );
    const anchors = Array.from(
      html.matchAll(/<a\b([^>]*)\bhref=["']([^"']*)["']([^>]*)>/gi),
    );

    for (const [, before, href, after] of anchors) {
      checked++;
      const attrs = before + after;
      const hasPage = /data-sg-page=/.test(attrs);
      const hasPath = /data-sg-path=/.test(attrs);

      if (/^(https?:|mailto:|tel:|javascript:)/i.test(href)) continue;
      if (hasPage) continue; // réécrit au rendu (nav inter-pages)

      if (href === "#" || href === "") {
        if (hasPath) {
          // lien de nav annoté sans cible : mort (neutralisé au rendu)
          issues.push(`${file}: <a href="#"> nav sans cible (${attrs.match(/data-sg-path=["'][^"']+["']/)?.[0] ?? ""})`);
          deadHash++;
        }
        continue;
      }
      if (href.startsWith("#")) {
        if (!ids.has(href.slice(1))) {
          issues.push(`${file}: ancre cassée ${href}`);
          broken++;
        }
        continue;
      }
      // lien relatif vers une page du template
      const target = href.split(/[?#]/)[0];
      if (/^[a-z0-9][a-z0-9._/-]*\.html$/i.test(target)) {
        if (!existsSync(join(dir, target))) {
          issues.push(`${file}: page manquante ${target}`);
          broken++;
        } else if (!manifestPages.includes(target) && target !== "index.html") {
          issues.push(`${file}: ${target} non déclarée dans manifest.pages`);
          broken++;
        }
      }
    }
  }

  if (issues.length > 0) {
    console.log(`\n✗ ${tid}`);
    for (const i of issues) console.log(`   ${i}`);
  } else {
    console.log(`✓ ${tid}`);
  }
}

console.log(
  `\n${checked} liens vérifiés sur ${templates.length} templates — ` +
    `${broken} cassé(s), ${deadHash} lien(s) de nav morts (neutralisés au rendu).`,
);
process.exit(broken > 0 ? 1 : 0);
