import Navbar from "@/components/landing/Navbar";
import ScrollHero from "@/components/landing/ScrollHero";
import Showcase from "@/components/landing/Showcase";
import HowItWorks from "@/components/landing/HowItWorks";
import Categories from "@/components/landing/Categories";
import LogoMarquee from "@/components/landing/LogoMarquee";
import Pricing from "@/components/landing/Pricing";
import Faq from "@/components/landing/Faq";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <div id="demo">
          <ScrollHero />
        </div>
        <Showcase />
        <HowItWorks />
        <Categories />
        <LogoMarquee />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
