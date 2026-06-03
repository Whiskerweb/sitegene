import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import FadeIn from './FadeIn'

interface Stat { value: number; suffix: string; label: string }
interface Cards {
  adapt: { title: string; img: string }
  trust: { title: string; desc: string; imgs: string[] }
  gear: { title: string; accent: string; tail: string; desc: string; img: string }
  recognition: { title: string; desc: string; img: string }
  editing: { title: string; desc: string; img: string }
  portrait: { img: string }
  rating: { value: string; label: string }
}
interface BeyondData { heading: string; cards: Cards; stats: Stat[] }

/** Compteur qui s'anime de 0 → value quand il entre dans le viewport. */
function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!inView) return
    let raf = 0
    const start = performance.now()
    const dur = 1400
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(eased * value))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value])

  return (
    <div ref={ref} className="tg-head text-5xl font-bold md:text-7xl">
      {n}
      <span className="text-tg-accent">{suffix}</span>
    </div>
  )
}

export default function BeyondFrame({ data }: { data?: BeyondData }) {
  const beyond = data
  if (!beyond || !beyond.cards) return null
  const { cards, stats } = beyond
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28">
      <FadeIn as="h2" className="tg-head mb-12 max-w-xl text-4xl font-bold leading-[1.05] md:text-6xl" data-sg-path="beyond.heading">
        {beyond.heading}
      </FadeIn>

      {/* Bento : adaptation + confiance / matériel + reconnaissance + portrait / editing + 80+ */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Adapt — image plein cadre, légende en overlay */}
        <FadeIn className="relative col-span-1 min-h-[220px] overflow-hidden rounded-2xl">
          <img src={cards.adapt.img} alt="" data-sg-img="beyond.cards.adapt.img" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
          <p className="absolute bottom-0 p-5 text-sm leading-snug text-white" data-sg-path="beyond.cards.adapt.title">{cards.adapt.title}</p>
        </FadeIn>

        {/* Trust — collage de mini photos */}
        <FadeIn delay={0.05} className="col-span-1 flex flex-col rounded-2xl border border-tg-line bg-tg-card p-5 md:col-span-2">
          <div className="grid grid-cols-6 gap-1.5">
            {cards.trust.imgs.map((src, i) => (
              <img key={i} src={src} alt="" data-sg-img={`beyond.cards.trust.imgs.${i}`} className="aspect-square w-full rounded-md object-cover" />
            ))}
          </div>
          <p className="tg-head mt-5 text-xl font-semibold" data-sg-path="beyond.cards.trust.title">{cards.trust.title}</p>
          <p className="mt-1 text-sm text-tg-mut" data-sg-path="beyond.cards.trust.desc">{cards.trust.desc}</p>
        </FadeIn>

        {/* Gear — dark card */}
        <FadeIn delay={0.05} className="col-span-1 flex flex-col rounded-2xl bg-tg-dark p-6 text-white">
          <h3 className="tg-head text-2xl font-semibold leading-tight">
            <span data-sg-path="beyond.cards.gear.title">{cards.gear.title}</span> <span className="text-tg-accent">{cards.gear.accent}</span>{cards.gear.tail}
          </h3>
          <img src={cards.gear.img} alt="" data-sg-img="beyond.cards.gear.img" className="mt-5 aspect-video w-full rounded-xl object-cover" />
          <p className="mt-5 text-sm leading-relaxed text-white/65" data-sg-path="beyond.cards.gear.desc">{cards.gear.desc}</p>
        </FadeIn>

        {/* Recognition */}
        <FadeIn delay={0.1} className="relative col-span-1 min-h-[260px] overflow-hidden rounded-2xl">
          <img src={cards.recognition.img} alt="" data-sg-img="beyond.cards.recognition.img" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 p-5 text-white">
            <p className="tg-head text-lg font-semibold" data-sg-path="beyond.cards.recognition.title">{cards.recognition.title}</p>
            <p className="mt-1 text-sm text-white/80" data-sg-path="beyond.cards.recognition.desc">{cards.recognition.desc}</p>
          </div>
        </FadeIn>

        {/* Portrait */}
        <FadeIn delay={0.1} className="col-span-1 overflow-hidden rounded-2xl">
          <img src={cards.portrait.img} alt="" data-sg-img="beyond.cards.portrait.img" className="h-full min-h-[260px] w-full object-cover" />
        </FadeIn>

        {/* Editing — full width split */}
        <FadeIn delay={0.05} className="relative col-span-1 min-h-[220px] overflow-hidden rounded-2xl md:col-span-2">
          <img src={cards.editing.img} alt="" data-sg-img="beyond.cards.editing.img" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
          <div className="absolute inset-0 flex max-w-md flex-col justify-end p-6 text-white">
            <p className="tg-head text-xl font-semibold" data-sg-path="beyond.cards.editing.title">{cards.editing.title}</p>
            <p className="mt-1 text-sm text-white/85" data-sg-path="beyond.cards.editing.desc">{cards.editing.desc}</p>
          </div>
        </FadeIn>

        {/* Rating stat */}
        <FadeIn delay={0.1} className="col-span-1 flex flex-col items-center justify-center rounded-2xl border border-tg-line bg-tg-card p-6 text-center">
          <p className="tg-head text-5xl font-bold" data-sg-path="beyond.cards.rating.value">{cards.rating.value}</p>
          <div className="my-2 flex gap-0.5 text-tg-accent">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i}>★</span>
            ))}
          </div>
          <p className="text-sm text-tg-mut" data-sg-path="beyond.cards.rating.label">{cards.rating.label}</p>
        </FadeIn>
      </div>

      {/* Compteurs animés */}
      <div className="mt-16 grid grid-cols-3 gap-6 border-t border-tg-line pt-12">
        {stats.map((s, i) => (
          <div key={s.label} className="text-center md:text-left">
            <Counter value={s.value} suffix={s.suffix} />
            <p className="mt-2 text-xs text-tg-mut md:text-sm" data-sg-path={`beyond.stats[${i}].label`}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
