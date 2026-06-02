import React from "react";
import { Img, staticFile } from "remotion";
import { SiteTheme, POTOZON_THEME } from "./siteTheme";
import { GOLD } from "../theme/tokens";

export const SITE_W = 1500;
export const SITE_H = 880;
const URLBAR_H = 58;
const VIEWPORT_H = SITE_H - URLBAR_H;
const NAV_H = 78;

export const SECTION = { heroTop: 0, hero: 700, services: 640, gallery: 900, footer: 420 };
export const CONTENT_H = SECTION.hero + SECTION.services + SECTION.gallery + SECTION.footer;

export const SCROLL = {
  top: 0,
  services: SECTION.hero - 60,
  gallery: SECTION.hero + SECTION.services - 40,
  footer: SECTION.hero + SECTION.services + SECTION.gallery - VIEWPORT_H + 200,
};

export const SiteMockup: React.FC<{
  theme?: SiteTheme;
  scrollY?: number;
  titleNode?: React.ReactNode;
  chromeOpacity?: number;
}> = ({ theme = POTOZON_THEME, scrollY = 0, titleNode, chromeOpacity = 1 }) => {
  return (
    <div
      style={{
        width: SITE_W,
        height: SITE_H,
        borderRadius: 22,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 50px 120px rgba(20,40,80,0.32)",
        border: "1px solid rgba(255,255,255,0.6)",
      }}
    >
      <div
        style={{
          height: URLBAR_H,
          background: "#eef1f6",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 14,
          opacity: chromeOpacity,
          borderBottom: "1px solid #dde3ec",
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
            border: "1px solid #dde3ec",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            color: "#7a8699",
            fontFamily: "var(--ff-inter), sans-serif",
            fontSize: 15,
          }}
        >
          <span style={{ color: "#28a745", marginRight: 8, fontSize: 13 }}>🔒</span>
          breval-elec.fr
        </div>
      </div>

      <div style={{ position: "relative", height: VIEWPORT_H, overflow: "hidden", background: theme.pageBg }}>
        <div style={{ position: "absolute", top: -scrollY, left: 0, width: SITE_W }}>
          <Hero theme={theme} titleNode={titleNode} />
          <Services theme={theme} />
          <Gallery theme={theme} scrollY={scrollY} />
          <Footer theme={theme} />
        </div>
        <SiteNavbar theme={theme} />
      </div>
    </div>
  );
};

const Dot: React.FC<{ c: string }> = ({ c }) => (
  <div style={{ width: 13, height: 13, borderRadius: "50%", background: c }} />
);

const Bolt: React.FC<{ color: string; size?: number }> = ({ color, size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M13 2 L4 14 H11 L10 22 L20 9 H13 Z" fill={color} />
  </svg>
);

const GoldButton: React.FC<{ theme: SiteTheme; label: string; big?: boolean }> = ({ theme, label, big }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: big ? "16px 30px" : "11px 20px",
      borderRadius: 999,
      background: `linear-gradient(180deg, ${theme.ctaFrom}, ${theme.ctaTo})`,
      color: theme.ctaText,
      fontFamily: "var(--ff-jakarta), sans-serif",
      fontWeight: 800,
      fontSize: big ? 20 : 16,
      boxShadow: `0 10px 26px ${GOLD.to}66`,
    }}
  >
    {label}
  </div>
);

const SiteNavbar: React.FC<{ theme: SiteTheme }> = ({ theme }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: SITE_W,
      height: NAV_H,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 44px",
      background: theme.navBg,
      backdropFilter: "blur(8px)",
      borderBottom: `1px solid ${theme.text}14`,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Bolt color={theme.ctaTo} />
      <span style={{ fontFamily: "var(--ff-jakarta), sans-serif", fontWeight: 800, fontSize: 22, color: theme.navText, letterSpacing: "-0.02em" }}>
        Bréval Élec
      </span>
    </div>
    <div style={{ display: "flex", gap: 30, fontFamily: "var(--ff-inter), sans-serif", fontWeight: 500, fontSize: 16, color: theme.navText, opacity: 0.85 }}>
      <span>Accueil</span>
      <span>Services</span>
      <span>Réalisations</span>
      <span>Contact</span>
    </div>
    <GoldButton theme={theme} label="Devis gratuit" />
  </div>
);

const Hero: React.FC<{ theme: SiteTheme; titleNode?: React.ReactNode }> = ({ theme, titleNode }) => (
  <div
    style={{
      height: SECTION.hero,
      padding: "150px 60px 0",
      display: "flex",
      gap: 40,
      position: "relative",
      background: `radial-gradient(80% 60% at 80% 0%, ${theme.pageBgAccent} 0%, transparent 60%)`,
    }}
  >
    <div style={{ flex: 1.2 }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 14px",
          borderRadius: 999,
          background: `${theme.cards[3]}22`,
          color: theme.text,
          fontFamily: "var(--ff-inter), sans-serif",
          fontWeight: 600,
          fontSize: 14,
          marginBottom: 22,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
        Artisan certifié · Annecy & Haute-Savoie
      </div>
      <h1
        style={{
          fontFamily: "var(--ff-jakarta), sans-serif",
          fontWeight: 800,
          fontSize: 76,
          lineHeight: 0.98,
          letterSpacing: "-0.03em",
          color: theme.text,
          margin: 0,
        }}
      >
        {titleNode ?? "Votre électricien à Annecy."}
      </h1>
      <p style={{ fontFamily: "var(--ff-inter), sans-serif", fontSize: 21, lineHeight: 1.5, color: theme.textMuted, maxWidth: 540, marginTop: 26 }}>
        Installation, dépannage et mise aux normes. Intervention rapide, devis clair, travail soigné.
      </p>
      <div style={{ display: "flex", gap: 16, marginTop: 34 }}>
        <GoldButton theme={theme} label="Demander un devis" big />
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "16px 28px",
            borderRadius: 999,
            border: `1.5px solid ${theme.text}33`,
            color: theme.text,
            fontFamily: "var(--ff-jakarta), sans-serif",
            fontWeight: 700,
            fontSize: 19,
          }}
        >
          06 12 34 56 78
        </div>
      </div>
    </div>
    <div style={{ flex: 0.9, position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: -10,
          right: 0,
          width: 430,
          height: 470,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 30px 70px rgba(20,40,80,0.28)",
          transform: "rotate(2deg)",
        }}
      >
        <Img src={staticFile("img/p3.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 360,
          right: 360,
          background: theme.cards[1],
          color: theme.cardTextAlt,
          padding: "16px 22px",
          borderRadius: 20,
          fontFamily: "var(--ff-jakarta), sans-serif",
          fontWeight: 800,
          boxShadow: "0 14px 30px rgba(20,40,80,0.2)",
          transform: "rotate(-4deg)",
        }}
      >
        <div style={{ fontSize: 30 }}>15 ans</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>d'expérience</div>
      </div>
    </div>
  </div>
);

