const socials = ["Instagram", "Behance", "Pinterest", "X"];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-paper-2 px-6 pt-20">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-5 md:grid-cols-2">
          {/* Carte gauche — bleu encre */}
          <div className="relative overflow-hidden rounded-[28px] bg-blueink p-8 text-paper md:p-10">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-terracotta text-sm font-bold text-paper">S</span>
              <span className="font-display text-xl font-medium tracking-tight">Sitegene</span>
            </div>
            <p className="mt-5 max-w-[32ch] font-display text-[22px] leading-[1.3] text-paper/90">
              Votre prochain client cherche un photographe ce soir.{" "}
              <span className="em text-paper">Soyez en ligne.</span>
            </p>
            <p className="mt-6 font-hand text-[22px] text-paper/70">Restez en contact !</p>
            <div className="mt-3 flex gap-2">
              {socials.map((s) => (
                <span
                  key={s}
                  className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl bg-white/10 text-[12px] text-paper/90 transition-transform hover:-translate-y-1 hover:bg-white/15"
                >
                  {s[0]}
                </span>
              ))}
            </div>
          </div>

          {/* Carte droite — papier */}
          <div className="rounded-[28px] border border-line bg-card p-8 md:p-10">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="font-hand text-[20px] italic text-terracotta">Navigation</p>
                <ul className="mt-3 space-y-2.5 text-[15px] text-ink-soft">
                  <li><a href="#templates" className="hover:text-ink">Modèles</a></li>
                  <li><a href="#how" className="hover:text-ink">Comment ça marche</a></li>
                  <li><a href="#tarif" className="hover:text-ink">Tarif</a></li>
                  <li><a href="#faq" className="hover:text-ink">FAQ</a></li>
                </ul>
              </div>
              <div>
                <p className="font-hand text-[20px] italic text-terracotta">Légal</p>
                <ul className="mt-3 space-y-2.5 text-[15px] text-ink-soft">
                  <li><a href="#" className="hover:text-ink">Mentions légales</a></li>
                  <li><a href="#" className="hover:text-ink">Confidentialité</a></li>
                  <li><a href="#" className="hover:text-ink">CGV</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-line pt-6">
              <p className="text-[15px] text-ink">Prêt à mettre votre site en ligne ?</p>
              <a
                href="#templates"
                className="btn-terra mt-3 inline-block rounded-full px-6 py-3 text-[14px] font-semibold text-paper transition-transform hover:scale-[1.03]"
              >
                Commencer — 50 €
              </a>
            </div>
          </div>
        </div>

        <p className="py-8 text-center text-[13px] text-ink-faint">
          © 2026 Sitegene. Votre site, déjà construit.
        </p>
      </div>

      {/* Watermark géant */}
      <div
        aria-hidden
        className="pointer-events-none select-none text-center font-display font-semibold leading-[0.8] tracking-[-0.03em] text-ink/[0.05]"
        style={{ fontSize: "clamp(80px, 22vw, 320px)" }}
      >
        Sitegene
      </div>
    </footer>
  );
}
