import { usePage } from '../site/PageContext'
import IntroText from '../components/IntroText'
import FeaturedQuote from '../components/FeaturedQuote'
import BeyondFrame from '../components/BeyondFrame'
import Testimonials from '../components/Testimonials'

export default function AboutPage() {
  const { content } = usePage()
  return (
    <div className="pt-24 md:pt-32">
      <IntroText text={content.intro} />
      <FeaturedQuote data={content.featuredQuote} />
      <BeyondFrame data={content.beyond} />
      <Testimonials items={content.testimonials} />
    </div>
  )
}
