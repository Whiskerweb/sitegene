import { ArrowUpRight } from 'lucide-react'
import FadeIn from './FadeIn'
import { featuredQuote } from '../data/content'

export default function FeaturedQuote() {
  return (
    <section className="mx-auto max-w-6xl py-20 md:py-28">
      <div className="grid items-center gap-12 md:grid-cols-2">
        {/* Citation */}
        <div className="flex flex-col">
          <FadeIn
            as="blockquote"
            className="text-3xl font-extrabold leading-[1.08] tracking-tight text-poto-ink md:text-[2.7rem]"
          >
            “{featuredQuote.text}”
          </FadeIn>

          <FadeIn delay={0.1} className="mt-8 flex items-center gap-3">
            <span
              className="h-12 w-12 shrink-0 overflow-hidden rounded-xl"
              style={{ backgroundColor: '#A99BE8' }}
            >
              <img
                src={featuredQuote.avatar}
                alt={featuredQuote.name}
                className="h-full w-full object-cover mix-blend-luminosity"
              />
            </span>
            <div>
              <p className="text-base font-bold text-poto-ink">{featuredQuote.name}</p>
              <p className="text-sm font-medium text-poto-ink/60">{featuredQuote.role}</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <a
              href="#projects"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-poto-orange px-6 py-3.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.04]"
            >
              Capture your story
              <ArrowUpRight size={16} />
            </a>
          </FadeIn>
        </div>

        {/* 2 images teintées (DA poto) */}
        <div className="flex items-end gap-4">
          <FadeIn delay={0.1} className="w-1/2">
            <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: '#E5412A' }}>
              <img
                src={featuredQuote.images[0]}
                alt=""
                className="aspect-square w-full object-cover mix-blend-luminosity"
              />
            </div>
          </FadeIn>
          <FadeIn delay={0.2} className="w-1/2">
            <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: '#FFC400' }}>
              <img
                src={featuredQuote.images[1]}
                alt=""
                className="aspect-[3/4] w-full object-cover mix-blend-luminosity"
              />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
