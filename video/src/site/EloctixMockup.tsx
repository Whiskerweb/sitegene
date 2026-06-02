import React from "react";
import { Img, staticFile } from "remotion";
import { blendColor } from "./siteTheme";

// ---- Thème Eloctix (data → interpolable pour la bascule S6) ----
export type EloctixTheme = {
  pageBg: string;
  text: string;
  textMut: string;
  card: string; // fond cartes claires (sky) / navy2 en sombre
  cardText: string;
  navy: string; // fond sections sombres (solutions dark, footer)
  navyText: string;
  navBg: string;
  navText: string;
  accent: string; // orange (constant)
  line: string;
};

export const ELOCTIX_LIGHT: EloctixTheme = {
  pageBg: "#ffffff",
  text: "#1b1f48",
  textMut: "#6c7080",
  card: "#eef1f6",
  cardText: "#1b1f48",
  navy: "#1b1f48",
  navyText: "#ffffff",
  navBg: "#fffffff2",
  navText: "#1b1f48",
  accent: "#f1542a",
  line: "rgba(27,31,72,0.12)",
};

// « Mode soir, plus chic » → tout passe en navy profond
export const ELOCTIX_DARK: EloctixTheme = {
  pageBg: "#13152f",
  text: "#ffffff",
  textMut: "#a6abc4",
  card: "#1b1f48",
  cardText: "#ffffff",
  navy: "#0c0e22",
  navyText: "#ffffff",
  navBg: "#13152fee",
  navText: "#ffffff",
  accent: "#f1542a",
  line: "rgba(255,255,255,0.12)",
};

export function blendEloctix(t: number): EloctixTheme {
  const c = (k: keyof EloctixTheme) =>
    blendColor(ELOCTIX_LIGHT[k], ELOCTIX_DARK[k], t);
  return {
    pageBg: c("pageBg"),
    text: c("text"),
    textMut: c("textMut"),
    card: c("card"),
    cardText: c("cardText"),
    navy: c("navy"),
    navyText: c("navyText"),
    navBg: c("navBg"),
    navText: c("navText"),
    accent: ELOCTIX_LIGHT.accent,
    line: c("line"),
  };
}

export const ELOCTIX_W = 1500;
export const ELOCTIX_H = 880;
const URLBAR_H = 58;
const VIEWPORT_H = ELOCTIX_H - URLBAR_H;
const NAV_H = 80;

const SEC = { hero: 720, stats: 320, services: 760, solutions: 430, footer: 360 };
export const ELOCTIX_CONTENT_H =
  SEC.hero + SEC.stats + SEC.services + SEC.solutions + SEC.footer;

export const ELOCTIX_SCROLL = {
  top: 0,
  services: SEC.hero + SEC.stats - 70,
  gallery: SEC.hero + SEC.stats + SEC.services - 120, // « gallery » = zone solutions
  footer: ELOCTIX_CONTENT_H - VIEWPORT_H + 120,
};

const img = (n: string) => staticFile(`eloctix/${n}.jpg`);

