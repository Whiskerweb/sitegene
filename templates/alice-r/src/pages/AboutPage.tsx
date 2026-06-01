import { usePage } from '../site/PageContext'
import ScrollText from '../components/ScrollText'
import FeaturedQuote from '../components/FeaturedQuote'
import Stats from '../components/Stats'
import Testimonials from '../components/Testimonials'

export default function AboutPage() {
  const { content } = usePage()
  return (
    <div className="relative z-10 pt-28 md:pt-36">
      <ScrollText text={content.scrollText} />
      <FeaturedQuote data={content.featuredQuote} />
      <Stats data={content.beyond} />
      <Testimonials items={content.testimonials} />
    </div>
  )
}
