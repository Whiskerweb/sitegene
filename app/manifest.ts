import type { MetadataRoute } from "next";

/**
 * [1.2] Manifest PWA : complète le favicon (app/favicon.ico 16+32,
 * app/icon.png 512, app/apple-icon.png 180 — servis automatiquement par
 * Next sur toutes les pages) avec les tailles 192/512 attendues par les
 * navigateurs modernes et Android.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Akyra — Votre site pro, déjà construit",
    short_name: "Akyra",
    description:
      "Des sites pros déjà construits pour les indépendants. En ligne en 30 secondes, 50 €/an tout compris.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#0a0a0f",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
