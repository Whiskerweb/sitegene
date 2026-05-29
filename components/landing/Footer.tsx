const socials = ["Instagram", "Behance", "Pinterest", "X"];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-ink-800 px-6 pt-20">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Carte gauche */}
          <div className="relative overflow-hidden rounded-[24px] border border-line bg-ink-700 p-8 md:p-10">
            <div className="glow-violet pointer-events-none absolute -right-10 -top-10 h-48 w-48" />
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full btn-violet text-sm font-bold text-white">
                S
              </span>
              <span className="font-display text-xl font-semibold tracking-tight">
                Sitegene
              </span>
            </div>
            <p className="mt-5 max-w-[32ch] text-[15px] leading-[1.6] text-muted">
              Votre prochain client cherche un photographe ce soir.{" "}
              <span className="text-paper">Soyez en ligne.</span>
            </p>
            <p className="mt-6 font-hand text-[22px] text-gold-400">
              Restez en contact !
            </p>
            <div className="mt-3 flex gap-2">
              {socials.map((s) => (
                <span
                  key={s}
                  className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl bg-ink-900 text-[12px] text-muted transition-transform hover:-translate-y-1 hover:text-paper"
                >
                  {s[0]}
                </span>
              ))}
            </div>
          </div>

          {/* Carte droite */}
          <div className="rounded-[24px] border border-line bg-ink-700 p-8 md:p-10">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-faint">
                  Navigation
                </p>
                <ul className="mt-4 space-y-2.5 text-[15px] text-muted">
                  <li>
                    <a href="#templates" className="hover:text-paper">
                      Templates
                    </a>
                  </li>
                  <li>
                    <a href="#tarif" className="hover:text-paper">
                      Tarif
                    </a>
                  </li>
                  <li>
                    <a href="#faq" className="hover:text-paper">
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-faint">
                  Légal
                </p>
                <ul className="mt-4 space-y-2.5 text-[15px] text-muted">
                  <li>
                    <a href="#" className="hover:text-paper">
                      Mentions légales
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-paper">
                      Confidentialité
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-paper">
                      CGV
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-line pt-6">
              <p className="text-[15px] text-paper">Mettre mon site en ligne</p>
              <a
                href="#top"
                className="btn-violet mt-3 inline-block rounded-full px-6 py-3 text-[14px] font-semibold text-white transition-transform hover:scale-[1.03]"
              >
                Commencer — 50 €
              </a>
            </div>
          </div>
        </div>

        <p className="py-8 text-center text-[13px] text-faint">
          © 2026 Sitegene. Votre site, déjà construit.
        </p>
      </div>

      {/* Watermark géant */}
      <div
        aria-hidden
        className="pointer-events-none select-none text-center font-display font-semibold leading-[0.8] tracking-[-0.04em] text-white/[0.04]"
        style={{ fontSize: "clamp(80px, 22vw, 320px)" }}
      >
        Sitegene
      </div>
    </footer>
  );
}
