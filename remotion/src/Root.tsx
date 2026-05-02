import { Composition } from "remotion";
import {
  ProductHero,
  productHeroSchema,
  productHeroDefaults,
} from "./compositions/ProductHero";
import {
  MarketSpotlight,
  marketSpotlightSchema,
  marketSpotlightDefaults,
} from "./compositions/MarketSpotlight";
import {
  SocialReel,
  socialReelSchema,
  socialReelDefaults,
} from "./compositions/SocialReel";

const FPS = 30;

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="ProductHero"
        component={ProductHero}
        durationInFrames={15 * FPS}
        fps={FPS}
        width={1920}
        height={1080}
        schema={productHeroSchema}
        defaultProps={productHeroDefaults}
      />
      <Composition
        id="MarketSpotlight"
        component={MarketSpotlight}
        durationInFrames={30 * FPS}
        fps={FPS}
        width={1920}
        height={1080}
        schema={marketSpotlightSchema}
        defaultProps={marketSpotlightDefaults}
      />
      <Composition
        id="SocialReel"
        component={SocialReel}
        durationInFrames={20 * FPS}
        fps={FPS}
        width={1080}
        height={1920}
        schema={socialReelSchema}
        defaultProps={socialReelDefaults}
      />
    </>
  );
};
