// components/foundry/library/navbars-a.tsx
// Composants du LOT « navbars-a » : 9 en-têtes extraits de tout le catalogue de
// templates (saas, e-learning, musiciens, photographes, portfolios, voyage).
import type { ComponentType } from "react";
import type { Skin } from "@/lib/foundry/types";
import GlassPillNavbar from "../components/GlassPillNavbar";
import AppBarNavbar from "../components/AppBarNavbar";
import PillMenuNavbar from "../components/PillMenuNavbar";
import ChipLinksNavbar from "../components/ChipLinksNavbar";
import InkBarNavbar from "../components/InkBarNavbar";
import SplitWordmarkNavbar from "../components/SplitWordmarkNavbar";
import StudioClockNavbar from "../components/StudioClockNavbar";
import TickerNavbar from "../components/TickerNavbar";
import WordmarkNavbar from "../components/WordmarkNavbar";

type C = ComponentType<{ content: any; skin: Skin }>;

export const COMPONENTS_NAVBARS_A: Record<string, C> = {
  "glass-pill-navbar": GlassPillNavbar as C,
  "app-bar-navbar": AppBarNavbar as C,
  "pill-menu-navbar": PillMenuNavbar as C,
  "chip-links-navbar": ChipLinksNavbar as C,
  "ink-bar-navbar": InkBarNavbar as C,
  "split-wordmark-navbar": SplitWordmarkNavbar as C,
  "studio-clock-navbar": StudioClockNavbar as C,
  "ticker-navbar": TickerNavbar as C,
  "wordmark-navbar": WordmarkNavbar as C,
};
