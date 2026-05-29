import { collaborations } from '../data/content'

function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" fill="#FFC400" className="h-7 w-7 shrink-0" aria-hidden>
      <path d="M12 0C12 6 6 12 0 12c6 0 12 6 12 12 0-6 6-12 12-12-6 0-12-6-12-12z" />
    </svg>
  )
}

export default function Marquee() {
  if (!collaborations || collaborations.length === 0) return null
  const row = [...collaborations, ...collaborations]
  return (
    <section className="border-y-2 border-poto-ink/10 py-12">
      <p className="mb-8 text-center text-xs font-bold uppercase tracking-[0.3em] text-poto-ink/50">
        Trusted by bold brands
      </p>
      <div
        className="overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        }}
      >
        <div className="poto-marquee flex w-max items-center gap-12 md:gap-16">
          {row.map((c, i) => (
            <span key={i} className="flex items-center gap-12 md:gap-16">
              <span
                className="text-3xl font-extrabold tracking-tight md:text-5xl"
                style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(17,17,17,0.7)' }}
              >
                {c}
              </span>
              <Sparkle />
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
