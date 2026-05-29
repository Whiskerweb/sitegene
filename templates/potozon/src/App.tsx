import Navbar from './components/Navbar'
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
    <main className="min-h-screen w-full bg-[#fcfcfc]">
      <div className="mx-auto max-w-[1500px] px-5 py-5 sm:px-8 md:px-12 md:py-7">
        <Navbar />
        <Hero />
        <Gallery />
        <FeaturedQuote />
        <ScrollText />
        <Services />
        <Marquee />
        <Works />
        <Stats />
        <Testimonials />
        <FAQ />
        <Footer />
      </div>
    </main>
  )
}
