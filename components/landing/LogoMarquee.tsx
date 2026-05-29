const reviews = [
  {
    quote: "J'ai enfin un site qui ressemble à mon travail. Mes clients me prennent au sérieux.",
    name: "Camille D.",
    role: "Photographe mariage",
  },
  {
    quote: "Mis en ligne en deux minutes, sans rien comprendre à la technique. Bluffant.",
    name: "Yanis B.",
    role: "Portraitiste",
  },
  {
    quote: "Plus besoin de renvoyer mon Insta. J'envoie mon site, ça change tout.",
    name: "Léa M.",
    role: "Photographe lifestyle",
  },
];

export default function LogoMarquee() {
  return (
    <section className="border-y border-line bg-paper-2 px-6 py-16">
      <div className="mx-auto max-w-[1200px]">
        <p className="mb-8 text-center text-sm text-ink-soft">
          Des photographes déjà en ligne, et ravis.
        </p>
        <div className="grid gap-5 md:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.name} className="card-print rounded-[20px] border border-line p-6">
              <div className="mb-3 text-terracotta" aria-hidden>
                ★★★★★
              </div>
              <blockquote className="text-[15px] leading-[1.6] text-ink">
                « {r.quote} »
              </blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-medium text-ink">{r.name}</span>
                <span className="text-ink-faint"> · {r.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
