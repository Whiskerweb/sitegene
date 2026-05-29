const brands = [
  "VOGUE",
  "LEICA",
  "CANON",
  "KINFOLK",
  "AESOP",
  "HASSELBLAD",
  "MONOCLE",
  "APERTURE",
];

export default function LogoMarquee() {
  const row = [...brands, ...brands];
  return (
    <section className="border-y border-line bg-ink-800 py-12">
      <p className="mb-8 text-center text-sm text-faint">
        La qualité de site que ces marques attendent — pour vous, en 30 secondes.
      </p>
      <div className="marquee-mask marquee-paused overflow-hidden">
        <div className="marquee-track gap-14 px-7">
          {row.map((b, i) => (
            <span
              key={i}
              className="shrink-0 font-display text-2xl font-medium tracking-tight text-faint/70"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