const Zap: React.FC<{ color: string; size?: number }> = ({ color, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M13 2 L4 14 H11 L10 22 L20 9 H13 Z" fill={color} />
  </svg>
);

export const EloctixMockup: React.FC<{
  theme: EloctixTheme;
  scrollY?: number;
  titleNode?: React.ReactNode;
}> = ({ theme, scrollY = 0, titleNode }) => {
  return (
    <div
      style={{
        width: ELOCTIX_W,
        height: ELOCTIX_H,
        borderRadius: 22,
        overflow: "hidden",
        background: theme.pageBg,
        boxShadow: "0 50px 120px rgba(20,24,60,0.34)",
        border: "1px solid rgba(255,255,255,0.5)",
      }}
    >
      {/* Barre navigateur */}
      <div
        style={{
          height: URLBAR_H,
          background: "#e7eaf1",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 14,
          borderBottom: "1px solid #d6dbe6",
        }}
      >
        <Dot c="#ff5f57" />
        <Dot c="#febc2e" />
        <Dot c="#28c840" />
        <div
          style={{
            marginLeft: 16,
            flex: 1,
            maxWidth: 520,
            height: 32,
            borderRadius: 999,
            background: "#fff",
            border: "1px solid #d6dbe6",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            color: "#7a8194",
            fontFamily: "var(--ff-inter), sans-serif",
            fontSize: 15,
          }}
        >
          <span style={{ color: "#28a745", marginRight: 8, fontSize: 13 }}>🔒</span>
          eloctix.fr
        </div>
      </div>

      {/* Viewport */}
      <div style={{ position: "relative", height: VIEWPORT_H, overflow: "hidden", background: theme.pageBg }}>
        <div style={{ position: "absolute", top: -scrollY, left: 0, width: ELOCTIX_W }}>
          <Hero theme={theme} titleNode={titleNode} />
          <Stats theme={theme} />
          <Services theme={theme} />
          <Solutions theme={theme} />
          <Footer theme={theme} />
        </div>
        <Navbar theme={theme} />
      </div>
    </div>
  );
};

const Dot: React.FC<{ c: string }> = ({ c }) => (
  <div style={{ width: 13, height: 13, borderRadius: "50%", background: c }} />
);

const OrangeBtn: React.FC<{ theme: EloctixTheme; label: string; big?: boolean }> = ({
  theme,
  label,
  big,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: big ? "16px 30px" : "12px 22px",
      borderRadius: big ? 14 : 12,
      background: theme.accent,
      color: "#fff",
      fontFamily: "var(--ff-jakarta), sans-serif",
      fontWeight: 700,
      fontSize: big ? 18 : 15,
      boxShadow: "0 12px 28px rgba(241,84,42,0.35)",
    }}
  >
    {label}
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M7 17 L17 7 M9 7 H17 V15" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const Navbar: React.FC<{ theme: EloctixTheme }> = ({ theme }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: ELOCTIX_W,
      height: NAV_H,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 50px",
      background: theme.navBg,
      backdropFilter: "blur(8px)",
      borderBottom: `1px solid ${theme.line}`,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: theme.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Zap color="#fff" size={18} />
      </div>
      <span
        style={{
          fontFamily: "var(--ff-jakarta), sans-serif",
          fontWeight: 800,
          fontSize: 20,
          textTransform: "uppercase",
          letterSpacing: "0.02em",
          color: theme.navText,
        }}
      >
        Eloctix
      </span>
    </div>
    <div
      style={{
        display: "flex",
        gap: 34,
        fontFamily: "var(--ff-inter), sans-serif",
        fontWeight: 600,
        fontSize: 13,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: theme.navText,
        opacity: 0.82,
      }}
    >
      <span>Accueil</span>
      <span>À propos</span>
      <span>Essentiels</span>
      <span>Blog</span>
    </div>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "11px 20px",
        borderRadius: 12,
        background: theme.navy,
        color: theme.navyText,
        fontFamily: "var(--ff-jakarta), sans-serif",
        fontWeight: 700,
        fontSize: 14,
      }}
    >
      Nous contacter
    </div>
  </div>
);

