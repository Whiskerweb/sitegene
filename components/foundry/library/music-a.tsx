// components/foundry/library/music-a.tsx
// Composants du LOT « music-a » : sections artiste/DJ (hero-drop, release-grid,
// tour-dates, artist-statement, booking-cta), adaptées aux conventions de la fonderie.
import type { ComponentType } from "react";
import type { Skin } from "@/lib/foundry/types";
import HeroDrop from "../components/HeroDrop";
import ReleaseGrid from "../components/ReleaseGrid";
import TourDates from "../components/TourDates";
import ArtistStatement from "../components/ArtistStatement";
import BookingCta from "../components/BookingCta";

type C = ComponentType<{ content: any; skin: Skin }>;

export const COMPONENTS_MUSIC_A: Record<string, C> = {
  "hero-drop": HeroDrop as C,
  "release-grid": ReleaseGrid as C,
  "tour-dates": TourDates as C,
  "artist-statement": ArtistStatement as C,
  "booking-cta": BookingCta as C,
};
