import Hero from './components/Hero'
import FeaturedQuote from './components/FeaturedQuote'
import IntroText from './components/IntroText'
import Services from './components/Services'
import Collaborations from './components/Collaborations'
import Works from './components/Works'
import BeyondFrame from './components/BeyondFrame'
import Testimonials from './components/Testimonials'
import FAQs from './components/FAQs'
import Gallery from './components/Gallery'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen w-full bg-tg-bg text-tg-ink">
      <Hero />
      <FeaturedQuote />
      <IntroText />
      <Services />
      <Collaborations />
      <Works />
      <BeyondFrame />
      <Testimonials />
      <FAQs />
      <Gallery />
      <Footer />
    </div>
  )
}
