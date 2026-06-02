import "./index.css";
import { Composition } from "remotion";
import { AkyraHero, EloctixHero } from "./AkyraHero";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Version 1 — électricien « Bréval Élec » (template Potozon → Alice) */}
      <Composition id="AkyraHero" component={AkyraHero} durationInFrames={640} fps={30} width={1920} height={1080} />
      {/* Version 2 — électricien « Eloctix » (navy/orange) */}
      <Composition id="EloctixHero" component={EloctixHero} durationInFrames={640} fps={30} width={1920} height={1080} />
    </>
  );
};
