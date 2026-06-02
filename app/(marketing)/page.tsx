import Hero from "@/components/marketing/Hero";
import Gallery from "@/components/marketing/Gallery";

export default function Home() {
  return (
    <>
      <Hero />
      <div className="pb-24">
        <Gallery />
      </div>
    </>
  );
}
