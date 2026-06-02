import { AkyraMark } from "@/components/ui/Logo";

const socials = ["Instagram", "Behance", "Pinterest", "X"];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-black/[0.08] bg-surface-2 px-6 pt-20">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-5 md:grid-cols-2">
          {/* Carte gauche — accent de marque */}
          <div className="relative overflow-hidden rounded-[28px] border border-black/[0.06] bg-white p-8 shadow-cloud-sm md:p-10">
            <div aria-hidden className="absolute -right-10 -top-10 h-48 w-48 bg-brand/10 blur-[60px]" />
            <div className="relative flex items-center gap-2 text-night">
              <AkyraMark size={32} className="text-brand" />
              <span className="font-display text-xl font-semibold tracking-tight">Akyra</span>
            </div>
            <p className="relative mt-5 max-w-[32ch] font-display text-[22px] leading-[1.3] text-night">
              Votre prochain client vous cherche ce soir.{" "}
              <span className="em text-brand">Soyez en ligne.</span>
            </p>
            <p className="relative mt-6 font-hand text-[22px] text-brand">Restez en contact !</p>
            <div className="relative mt-3 flex gap-2">
              {socials.map((s) => (
                <span
                  key={s}
                  className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-black/[0.08] bg-surface-2 text-[12px] font-semibold text-slate transition-transform hover:-translate-y-1 hover:bg-white hover:text-night"
                >
                  {s[0]}
                </span>
              ))}
            </div>
          </div>

          {/* Carte droite — claire */}
          <div className="rounded-[28px] border border-black/[0.06] bg-white p-8 shadow-cloud-sm md:p-10">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="font-hand text-[20px] italic text-brand">Navigation</p>
                <ul className="mt-3 space-y-2.5 text-[15px] text-slate">
                  <li><a href="#demo" className="transition hover:text-night">Créer</a></li>
                  <li><a href="#templates" className="transition hover:text-night">Modèles</a></li>
                  <li><a href="#faq" className="transition hover:text-night">FAQ</a></li>
                </ul>
              </div>
              <div>
                <p className="font-hand text-[20px] italic text-brand">Légal</p>
                <ul className="mt-3 space-y-2.5 text-[15px] text-slate">
                  <li><a href="#" className="transition hover:text-night">Mentions légales</a></li>
                  <li><a href="#" className="transition hover:text-night">Confidentialité</a></li>
                  <li><a href="#" className="transition hover:text-night">CGV</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-black/[0.08] pt-6">
              <p className="text-[15px] text-night">Prêt à mettre votre site en ligne ?</p>
              <a
                href="#demo"
                className="btn-violet mt-3 inline-block rounded-full px-6 py-3 text-[14px] font-bold text-white transition-transform hover:scale-[1.03]"
              >
                Commencer · 50 €/an
              </a>
            </div>
          </div>
        </div>

        <p className="py-8 text-center text-[13px] text-mist">
          © 2026 Akyra. Votre site, déjà construit.
        </p>
      </div>

      {/* Watermark géant */}
      <div
        aria-hidden
        className="pointer-events-none select-none text-center font-display font-semibold leading-[0.8] tracking-[-0.03em] text-night/[0.04]"
        style={{ fontSize: "clamp(80px, 22vw, 320px)" }}
      >
        Akyra
      </div>
    </footer>
  );
}
