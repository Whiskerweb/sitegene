import { AkyraMark } from "@/components/ui/Logo";

const socials = ["Instagram", "Behance", "Pinterest", "X"];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--line)] bg-ink-900 px-6 pt-20">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-5 md:grid-cols-2">
          {/* Carte gauche — verre liquide sombre */}
          <div className="relative overflow-hidden rounded-[28px] border border-[var(--line)] bg-ink-800 p-8 text-paper md:p-10">
            <div aria-hidden className="absolute -right-10 -top-10 h-48 w-48 bg-violet-500/10 blur-[60px]" />
            <div className="relative flex items-center gap-2">
              <AkyraMark size={32} className="text-violet-400" />
              <span className="font-display text-xl font-bold tracking-tight">Akyra</span>
            </div>
            <p className="relative mt-5 max-w-[32ch] font-display text-[22px] leading-[1.3] text-paper">
              Votre prochain client cherche un photographe ce soir.{" "}
              <span className="em text-gold-400">Soyez en ligne.</span>
            </p>
            <p className="relative mt-6 font-hand text-[22px] text-gold-400">Restez en contact !</p>
            <div className="relative mt-3 flex gap-2">
              {socials.map((s) => (
                <span
                  key={s}
                  className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl bg-ink-700 text-[12px] font-semibold text-muted border border-[var(--line)] transition-transform hover:-translate-y-1 hover:bg-ink-600 hover:text-white"
                >
                  {s[0]}
                </span>
              ))}
            </div>
          </div>

          {/* Carte droite — sombre */}
          <div className="rounded-[28px] border border-[var(--line)] bg-ink-800 p-8 shadow-2xl md:p-10">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="font-hand text-[20px] italic text-violet-400">Navigation</p>
                <ul className="mt-3 space-y-2.5 text-[15px] text-muted">
                  <li><a href="#demo" className="hover:text-white transition">Démo</a></li>
                  <li><a href="#templates" className="hover:text-white transition">Modèles</a></li>
                  <li><a href="#tarif" className="hover:text-white transition">Tarif</a></li>
                  <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
                </ul>
              </div>
              <div>
                <p className="font-hand text-[20px] italic text-violet-400">Légal</p>
                <ul className="mt-3 space-y-2.5 text-[15px] text-muted">
                  <li><a href="#" className="hover:text-white transition">Mentions légales</a></li>
                  <li><a href="#" className="hover:text-white transition">Confidentialité</a></li>
                  <li><a href="#" className="hover:text-white transition">CGV</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-[var(--line)] pt-6">
              <p className="text-[15px] text-paper">Prêt à mettre votre site en ligne ?</p>
              <a
                href="#demo"
                className="btn-violet mt-3 inline-block rounded-full px-6 py-3 text-[14px] font-bold text-white transition-transform hover:scale-[1.03]"
              >
                Commencer · 50 €/an
              </a>
            </div>
          </div>
        </div>

        <p className="py-8 text-center text-[13px] text-faint">
          © 2026 Akyra. Votre site, déjà construit.
        </p>
      </div>

      {/* Watermark géant */}
      <div
        aria-hidden
        className="pointer-events-none select-none text-center font-display font-bold leading-[0.8] tracking-[-0.03em] text-white/[0.015]"
        style={{ fontSize: "clamp(80px, 22vw, 320px)" }}
      >
        Akyra
      </div>
    </footer>
  );
}
