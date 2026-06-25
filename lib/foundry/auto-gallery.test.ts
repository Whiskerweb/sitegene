// lib/foundry/auto-gallery.test.ts
import { describe, it, expect } from "vitest";
import { ensurePhotoGallery } from "./auto-gallery";
import { getManifest } from "./manifests";
import type { Recipe } from "./types";

function recipe(components: string[]): Recipe {
  return {
    vibe: "ocean-confiance",
    sections: components.map((component) => ({ component, content: {} })),
  };
}

const photos = (n: number) => Array.from({ length: n }, (_, i) => `https://cdn/p${i}.jpg`);

const roles = (r: Recipe) => r.sections.map((s) => getManifest(s.component)?.role ?? "");

describe("ensurePhotoGallery", () => {
  it("n'ajoute rien sous le seuil (< 6 photos)", () => {
    const r = recipe(["hero-split-asym", "footer-giant-brand"]);
    expect(ensurePhotoGallery(r, photos(5))).toEqual(r);
  });

  it("ajoute une galerie quand >= 6 photos et aucune galerie existante", () => {
    const before = recipe(["hero-split-asym", "services-rows", "footer-giant-brand"]);
    const after = ensurePhotoGallery(before, photos(8));
    const galleries = after.sections.filter((s) => getManifest(s.component)?.role === "gallery");
    expect(galleries).toHaveLength(1);
    expect(galleries[0].component).toBe("gallery-mosaic");
    expect(galleries[0].content.images).toHaveLength(8);
  });

  it("insère la galerie JUSTE AVANT le footer", () => {
    const after = ensurePhotoGallery(recipe(["hero-split-asym", "footer-giant-brand"]), photos(6));
    expect(roles(after)).toEqual(["hero", "gallery", "footer"]);
  });

  it("met la galerie en queue s'il n'y a pas de footer", () => {
    const after = ensurePhotoGallery(recipe(["hero-split-asym"]), photos(6));
    expect(roles(after)).toEqual(["hero", "gallery"]);
  });

  it("n'ajoute pas de 2e galerie si une existe déjà (idempotent)", () => {
    const before = recipe(["hero-split-asym", "gallery-mosaic", "footer-giant-brand"]);
    const after = ensurePhotoGallery(before, photos(10));
    expect(after).toEqual(before);
  });

  it("cappe à 12 photos", () => {
    const after = ensurePhotoGallery(recipe(["hero-split-asym", "footer-giant-brand"]), photos(30));
    const g = after.sections.find((s) => getManifest(s.component)?.role === "gallery");
    expect((g!.content.images as string[]).length).toBe(12);
  });

  it("ne mute pas l'entrée", () => {
    const before = recipe(["hero-split-asym", "footer-giant-brand"]);
    const snapshot = JSON.parse(JSON.stringify(before));
    ensurePhotoGallery(before, photos(6));
    expect(before).toEqual(snapshot);
  });
});
