import { Aperture } from 'lucide-react'
import FadeIn from './FadeIn'

export default function Collaborations({
  items = [],
  labels = [],
}: {
  items?: string[]
  labels?: string[]
}) {
  const collaborations = items
  if (!collaborations || collaborations.length === 0) return null
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-20">
      <div className="grid gap-8 md:grid-cols-3 md:items-center">
        {/* Étiquettes (réf : "5+ years experience" / "2025 Photographer of the year") */}
        {labels.length > 0 && (
          <FadeIn className="flex flex-col gap-2 text-sm text-tg-mut">
            {labels.map((l, i) => (
              <span key={l} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-tg-accent" />
                <span data-sg-path={`collabLabels.${i}`} data-sg-edit="panel">{l}</span>
              </span>
            ))}
          </FadeIn>
        )}

        {/* Grille de logos 4×2 (statique, façon plaque de partenaires) */}
        <div className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${labels.length > 0 ? 'md:col-span-2' : 'md:col-span-3'}`}>
          {collaborations.map((c, i) => (
            <FadeIn
              key={`${c}-${i}`}
              delay={(i % 4) * 0.05}
              className="flex items-center justify-center gap-2 rounded-xl border border-tg-line bg-tg-card px-4 py-5 text-tg-ink/55 transition-colors hover:text-tg-ink"
            >
              <Aperture size={16} className="shrink-0 text-tg-ink/35" />
              <span data-sg-path={`collaborations.${i}`} data-sg-edit="panel" className="tg-head text-sm font-semibold tracking-tight">{c}</span>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
