"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./tour.css";

/**
 * Onboarding guidé « atelier » (driver.js) — déclenché APRÈS la roue de
 * bienvenue. Machine à états persistée dans localStorage `akyra_tour_v1` :
 *   "pending"  → étape dashboard (ouvrir L'Atelier)
 *   "atelier"  → étapes de l'atelier (texte, charte, sections, publier)
 *   "done"     → terminé
 * Le passage à "pending" est écrit par la roue (WheelModal) qui émet aussi
 * l'événement `akyra-tour-kick` → démarrage immédiat sans dépendre d'un timing
 * de re-render. Périmètre v1 : sites foundry (/atelier).
 */
const KEY = "akyra_tour_v1";
export const TOUR_KICK_EVENT = "akyra-tour-kick";

/** Attend qu'un sélecteur soit présent dans le DOM (l'éditeur monte en client). */
function waitFor(selector: string, timeoutMs = 6000): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) return resolve(true);
    const t0 = Date.now();
    const iv = window.setInterval(() => {
      if (document.querySelector(selector)) {
        window.clearInterval(iv);
        resolve(true);
      } else if (Date.now() - t0 > timeoutMs) {
        window.clearInterval(iv);
        resolve(false);
      }
    }, 150);
  });
}

export default function OnboardingTour() {
  const pathname = usePathname();
  const startedRef = useRef(false);
  const driverRef = useRef<Driver | null>(null);

  useEffect(() => {
    const click = (sel: string) =>
      (document.querySelector(sel) as HTMLElement | null)?.click();

    /** Étape unique sur le dashboard : « Ouvrir L'Atelier ». */
    const startDashboard = () => {
      const SEL = 'a[href="/atelier"]';
      waitFor(SEL, 4000).then((ok) => {
        // Pas de site foundry (lien absent) → on n'a pas de tutoriel à montrer.
        if (!ok) {
          window.localStorage.setItem(KEY, "done");
          return;
        }
        const d = driver({
          allowClose: false,
          stagePadding: 6,
          stageRadius: 14,
          popoverClass: "akyra-tour",
          steps: [
            {
              element: SEL,
              popover: {
                title: "Personnalisez votre site 🎨",
                description:
                  "Vos crédits en poche, entrons dans L'Atelier pour rendre votre site unique. C'est par ici.",
                showButtons: ["next"],
                nextBtnText: "Ouvrir L'Atelier →",
              },
            },
          ],
          onNextClick: () => {
            window.localStorage.setItem(KEY, "atelier");
            d.destroy();
            click(SEL); // navigation réelle vers /atelier
          },
        });
        driverRef.current = d;
        d.drive();
      });
    };

    /** Étapes de l'atelier : interactif (ouvre réellement les panneaux). */
    const startAtelier = () => {
      waitFor('[data-tour="studio-section0"]', 8000).then((ok) => {
        if (!ok) {
          window.localStorage.setItem(KEY, "done");
          return;
        }
        const d = driver({
          allowClose: true,
          showProgress: true,
          stagePadding: 6,
          stageRadius: 14,
          popoverClass: "akyra-tour",
          nextBtnText: "Suivant",
          prevBtnText: "Retour",
          doneBtnText: "C'est parti !",
          progressText: "{{current}} / {{total}}",
          steps: [
            {
              element: '[data-tour="studio-section0"]',
              popover: {
                title: "Votre site, section par section",
                description:
                  "Cliquez une section : une barre apparaît en haut. « Contenu » modifie textes & photos ; le bouton ⠿ à gauche (ou les flèches ↑↓) déplace la section pour ranger votre page comme vous voulez.",
              },
            },
            {
              element: '[data-tour="studio-palette"]',
              popover: {
                title: "La charte graphique",
                description:
                  "Couleurs et polices de tout le site. Cliquez « Suivant » : j'ouvre le panneau pour vous.",
              },
            },
            {
              element: '[data-tour="studio-right"]',
              popover: {
                title: "Presets ou sur-mesure",
                description:
                  "Choisissez une ambiance prête à l'emploi, ou personnalisez chaque couleur et police à votre goût. Cliquez « Suivant » pour continuer.",
              },
            },
            {
              element: '[data-tour="studio-publish"]',
              popover: {
                title: "Publiez quand vous voulez",
                description:
                  "Satisfait ? Un clic et votre site est en ligne — modifiable autant que vous voulez ensuite.",
              },
            },
            {
              element: '[data-tour="studio-add"]',
              popover: {
                title: "Ajouter des sections",
                description:
                  "Galerie, avis, tarifs, contact… Cliquez « Suivant » : j'ouvre le menu d'ajout.",
              },
            },
            {
              element: '[data-tour="studio-add-panel"]',
              popover: {
                title: "Tout type de section",
                description:
                  "Ajoutez le bloc que vous voulez. Certaines sections premium se débloquent avec vos crédits — ceux gagnés à la roue 🎡.",
              },
            },
          ],
          onHighlightStarted: (_el, _step, opts) => {
            if ((opts?.state?.activeIndex ?? 0) === 0) click('[data-tour="studio-section0"]');
          },
          onNextClick: (_el, _step, opts) => {
            const i = opts?.state?.activeIndex ?? 0;
            const advance = () => window.setTimeout(() => d.moveNext(), 220);
            if (i === 1) {
              click('[data-tour="studio-palette"]'); // ouvre Couleurs
              advance();
            } else if (i === 2) {
              click('[data-tour="studio-palette"]'); // referme Couleurs
              advance();
            } else if (i === 4) {
              click('[data-tour="studio-add"]'); // ouvre Ajouter
              advance();
            } else {
              d.moveNext();
            }
          },
          onDestroyed: () => {
            window.localStorage.setItem(KEY, "done");
          },
        });
        driverRef.current = d;
        d.drive();
      });
    };

    const run = () => {
      if (startedRef.current) return;
      if (typeof window === "undefined") return;
      const state = window.localStorage.getItem(KEY);
      if (state === "done") return;
      const onDashboard = pathname?.startsWith("/dashboard");
      const onAtelier = pathname?.startsWith("/atelier");
      if (onDashboard && state === "pending") {
        startedRef.current = true;
        startDashboard();
      } else if (onAtelier && state === "atelier") {
        startedRef.current = true;
        startAtelier();
      }
    };

    run();
    // La roue émet cet événement à la récupération des crédits → démarre le tour
    // sans dépendre du timing de re-render serveur.
    window.addEventListener(TOUR_KICK_EVENT, run);
    return () => {
      window.removeEventListener(TOUR_KICK_EVENT, run);
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [pathname]);

  return null;
}
