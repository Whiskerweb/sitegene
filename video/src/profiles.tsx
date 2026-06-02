import React from "react";
import { SiteMockup, SCROLL as BREVAL_SCROLL } from "./site/SiteMockup";
import { POTOZON_THEME, ALICE_THEME, blendTheme } from "./site/siteTheme";
import { EloctixMockup, ELOCTIX_SCROLL, blendEloctix } from "./site/EloctixMockup";

// Un « profil » = tout ce qui change entre les deux versions de la vidéo.
// Les scènes sont génériques et lisent ces données.
export type DemoProfile = {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Mockup: React.FC<{ theme: any; scrollY?: number; titleNode?: React.ReactNode }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  themeAt: (t: number) => any; // t=0 clair, t=1 sombre
  scroll: { services: number; gallery: number };
  chatMessage: string;
  trayLabel: string;
  dragImages: [string, string, string];
  edit: { old: string; new: string };
  // transform de S5 pour amener le titre du hero près du curseur (~640,540)
  s5: { scale: number; tx: number; ty: number };
  s5Badge: { left: number; top: number };
};

export const BREVAL: DemoProfile = {
  id: "breval",
  Mockup: SiteMockup,
  themeAt: (t) => blendTheme(POTOZON_THEME, ALICE_THEME, t),
  scroll: { services: BREVAL_SCROLL.services, gallery: BREVAL_SCROLL.gallery },
  chatMessage: "Je veux un site, je suis électricien, je m'appelle Lucas Bréval.",
  trayLabel: "glissez vos photos ✦",
  dragImages: ["img/p8.jpg", "img/p10.jpg", "img/p12.jpg"],
  edit: { old: "Votre électricien à Annecy.", new: "Dépannage 7j/7 à Annecy." },
  s5: { scale: 1.2, tx: 150, ty: 200 },
  s5Badge: { left: 1120, top: 360 },
};

export const ELOCTIX: DemoProfile = {
  id: "eloctix",
  Mockup: EloctixMockup,
  themeAt: (t) => blendEloctix(t),
  scroll: { services: ELOCTIX_SCROLL.services, gallery: ELOCTIX_SCROLL.gallery },
  chatMessage: "Je veux un site pour mon entreprise d'électricité, à Paris.",
  trayLabel: "glissez vos photos ✦",
  dragImages: ["eloctix/svc1.jpg", "eloctix/svc4.jpg", "eloctix/intro-b.jpg"],
  edit: { old: "Alimenter votre éclairage", new: "Dépannage 7j/7 à Paris" },
  s5: { scale: 1.08, tx: 250, ty: 150 },
  s5Badge: { left: 1090, top: 320 },
};
