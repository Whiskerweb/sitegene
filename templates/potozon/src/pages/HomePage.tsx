import { usePage } from '../site/PageContext'
import Hero from '../components/Hero'
import Gallery from '../components/Gallery'
import FeaturedQuote from '../components/FeaturedQuote'
import ScrollText from '../components/ScrollText'
import Services from '../components/Services'
import Marquee from '../components/Marquee'
import Works from '../components/Works'
import Stats from '../components/Stats'
import Testimonials from '../components/Testimonials'
import FAQ from '../components/FAQ'

export default function HomePage() {
  const { content } = usePage()
  return (
    <>
      <Hero data={content.hero} />
      <Gallery cards={content.cards} textLeft={content.textLeft} textRight={content.textRight} />
      <FeaturedQuote data={content.featuredQuote} />
      <ScrollText text={content.scrollText} accents={content.scrollAccents} />
      <Services intro={content.servicesIntro} items={content.services} />
      <Marquee items={content.collaborations} />
      <Works items={content.works} />
      <Stats data={content.beyond} />
      <Testimonials items={content.testimonials} />
      <FAQ items={content.faqs} />
    </>
  )
}
