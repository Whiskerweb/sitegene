import { usePage } from '../site/PageContext'
import ScrollText from '../components/ScrollText'
import FeaturedQuote from '../components/FeaturedQuote'
import Stats from '../components/Stats'
import Testimonials from '../components/Testimonials'

export default function AboutPage() {
  const { content } = usePage()
  return (
    <div className="pt-10 md:pt-16">
      <ScrollText text={content.scrollText} accents={content.scrollAccents} />
      <FeaturedQuote data={content.featuredQuote} />
      <Stats data={content.beyond} />
      <Testimonials items={content.testimonials} />
    </div>
  )
}
