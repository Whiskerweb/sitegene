import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import LogoMarquee from "@/components/landing/LogoMarquee";
import HowItWorks from "@/components/landing/HowItWorks";
import TemplateShowcase from "@/components/landing/TemplateShowcase";
import Pricing from "@/components/landing/Pricing";
import Faq from "@/components/landing/Faq";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <LogoMarquee />
        <HowItWorks />
        <TemplateShowcase />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
