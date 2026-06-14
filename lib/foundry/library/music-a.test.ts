// lib/foundry/library/music-a.test.ts
// Lot « music-a » : les 5 sections artiste/DJ (hero-drop, release-grid,
// tour-dates, artist-statement, booking-cta) sont câblées partout (manifests,
// samples, registre React), rendent en SSR avec leur sample, et sont routées
// pour le métier musicien — le contrat exact que verra l'Assembler.
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { MANIFESTS } from "../manifests";
import { getSample } from "../samples";
import { manifests as musicManifests } from "./music-a";
import { COMPONENTS_MUSIC_A } from "@/components/foundry/library/music-a";
import { LIBRARY_COMPONENTS } from "@/components/foundry/library";
import { heroOptionsForTrade, isExcludedForTrade, resolveHero, tradeSectionHint } from "../hero-router";

const IDS = ["hero-drop", "release-grid", "tour-dates", "artist-statement", "booking-cta"];
const SKIN = { accent: "#0099ff" } as never;

describe("lot music-a", () => {
  it("les 5 composants sont déclarés au catalogue ET au registre React", () => {
    for (const id of IDS) {
      expect(musicManifests[id], `manifest manquant : ${id}`).toBeDefined();
      expect(MANIFESTS[id], `non agrégé dans MANIFESTS : ${id}`).toBeDefined();
      expect(COMPONENTS_MUSIC_A[id], `composant React manquant : ${id}`).toBeDefined();
      expect(LIBRARY_COMPONENTS[id], `non agrégé dans LIBRARY_COMPONENTS : ${id}`).toBeDefined();
    }
  });

  it("chaque composant rend en SSR avec son sample (contrat Assembler)", () => {
    for (const id of IDS) {
      const html = renderToString(createElement(COMPONENTS_MUSIC_A[id], { content: getSample(id), skin: SKIN }));
      expect(html.length, `${id} : rendu vide`).toBeGreaterThan(200);
      expect(html, `${id} : doit poser un <section>`).toContain("<section");
    }
  });

  it("rend aussi avec un content VIDE (recette minimale, pas de crash)", () => {
    for (const id of IDS) {
      const html = renderToString(createElement(COMPONENTS_MUSIC_A[id], { content: {}, skin: SKIN }));
      expect(html, `${id} : crash sur content vide`).toContain("<section");
    }
  });

  it("hero-drop est routé : proposé aux musiciens, recommandé pour les DA club/électro", () => {
    expect(heroOptionsForTrade("musicien", "")).toContain("hero-drop");
    expect(resolveHero("musicien", "volt-graphite")).toBe("hero-drop");
    expect(resolveHero("musicien", "arena-rouge")).toBe("hero-drop");
    // la valeur par défaut musicien reste le hero historique
    expect(resolveHero("musicien", "")).toBe("jazz-vocalist-hero");
  });

  it("les sections de contenu portent un indice d'usage musicien", () => {
    expect(tradeSectionHint("release-grid", "musicien")).toMatch(/discographie|pochette/i);
    expect(tradeSectionHint("tour-dates", "musicien")).toMatch(/tournée|date|concert/i);
    expect(tradeSectionHint("artist-statement", "musicien")).toMatch(/manifeste|plateforme|écoute/i);
    expect(tradeSectionHint("booking-cta", "musicien")).toMatch(/book|contact/i);
  });

  it("la grille de sorties rend bien chaque pochette + le voile « écouter »", () => {
    const html = renderToString(createElement(COMPONENTS_MUSIC_A["release-grid"], { content: getSample("release-grid"), skin: SKIN }));
    expect(html).toContain("album1.jpg");
    expect(html).toContain("Nightform");
  });
});
