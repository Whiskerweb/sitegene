/** Gabarit de page légale — tokens marketing scopés. Contenu placeholder. */
export default function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-[760px] px-4 py-16 sm:px-6">
      <h1 className="text-[32px] font-semibold tracking-[-0.02em] text-[rgb(var(--m-ink))] md:text-[42px]">
        {title}
      </h1>
      <div className="mt-8 space-y-4 text-[15px] leading-[1.7] text-[rgb(var(--m-muted))] [&_h2]:mt-8 [&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:text-[rgb(var(--m-ink))]">
        {children}
      </div>
      <p className="mt-12 rounded-xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-elevated))] px-5 py-4 text-[13px] text-[rgb(var(--m-faint))]">
        Contenu à finaliser — texte juridique provisoire. Akyra · akyra.io.
      </p>
    </section>
  );
}
