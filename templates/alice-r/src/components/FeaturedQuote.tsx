import { ArrowUpRight } from 'lucide-react'
import FadeIn from './FadeIn'

interface FeaturedQuoteData {
  text: string
  name: string
  role: string
  avatar: string
  images: string[]
}

export default function FeaturedQuote({ data: featuredQuote }: { data?: FeaturedQuoteData }) {
  if (!featuredQuote || !featuredQuote.text) return null
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
      <div className="grid items-center gap-12 md:grid-cols-2">
        {/* Citation */}
        <div className="flex flex-col">
          <FadeIn
            as="blockquote"
            className="text-2xl font-medium leading-[1.3] text-white sm:text-3xl md:text-4xl"
          >
            “<span data-sg-path="featuredQuote.text" data-sg-edit="panel">{featuredQuote.text}</span>”
          </FadeIn>

          <FadeIn delay={0.1} className="mt-8 flex items-center gap-3">
            <img
              src={featuredQuote.avatar}
              alt={featuredQuote.name}
              data-sg-img="featuredQuote.avatar"
              className="h-11 w-11 rounded-full object-cover ring-1 ring-white/15"
            />
            <div>
              <p data-sg-path="featuredQuote.name" className="text-sm font-medium text-white">{featuredQuote.name}</p>
              <p data-sg-path="featuredQuote.role" className="text-sm text-white/55">{featuredQuote.role}</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <a
              href="#contact"
              className="mt-10 inline-flex min-h-[48px] items-center gap-2 rounded-full border border-white/40 px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Réserver une séance
              <ArrowUpRight size={16} />
            </a>
          </FadeIn>
        </div>

        {/* 2 images */}
        <div className="flex items-end gap-4">
          <FadeIn delay={0.1} className="w-1/2">
            <img
              src={featuredQuote.images[0]}
              alt=""
              loading="lazy"
              data-sg-img="featuredQuote.images[0]"
              className="aspect-square w-full rounded-3xl object-cover ring-1 ring-white/10"
            />
          </FadeIn>
          <FadeIn delay={0.2} className="w-1/2">
            <img
              src={featuredQuote.images[1]}
              alt=""
              loading="lazy"
              data-sg-img="featuredQuote.images[1]"
              className="aspect-[3/4] w-full rounded-3xl object-cover ring-1 ring-white/10"
            />
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
