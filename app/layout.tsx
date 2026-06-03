import type { Metadata } from "next";
import { Fraunces, Inter, Caveat, Archivo } from "next/font/google";
import ScrollReveal from "@/components/ui/ScrollReveal";
import "./globals.css";

const archivo = Archivo({
  variable: "--ff-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "900"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://akyra.io"),
  title: "Akyra · Votre site pro, prêt en 30 secondes",
  description:
    "Des sites pros déjà construits pour photographes. Vous choisissez, on publie. En ligne en 30 secondes, 50 €/an tout compris.",
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: "Akyra",
    title: "Akyra · Votre site pro, prêt en 30 secondes",
    description:
      "Des sites pros déjà construits pour photographes. Vous choisissez, on publie. En ligne en 30 secondes, 50 €/an tout compris.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${inter.variable} ${caveat.variable} ${archivo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="grain dotted-grid min-h-full bg-background text-foreground" suppressHydrationWarning>
        <ScrollReveal />
        {children}
      </body>
    </html>
  );
}

