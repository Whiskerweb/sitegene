// components/foundry/components/SocialIcon.tsx
// Icônes de réseaux sociaux en SVG inline (currentColor → thémable par CSS vars).
// La normalisation des noms vit dans lib/foundry/link-catalog (source unique).
import type { ReactNode } from "react";
import { normPlatform } from "@/lib/foundry/link-catalog";

const PATHS: Record<string, ReactNode> = {
  linkedin: (<><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></>),
  x: <path fill="currentColor" stroke="none" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
  instagram: (<><rect width="20" height="20" x="2" y="2" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></>),
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  github: <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />,
  mail: (<><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>),
  youtube: (<><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></>),
  tiktok: <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />,
  spotify: (<><circle cx="12" cy="12" r="10" /><path d="M7 9.5c3-1 7-0.7 9.5 1" /><path d="M7.5 13c2.5-0.8 5.7-0.5 7.8 1" /><path d="M8 16c2-0.6 4.3-0.4 6 0.8" /></>),
  "apple-music": (<><path d="M9 18V5l11-2v12" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="15" r="3" /></>),
  deezer: (<><rect x="3" y="14" width="3" height="4" /><rect x="8" y="11" width="3" height="7" /><rect x="13" y="8" width="3" height="10" /><rect x="18" y="5" width="3" height="13" /></>),
  soundcloud: (<><path d="M2 14v3" /><path d="M5.5 12v5" /><path d="M9 10v7" /><path d="M12.5 9v8" /><path d="M16 8a4 4 0 0 1 0 9h-3.5" /></>),
  bandcamp: <path d="M4 16l4-8h12l-4 8z" fill="currentColor" stroke="none" />,
  pinterest: (<><circle cx="12" cy="12" r="10" /><path d="M9 21c-0.5-2 1-6 1.5-8a3 3 0 1 1 4 2c-1 1-3 1-3 1" /></>),
  behance: (<><path d="M2 7h5a2.5 2.5 0 0 1 0 5H2zM2 12h5.5a2.5 2.5 0 0 1 0 5H2z" /><path d="M15 8h6" /><path d="M14 14h8a4 4 0 0 0-8 0 4 4 0 0 0 7 2.5" /></>),
  whatsapp: (<><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-4-1L3 20l1.1-5.3A8.38 8.38 0 0 1 3 11.5 8.5 8.5 0 0 1 11.5 3 8.38 8.38 0 0 1 21 11.5z" /><path d="M8.5 9c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-0.5-2-1.5-2.5-2.5l1-1-1-2z" fill="currentColor" stroke="none" /></>),
  maps: (<><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>),
  booking: (<><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="m9 16 2 2 4-4" /></>),
  ticketing: (<><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4z" /><path d="M13 7v10" /></>),
  menu: (<><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>),
  website: (<><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" /></>),
  link: (<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>),
};

// email est normalisé vers "email" par normPlatform, mais l'icône est "mail"
PATHS.email = PATHS.mail;

export default function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  const key = normPlatform(platform);
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[key] ?? PATHS.link}
    </svg>
  );
}