const Hero: React.FC<{ theme: EloctixTheme; titleNode?: React.ReactNode }> = ({
  theme,
  titleNode,
}) => (
  <div style={{ height: SEC.hero, padding: "150px 50px 0", display: "flex", gap: 40, position: "relative", overflow: "hidden" }}>
    <div style={{ flex: 1.15 }}>
      <h1
        style={{
          fontFamily: "var(--ff-jakarta), sans-serif",
          fontWeight: 800,
          fontSize: 92,
          lineHeight: 0.9,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
          color: theme.text,
          margin: 0,
          maxWidth: 640,
        }}
      >
        {titleNode ?? "Alimenter votre éclairage"}
      </h1>
      <p
        style={{
          fontFamily: "var(--ff-inter), sans-serif",
          fontSize: 17,
          lineHeight: 1.6,
          color: theme.textMut,
          maxWidth: 470,
          marginTop: 26,
        }}
      >
        Des solutions électriques fiables, abordables et sûres pour les maisons,
        les bureaux et les espaces commerciaux — par des professionnels certifiés.
      </p>
      <div style={{ marginTop: 30 }}>
        <OrangeBtn theme={theme} label="Commencer maintenant" big />
      </div>
    </div>
    <div style={{ flex: 0.85, position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: -10,
          right: 0,
          width: 400,
          height: 480,
          borderRadius: 26,
          overflow: "hidden",
          boxShadow: "0 30px 70px rgba(20,24,60,0.3)",
        }}
      >
        <Img src={img("hero")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </div>
    {/* wordmark rayé bas */}
    <div
      style={{
        position: "absolute",
        bottom: -28,
        left: 40,
        fontFamily: "var(--ff-jakarta), sans-serif",
        fontWeight: 800,
        fontSize: 200,
        textTransform: "uppercase",
        color: theme.text,
        opacity: 0.05,
        letterSpacing: "-0.04em",
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      Eloctix
    </div>
  </div>
);

const STATS = [
  { v: "25+", l: "Années d'expérience" },
  { v: "95%", l: "Taux de réussite" },
  { v: "500+", l: "Projets réalisés" },
  { v: "40M", l: "Heures d'intervention", accent: true },
];

const Stats: React.FC<{ theme: EloctixTheme }> = ({ theme }) => (
  <div style={{ height: SEC.stats, padding: "20px 50px" }}>
    <div
      style={{
        background: theme.card,
        borderRadius: 28,
        padding: "40px 50px",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 30,
      }}
    >
      {STATS.map((s, i) => (
        <div key={i}>
          <div
            style={{
              fontFamily: "var(--ff-jakarta), sans-serif",
              fontWeight: 800,
              fontSize: 56,
              color: s.accent ? theme.accent : theme.cardText,
              lineHeight: 1,
            }}
          >
            {s.v}
          </div>
          <div
            style={{
              fontFamily: "var(--ff-inter), sans-serif",
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: theme.textMut,
              marginTop: 10,
            }}
          >
            {s.l}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SERVICES = [
  { n: "01", t: "Recâblage résidentiel", d: "Mise à niveau complète et sécurisation de votre installation électrique, conforme aux normes.", im: "svc1" },
  { n: "02", t: "Dépannage d'urgence", d: "Une intervention rapide jour et nuit en cas de coupure, court-circuit ou panne imprévue.", im: "svc2" },
  { n: "03", t: "Service commercial", d: "Conception et installation de systèmes électriques pour bureaux, commerces et locaux industriels.", im: "svc3" },
  { n: "04", t: "Installation d'éclairage", d: "Solutions d'éclairage créatives et performantes pour vos espaces, intérieurs comme extérieurs.", im: "svc4" },
];

const Services: React.FC<{ theme: EloctixTheme }> = ({ theme }) => (
  <div style={{ height: SEC.services, padding: "50px 50px 0" }}>
    <div style={{ fontFamily: "var(--ff-inter), sans-serif", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: theme.accent }}>
      Services
    </div>
    <h2
      style={{
        fontFamily: "var(--ff-jakarta), sans-serif",
        fontWeight: 800,
        fontSize: 38,
        textTransform: "uppercase",
        letterSpacing: "-0.01em",
        color: theme.text,
        margin: "8px 0 30px",
        lineHeight: 1.05,
      }}
    >
      Connexion et installation d'appareils expertes
    </h2>
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {SERVICES.map((s, i) => {
        const reverse = i % 2 === 1;
        return (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 24,
              alignItems: "center",
              direction: reverse ? "rtl" : "ltr",
            }}
          >
            <div style={{ direction: "ltr", textAlign: reverse ? "right" : "left" }}>
              <div style={{ fontFamily: "var(--ff-jakarta), sans-serif", fontWeight: 800, fontSize: 21, color: theme.text }}>
                {s.t}
              </div>
              <div style={{ fontFamily: "var(--ff-inter), sans-serif", fontSize: 14.5, lineHeight: 1.55, color: theme.textMut, marginTop: 8 }}>
                {s.d}
              </div>
            </div>
            <div style={{ direction: "ltr", height: 130, borderRadius: 18, overflow: "hidden" }}>
              <Img src={img(s.im)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ direction: "ltr", textAlign: reverse ? "right" : "left" }}>
              <span style={{ fontFamily: "var(--ff-jakarta), sans-serif", fontWeight: 800, fontSize: 76, color: theme.text, opacity: 0.08 }}>
                {s.n}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const SOLUTIONS = [
  { t: "Idées créatives", d: "Des concepts sur mesure pensés pour valoriser et moderniser chaque installation.", tone: "light", im: "sol1" },
  { t: "Accompagnement dédié", d: "Un interlocuteur unique vous suit à chaque étape de votre projet.", tone: "dark" },
  { t: "Processus maîtrisé", d: "Une méthode rigoureuse, du diagnostic à la mise en service, sans surprise.", tone: "light", im: "sol2" },
];

const Solutions: React.FC<{ theme: EloctixTheme }> = ({ theme }) => (
  <div style={{ height: SEC.solutions, padding: "30px 50px 0" }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "var(--ff-inter), sans-serif", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: theme.accent }}>
        Pourquoi nous
      </div>
      <h2 style={{ fontFamily: "var(--ff-jakarta), sans-serif", fontWeight: 800, fontSize: 34, textTransform: "uppercase", color: theme.text, margin: "8px 0 24px" }}>
        Des solutions électriques fiables
      </h2>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
      {SOLUTIONS.map((s, i) => {
        const dark = s.tone === "dark";
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {s.im && (
              <div style={{ height: 130, borderRadius: 18, overflow: "hidden" }}>
                <Img src={img(s.im)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div
              style={{
                flex: 1,
                borderRadius: 18,
                padding: "24px 22px",
                background: dark ? theme.navy : theme.card,
                color: dark ? theme.navyText : theme.cardText,
                minHeight: s.im ? 120 : 250,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ fontFamily: "var(--ff-jakarta), sans-serif", fontWeight: 800, fontSize: 19 }}>{s.t}</div>
              <div style={{ fontFamily: "var(--ff-inter), sans-serif", fontSize: 14, lineHeight: 1.55, marginTop: 8, opacity: dark ? 0.75 : 1, color: dark ? theme.navyText : theme.textMut }}>
                {s.d}
              </div>
              {dark && (
                <div style={{ marginTop: "auto", paddingTop: 18 }}>
                  <OrangeBtn theme={theme} label="Démarrer" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const Footer: React.FC<{ theme: EloctixTheme }> = ({ theme }) => (
  <div style={{ height: SEC.footer, background: theme.navy, padding: "44px 50px 0", position: "relative", overflow: "hidden" }}>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div style={{ maxWidth: 320 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap color="#fff" size={18} />
          </div>
          <span style={{ fontFamily: "var(--ff-jakarta), sans-serif", fontWeight: 800, fontSize: 20, textTransform: "uppercase", color: "#fff" }}>
            Eloctix
          </span>
        </div>
        <p style={{ fontFamily: "var(--ff-inter), sans-serif", fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.55)", marginTop: 16 }}>
          Solutions électriques fiables pour la maison et l'entreprise.
        </p>
      </div>
      {[
        { t: "Société", l: ["À propos", "Services", "Réalisations", "Carrières"] },
        { t: "Ressources", l: ["Blog", "FAQ", "Devis gratuit", "Support"] },
        { t: "Contact", l: ["contact@eloctix.fr", "+33 1 23 45 67 89", "Paris, France"] },
      ].map((col, i) => (
        <div key={i}>
          <div style={{ fontFamily: "var(--ff-jakarta), sans-serif", fontWeight: 800, fontSize: 14, color: "#fff" }}>{col.t}</div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 9 }}>
            {col.l.map((x) => (
              <span key={x} style={{ fontFamily: "var(--ff-inter), sans-serif", fontSize: 13.5, color: "rgba(255,255,255,0.55)" }}>{x}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
    {/* wordmark stroke géant */}
    <div
      style={{
        position: "absolute",
        bottom: -40,
        left: 0,
        width: "100%",
        textAlign: "center",
        fontFamily: "var(--ff-jakarta), sans-serif",
        fontWeight: 800,
        fontSize: 240,
        textTransform: "uppercase",
        letterSpacing: "-0.04em",
        color: "transparent",
        WebkitTextStroke: "2px rgba(255,255,255,0.10)",
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      Eloctix
    </div>
  </div>
);
