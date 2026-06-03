import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { REALISATIONS } from "@/lib/showcase";
import TemplateCard from "./TemplateCard";

const SECTIONS: { title: string; cta: { label: string; href: string }; ids: string[] }[] = [
  {
    title: "À la une",
    cta: { label: "Tous les modèles", href: "/modeles" },
    ids: ["luxury-wedding", "jazz-vocalist", "health-saas"],
  },
  {
    title: "Photographes",
    cta: { label: "Voir les photographes", href: "/modeles" },
    ids: ["alice-r", "potozon", "target", "luxury-wedding", "wedding-fine-art"],
  },
  {
    title: "Musiciens",
    cta: { label: "Voir les musiciens", href: "/modeles" },
    ids: [
      "jazz-vocalist",
      "dj-electro",
      "music-festival",
      "hiphop-producer",
      "electronic-collective",
      "indie-band",
      "podcast-audio",
    ],
  },
  {
    title: "Artisans & services",
    cta: { label: "Voir les artisans", href: "/modeles" },
    ids: ["cleaning-services", "eco-garden-care", "arelec", "eloctix"],
  },
  {
    title: "Portfolio & SaaS",
    cta: { label: "Tous les modèles", href: "/modeles" },
    ids: ["creative-portfolio", "health-saas"],
  },
];

export default function Gallery() {
  return (
    <div id="templates" className="relative">
      {/* Hairline horizontale au-dessus de la galerie (quadrillage) */}
      <div aria-hidden className="akyra-hline" />
      <div className="mx-auto w-full max-w-6xl px-4">
        {SECTIONS.map((section) => {
          const cards = section.ids
            .map((id) => REALISATIONS.find((r) => r.id === id))
            .filter(Boolean);
          return (
            <section key={section.title} className="pb-4 pt-14">
              <div className="mb-8 flex items-center justify-between px-1">
                <h2 className="text-[16px] font-medium tracking-tight text-[rgb(var(--m-ink))]">
                  {section.title}
                </h2>
                <Link
                  href={section.cta.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--m-line))] px-3.5 py-1.5 text-[12px] font-medium text-[rgb(var(--m-muted))] transition-all hover:bg-[rgb(var(--m-overlay)/0.04)] hover:text-[rgb(var(--m-ink))]"
                >
                  {section.cta.label} <ArrowRight size={13} />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cards.map((r) => (
                  <TemplateCard key={r!.id} r={r!} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
