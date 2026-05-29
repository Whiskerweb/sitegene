import Hero from './components/Hero'
import FeaturedQuote from './components/FeaturedQuote'
import ScrollText from './components/ScrollText'
import Services from './components/Services'
import Marquee from './components/Marquee'
import Works from './components/Works'
import Stats from './components/Stats'
import Testimonials from './components/Testimonials'
import FAQ from './components/FAQ'
import Gallery from './components/Gallery'
import Footer from './components/Footer'

export default function App() {
  return (
    <main className="grain relative w-full">
      <Hero />
      <FeaturedQuote />
      <ScrollText />
      <Services />
      <Marquee />
      <Works />
      <Stats />
      <Testimonials />
      <FAQ />
      <Gallery />
      <Footer />
    </main>
  )
}
