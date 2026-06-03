import { usePage } from '../site/PageContext'
import Hero from '../components/Hero'
import FeaturedQuote from '../components/FeaturedQuote'
import IntroText from '../components/IntroText'
import Services from '../components/Services'
import Collaborations from '../components/Collaborations'
import Works from '../components/Works'
import BeyondFrame from '../components/BeyondFrame'
import Testimonials from '../components/Testimonials'
import FAQs from '../components/FAQs'
import Gallery from '../components/Gallery'

export default function HomePage() {
  const { content } = usePage()
  return (
    <>
      <Hero data={content.hero} />
      <FeaturedQuote data={content.featuredQuote} />
      <IntroText text={content.intro} />
      <Services intro={content.servicesIntro} items={content.services} />
      <Collaborations items={content.collaborations} labels={content.collabLabels} />
      <Works items={content.works} />
      <BeyondFrame data={content.beyond} />
      <Testimonials items={content.testimonials} />
      <Gallery items={content.gallery} />
      <FAQs items={content.faqs} />
    </>
  )
}
