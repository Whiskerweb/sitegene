import { Easing } from "remotion";

export const EASE_SOFT = Easing.bezier(0.22, 1, 0.36, 1);
export const EASE_POP = Easing.bezier(0.34, 1.56, 0.64, 1);
export const EASE_INOUT = Easing.bezier(0.65, 0, 0.35, 1);

export const SPRING_SMOOTH = { damping: 200, mass: 0.8, stiffness: 100 };
export const SPRING_POP = { damping: 12, mass: 0.6, stiffness: 180 };
export const SPRING_SNAP = { damping: 18, mass: 0.5, stiffness: 220 };
