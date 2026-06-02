import Navbar from "@/components/landing/Navbar";
import ScrollHero from "@/components/landing/ScrollHero";
import Showcase from "@/components/landing/Showcase";
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
        <Faq />
      </main>
      <Footer />
    </>
  );
}
