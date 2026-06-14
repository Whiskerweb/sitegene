// lib/foundry/library/agency-a.test.ts
// Lot « agency-a » : les 4 sections signature du template creative-agency sont
// câblées partout (manifests, samples, registre React) et rendent en SSR avec
// leur sample — le contrat exact que verra l'Assembler.
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { MANIFESTS } from "../manifests";
import { getSample } from "../samples";
import { manifests as agencyManifests } from "./agency-a";
import { COMPONENTS_AGENCY_A } from "@/components/foundry/library/agency-a";
import { LIBRARY_COMPONENTS } from "@/components/foundry/library";
import { heroOptionsForTrade, isExcludedForTrade } from "../hero-router";

const IDS = ["bold-type-hero", "sticky-stack-projects", "outline-services-list", "letter-tile-cta"];
const SKIN = { accent: "#0099ff" } as never;

describe("lot agency-a", () => {
  it("les 4 composants sont déclarés au catalogue ET au registre React", () => {
    for (const id of IDS) {
      expect(agencyManifests[id], `manifest manquant : ${id}`).toBeDefined();
      expect(MANIFESTS[id], `non agrégé dans MANIFESTS : ${id}`).toBeDefined();
      expect(COMPONENTS_AGENCY_A[id], `composant React manquant : ${id}`).toBeDefined();
      expect(LIBRARY_COMPONENTS[id], `non agrégé dans LIBRARY_COMPONENTS : ${id}`).toBeDefined();
    }
  });

  it("chaque composant rend en SSR avec son sample (contrat Assembler)", () => {
    for (const id of IDS) {
      const html = renderToString(
        createElement(COMPONENTS_AGENCY_A[id], { content: getSample(id), skin: SKIN }),
      );
      expect(html.length, `${id} : rendu vide`).toBeGreaterThan(200);
      expect(html, `${id} : doit poser un <section>`).toContain("<section");
    }
  });

  it("rend aussi avec un content VIDE (recette minimale, pas de crash)", () => {
    for (const id of IDS) {
      const html = renderToString(
        createElement(COMPONENTS_AGENCY_A[id], { content: {}, skin: SKIN }),
      );
      expect(html, `${id} : crash sur content vide`).toContain("<section");
    }
  });

  it("la vignette-lettre remplace bien le « * » par l'image", () => {
    const html = renderToString(
      createElement(COMPONENTS_AGENCY_A["letter-tile-cta"], {
        content: { lines: ["AVANT", "CH*SE", "APRÈS"], tile: "/x.jpg", cta: "Go" },
        skin: SKIN,
      }),
    );
    expect(html).toContain("/x.jpg");
    expect(html).not.toContain("CH*SE"); // la ligne étoilée est éclatée autour de la vignette
  });

  it("bold-type-hero est routé : proposé aux métiers créatifs, exclu des métiers doux", () => {
    expect(heroOptionsForTrade("autre", "")).toContain("bold-type-hero");
    expect(heroOptionsForTrade("conseil", "")).toContain("bold-type-hero");
    expect(heroOptionsForTrade("musicien", "")).toContain("bold-type-hero");
    expect(isExcludedForTrade("bold-type-hero", "hero", "coach")).toBe(true);
    expect(isExcludedForTrade("bold-type-hero", "hero", "artisan")).toBe(true);
    expect(isExcludedForTrade("bold-type-hero", "hero", "autre")).toBe(false);
    // les sections non-hero du lot restent disponibles partout
    expect(isExcludedForTrade("sticky-stack-projects", "gallery", "coach")).toBe(false);
    expect(isExcludedForTrade("letter-tile-cta", "cta", "artisan")).toBe(false);
  });
});
