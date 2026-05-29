import { Aperture } from 'lucide-react'
import FadeIn from './FadeIn'
import { featuredQuote } from '../data/content'

export default function FeaturedQuote() {
  if (!featuredQuote || !featuredQuote.text) return null
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28">
      <div className="grid items-center gap-12 md:grid-cols-2">
        {/* Citation */}
        <div className="flex flex-col">
          <FadeIn as="blockquote" className="tg-head text-3xl font-medium leading-[1.15] md:text-5xl">
            “{featuredQuote.text}”
          </FadeIn>
          <FadeIn delay={0.1} className="mt-8 flex items-center gap-3">
            <img src={featuredQuote.avatar} alt={featuredQuote.name} className="h-10 w-10 rounded-lg object-cover" />
            <div>
              <p className="text-sm font-semibold">{featuredQuote.name}</p>
              <p className="text-sm text-tg-mut">{featuredQuote.role}</p>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <button className="mt-12 inline-flex items-center gap-2 rounded-full bg-tg-ink px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.04]">
              <Aperture size={16} /> Capture Your Story
            </button>
          </FadeIn>
        </div>

        {/* 2 images */}
        <div className="flex items-end gap-4">
          <FadeIn delay={0.1} className="w-1/2">
            <img src={featuredQuote.images[0]} alt="" className="aspect-square w-full rounded-2xl object-cover" />
          </FadeIn>
          <FadeIn delay={0.2} className="w-1/2">
            <img src={featuredQuote.images[1]} alt="" className="aspect-[3/4] w-full rounded-2xl object-cover" />
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