const SERVICES = [
  { t: "Installation électrique", d: "Tableaux, prises, éclairage — du neuf à la rénovation complète." },
  { t: "Dépannage 7j/7", d: "Panne, court-circuit, disjoncteur : intervention rapide." },
  { t: "Mise aux normes", d: "Diagnostic et remise en conformité NF C 15-100." },
  { t: "Domotique", d: "Maison connectée, volets, chauffage et bornes de recharge." },
];

const Services: React.FC<{ theme: SiteTheme }> = ({ theme }) => (
  <div style={{ height: SECTION.services, padding: "70px 60px" }}>
    <h2 style={{ fontFamily: "var(--ff-jakarta), sans-serif", fontWeight: 800, fontSize: 46, letterSpacing: "-0.02em", color: theme.text, margin: "0 0 8px" }}>
      Nos services
    </h2>
    <p style={{ fontFamily: "var(--ff-inter), sans-serif", fontSize: 18, color: theme.textMuted, margin: "0 0 36px" }}>
      Tout pour votre installation, par un seul interlocuteur.
    </p>
    <div style={{ display: "flex", gap: 22 }}>
      {SERVICES.map((s, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: theme.cards[i],
            color: theme.cardText,
            borderRadius: 24,
            padding: "30px 26px",
            minHeight: 300,
            display: "flex",
            flexDirection: "column",
            transform: `rotate(${[-1.5, 1, -1, 1.5][i]}deg)`,
            boxShadow: "0 20px 44px rgba(20,40,80,0.16)",
          }}
        >
          <div style={{ width: 54, height: 54, borderRadius: 16, background: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
            <Bolt color={theme.cardText} size={28} />
          </div>
          <div style={{ fontFamily: "var(--ff-jakarta), sans-serif", fontWeight: 800, fontSize: 23, marginBottom: 10 }}>{s.t}</div>
          <div style={{ fontFamily: "var(--ff-inter), sans-serif", fontSize: 15.5, lineHeight: 1.5, opacity: 0.92 }}>{s.d}</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontFamily: "var(--ff-jakarta), sans-serif", fontWeight: 800, fontSize: 40, opacity: 0.25 }}>0{i + 1}</div>
        </div>
      ))}
    </div>
  </div>
);

const GALLERY_IMGS = ["p1.jpg", "p2.jpg", "p4.jpg", "p5.jpg", "p6.jpg", "p7.jpg"];

const Gallery: React.FC<{ theme: SiteTheme; scrollY: number }> = ({ theme, scrollY }) => (
  <div style={{ height: SECTION.gallery, padding: "60px 60px", position: "relative" }}>
    <h2 style={{ fontFamily: "var(--ff-jakarta), sans-serif", fontWeight: 800, fontSize: 46, letterSpacing: "-0.02em", color: theme.text, margin: "0 0 30px" }}>
      Nos réalisations
    </h2>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
      {GALLERY_IMGS.map((img, i) => {
        const par = (scrollY - SECTION.hero - SECTION.services) * 0.04 * ((i % 3) - 1);
        return (
          <div key={img} style={{ height: i % 2 === 0 ? 230 : 270, borderRadius: 18, overflow: "hidden", boxShadow: "0 16px 38px rgba(20,40,80,0.18)" }}>
            <Img src={staticFile(`img/${img}`)} style={{ width: "100%", height: "120%", objectFit: "cover", transform: `translateY(${par}px)` }} />
          </div>
        );
      })}
    </div>
  </div>
);

const Footer: React.FC<{ theme: SiteTheme }> = ({ theme }) => (
  <div style={{ height: SECTION.footer, padding: "60px", display: "flex", gap: 30 }}>
    <div
      style={{
        flex: 1,
        borderRadius: 26,
        padding: 44,
        background: `linear-gradient(135deg, ${theme.cards[3]}, ${theme.cards[0]})`,
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={{ fontFamily: "var(--ff-jakarta), sans-serif", fontWeight: 800, fontSize: 34, lineHeight: 1.05 }}>
        Un projet électrique ? Parlons-en.
      </div>
      <div style={{ fontFamily: "var(--ff-inter), sans-serif", fontSize: 17, opacity: 0.9, marginTop: 14 }}>
        Annecy · contact@breval-elec.fr · 06 12 34 56 78
      </div>
      <div style={{ marginTop: 24 }}>
        <GoldButton theme={theme} label="Devis gratuit" big />
      </div>
    </div>
  </div>
);
