import FadeIn from './FadeIn'
import { collaborations } from '../data/content'

export default function Collaborations() {
  if (!collaborations || collaborations.length === 0) return null
  const row = [...collaborations, ...collaborations]
  return (
    <section className="border-y border-tg-line py-14">
      <FadeIn as="p" className="mb-8 px-5 text-center text-sm uppercase tracking-widest text-tg-mut md:px-10">
        Notable Collaborations
      </FadeIn>
      <div
        className="overflow-hidden"
        style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}
      >
        <div className="tg-marquee flex w-max items-center gap-16">
          {row.map((c, i) => (
            <span key={i} className="tg-head text-3xl font-bold tracking-tight text-tg-ink/25 md:text-5xl">
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
