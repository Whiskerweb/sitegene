import type { ComponentType } from 'react'
import { SITE } from './data/content'
import { PageProvider } from './site/PageContext'
import { useRoute } from './site/router'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import PortfolioPage from './pages/PortfolioPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import ServicePage from './pages/ServicePage'
import GenericPage from './pages/GenericPage'

const RENDERERS: Record<string, ComponentType> = {
  home: HomePage,
  portfolio: PortfolioPage,
  about: AboutPage,
  contact: ContactPage,
  service: ServicePage,
  generic: GenericPage,
}

export default function App() {
  const page = useRoute(SITE)
  const Renderer = RENDERERS[page.type] ?? HomePage
  return (
    <PageProvider value={{ site: SITE.site, page }}>
      <main className="min-h-screen w-full bg-[#fcfcfc]">
        <div className="mx-auto max-w-[1500px] px-5 py-5 sm:px-8 md:px-12 md:py-7">
          <Navbar />
          <Renderer />
          <Footer />
        </div>
      </main>
    </PageProvider>
  )
}
