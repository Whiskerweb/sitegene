import { collaborations } from '../data/content'

export default function Marquee() {
  const row = [...collaborations, ...collaborations]
  return (
    <section className="relative z-10 border-y border-white/12 py-12">
      <p className="mb-8 text-center text-xs font-medium uppercase tracking-[0.3em] text-white/40">
        Featured & trusted by
      </p>
      <div
        className="overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        }}
      >
        <div className="alice-marquee flex w-max items-center gap-14 md:gap-20">
          {row.map((c, i) => (
            <span
              key={i}
              className="text-2xl font-medium tracking-wide text-white/35 md:text-4xl"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
