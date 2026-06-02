import React from "react";
import { Img, staticFile, useCurrentFrame, interpolate } from "remotion";
import { EASE_POP, EASE_SOFT } from "../theme/easing";

// Vignette photo qui se glisse d'une source vers une cible (drag & drop).
// `img` = chemin relatif complet (ex "img/p8.jpg" ou "eloctix/svc1.jpg").
export const PhotoDragCard: React.FC<{
  img: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  start: number;
  size?: number;
  rest?: boolean;
}> = ({ img, from, to, start, size = 120, rest = true }) => {
  const frame = useCurrentFrame();
  const dur = 14;
  const p = interpolate(frame, [start, start + dur], [0, 1], {
    easing: EASE_POP,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(p, [0, 1], [from.x, to.x]);
  const y = interpolate(p, [0, 1], [from.y, to.y]);
  const rot = interpolate(p, [0, 0.5, 1], [-7, 6, -2]);
  const lift = interpolate(p, [0, 0.5, 1], [1, 1.12, 1]);
  const shrink = interpolate(frame, [start + dur, start + dur + 8], [1, 0.42], {
    easing: EASE_SOFT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = lift * (rest ? shrink : 1);
  const shadow = interpolate(p, [0, 0.5, 1], [0.12, 0.4, 0.2]);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        transform: `rotate(${rot}deg) scale(${scale})`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: `0 ${22 * shadow * 3}px 44px rgba(20,40,80,${shadow})`,
        border: "3px solid #fff",
      }}
    >
      <Img src={staticFile(img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
};
