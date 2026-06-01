"use client";

import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { BorderBeam } from "@/components/ui/border-beam";

/**
 * Showcase « agence » : une carte qui se redresse en 3D au scroll (ContainerScroll)
 * + faisceau lumineux (BorderBeam). Argument différenciant central : ce n'est pas
 * un thème recraché par une IA, c'est un vrai site dessiné à la main. Copy =
 * bénéfice + spécificité (skill copywriting).
 */
export default function Showcase() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div aria-hidden className="blob blob-blue absolute left-[6%] top-[22%] h-72 w-72" />
      <div aria-hidden className="blob blob-mint absolute right-[8%] top-[40%] h-64 w-64" />

      <ContainerScroll
        titleComponent={
          <div className="px-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand">
              Le modèle
            </p>
            <h2 className="font-display text-[30px] font-medium leading-[1.04] tracking-[-0.02em] text-night md:text-[48px]">
              Un vrai site d&apos;agence.{" "}
              <span className="em text-brand">À votre image.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-[54ch] text-[16px] leading-[1.6] text-slate md:text-[17px]">
              Chaque modèle est dessiné à la main par un designer, pas généré au
              hasard. On y pose vos photos et vos mots comme le ferait un studio.
              Vous obtenez le rendu d&apos;un site à 1 500 €, pour 50 €/an.
            </p>
          </div>
        }
      >
        <div className="relative h-full w-full overflow-hidden rounded-[22px]">
          <BorderBeam
            size={300}
            duration={10}
            colorFrom="#2563eb"
            colorTo="#f0b429"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing/thumb1.jpg"
            alt="Aperçu d'un site créé avec Akyra"
            className="h-full w-full object-cover"
          />
        </div>
      </ContainerScroll>
    </section>
  );
}
