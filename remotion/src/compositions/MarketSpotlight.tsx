import { AbsoluteFill, Img, Sequence, useVideoConfig } from "remotion";
import { z } from "zod";
import {
  CinematicBackground,
  fontStack,
  monoStack,
  palette,
  useFadeIn,
  useParallax,
  usePulse,
  useSoftSpring,
  withAlpha,
} from "../lib/style";

export const marketSpotlightSchema = z.object({
  brandName: z.string(),
  productName: z.string(),
  marketCountry: z.string(),
  marketFlag: z.string(),
  marketplaces: z.array(z.string()).max(4),
  hook: z.string(),
  bullets: z.array(z.string()).max(4),
  cta: z.string(),
  ctaLinkText: z.string().optional(),
  language: z.string(),
  productImageUrl: z.string().url().optional(),
  tagline: z.string().optional(),
  accentColor: z.string().default(palette.emerald),
  secondaryColor: z.string().optional(),
  bgFrom: z.string().optional(),
  bgTo: z.string().optional(),
});

export type MarketSpotlightProps = z.infer<typeof marketSpotlightSchema>;

export const marketSpotlightDefaults: MarketSpotlightProps = {
  brandName: "Markanız",
  productName: "Gül Suyu",
  marketCountry: "Almanya",
  marketFlag: "🇩🇪",
  marketplaces: ["Otto", "Amazon.de", "Kaufland"],
  hook: "Almanya pazarı sizi bekliyor.",
  bullets: [
    "EORI hazırlığı 3 günde",
    "Yerel kargo 6 gün",
    "Marj %34 — düşük rekabet",
    "EU CE etiketi ile satışa hazır",
  ],
  cta: "Otto'da yayına al",
  ctaLinkText: "Yayına al",
  language: "DE",
  tagline: "",
  productImageUrl:
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80",
  accentColor: palette.emerald,
  secondaryColor: palette.amber,
  bgFrom: "#0a0f1f",
  bgTo: "#1a1230",
};

const SCENE_INTRO = 120; // 4s
const SCENE_BULLETS = 420; // 14s
const SCENE_OUTRO = 360; // 12s

export const MarketSpotlight: React.FC<MarketSpotlightProps> = (props) => {
  const sec = props.secondaryColor ?? props.accentColor;
  return (
    <AbsoluteFill
      style={{
        fontFamily: fontStack,
        color: palette.white,
      }}
    >
      <CinematicBackground
        from={props.bgFrom ?? "#0a0f1f"}
        to={props.bgTo ?? "#1a1230"}
        accent={props.accentColor}
        secondary={sec}
      />
      <Sequence from={0} durationInFrames={SCENE_INTRO}>
        <Intro {...props} />
      </Sequence>
      <Sequence from={SCENE_INTRO} durationInFrames={SCENE_BULLETS}>
        <Bullets {...props} />
      </Sequence>
      <Sequence from={SCENE_INTRO + SCENE_BULLETS} durationInFrames={SCENE_OUTRO}>
        <Outro {...props} />
      </Sequence>
    </AbsoluteFill>
  );
};

const Intro: React.FC<MarketSpotlightProps> = ({
  marketCountry,
  marketFlag,
  brandName,
  language,
  accentColor,
  tagline,
}) => {
  const { durationInFrames } = useVideoConfig();
  const flagSpring = useSoftSpring(4);
  const fadeText = useFadeIn(28, 28);
  const par = useParallax(0, durationInFrames, 0, -20);
  return (
    <AbsoluteFill
      style={{ alignItems: "center", justifyContent: "center", gap: 40 }}
    >
      <div
        style={{
          fontSize: 360,
          transform: `scale(${0.55 + flagSpring * 0.45}) translateY(${par}px)`,
          opacity: flagSpring,
          filter: `drop-shadow(0 30px 60px ${withAlpha(accentColor, 0.5)})`,
        }}
      >
        {marketFlag}
      </div>
      <div style={{ opacity: fadeText, textAlign: "center" }}>
        <p
          style={{
            fontSize: 26,
            opacity: 0.7,
            letterSpacing: 6,
            textTransform: "uppercase",
            margin: 0,
            fontFamily: monoStack,
          }}
        >
          {brandName} · {language}
        </p>
        <h1
          style={{
            fontSize: 130,
            fontWeight: 700,
            margin: "18px 0 0",
            letterSpacing: -3,
            background: `linear-gradient(135deg, ${palette.white} 0%, ${accentColor} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {marketCountry}
        </h1>
        {tagline ? (
          <p
            style={{
              fontSize: 30,
              opacity: 0.65,
              margin: "20px 0 0",
              fontWeight: 300,
            }}
          >
            {tagline}
          </p>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

const Bullets: React.FC<MarketSpotlightProps> = ({
  hook,
  bullets,
  accentColor,
  productImageUrl,
  productName,
  brandName,
}) => {
  const fadeHook = useFadeIn(0, 28);
  return (
    <AbsoluteFill
      style={{
        padding: "100px 120px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 80,
      }}
    >
      <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: 48 }}>
        <h2
          style={{
            fontSize: 88,
            fontWeight: 700,
            lineHeight: 1.1,
            margin: 0,
            opacity: fadeHook,
            transform: `translateY(${(1 - fadeHook) * 30}px)`,
            letterSpacing: -2,
          }}
        >
          {hook}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          {bullets.map((b, i) => (
            <BulletRow key={i} text={b} delay={40 + i * 26} accentColor={accentColor} index={i + 1} />
          ))}
        </div>
      </div>

      {productImageUrl ? (
        <ProductCard
          imageUrl={productImageUrl}
          accentColor={accentColor}
          productName={productName}
          brandName={brandName}
        />
      ) : null}
    </AbsoluteFill>
  );
};

const BulletRow: React.FC<{
  text: string;
  delay: number;
  accentColor: string;
  index: number;
}> = ({ text, delay, accentColor, index }) => {
  const slide = useSoftSpring(delay);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        transform: `translateX(${(1 - slide) * -80}px)`,
        opacity: slide,
      }}
    >
      <div
        style={{
          minWidth: 56,
          height: 56,
          borderRadius: 16,
          background: withAlpha(accentColor, 0.18),
          border: `1.5px solid ${withAlpha(accentColor, 0.55)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: monoStack,
          fontSize: 24,
          color: accentColor,
          fontWeight: 600,
        }}
      >
        0{index}
      </div>
      <p
        style={{
          fontSize: 42,
          margin: 0,
          opacity: 0.96,
          fontWeight: 400,
          letterSpacing: -0.3,
        }}
      >
        {text}
      </p>
    </div>
  );
};

const ProductCard: React.FC<{
  imageUrl: string;
  accentColor: string;
  productName: string;
  brandName: string;
}> = ({ imageUrl, accentColor, productName, brandName }) => {
  const scale = useSoftSpring(20);
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        transform: `scale(${0.85 + scale * 0.15})`,
        opacity: scale,
      }}
    >
      <div
        style={{
          width: 560,
          height: 560,
          borderRadius: 36,
          overflow: "hidden",
          position: "relative",
          boxShadow: `0 50px 100px rgba(0,0,0,0.55), 0 0 0 1px ${withAlpha(palette.white, 0.08)}, 0 0 80px ${withAlpha(accentColor, 0.3)}`,
        }}
      >
        <Img
          src={imageUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 28,
            bottom: 24,
            right: 28,
          }}
        >
          <p
            style={{
              fontSize: 18,
              margin: 0,
              opacity: 0.7,
              letterSpacing: 3,
              textTransform: "uppercase",
              fontFamily: monoStack,
            }}
          >
            {brandName}
          </p>
          <p
            style={{
              fontSize: 32,
              margin: "6px 0 0",
              fontWeight: 600,
              letterSpacing: -0.5,
            }}
          >
            {productName}
          </p>
        </div>
      </div>
    </div>
  );
};

const Outro: React.FC<MarketSpotlightProps> = ({
  cta,
  ctaLinkText,
  marketplaces,
  accentColor,
  productName,
  marketCountry,
}) => {
  const fadeCta = useFadeIn(20, 30);
  const fadeMp = useFadeIn(80, 30);
  const pulse = usePulse(40, 90);
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: 44,
        textAlign: "center",
        padding: 80,
      }}
    >
      <p
        style={{
          fontSize: 28,
          opacity: 0.7,
          margin: 0,
          letterSpacing: 6,
          textTransform: "uppercase",
          fontFamily: monoStack,
        }}
      >
        {productName} · {marketCountry}
      </p>
      <h1
        style={{
          fontSize: 130,
          fontWeight: 700,
          margin: 0,
          letterSpacing: -3,
          opacity: fadeCta,
          transform: `scale(${0.88 + fadeCta * 0.12})`,
          background: `linear-gradient(135deg, ${palette.white} 0%, ${accentColor} 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {cta}
      </h1>
      <div
        style={{
          opacity: fadeMp,
          transform: `translateY(${(1 - fadeMp) * 20}px)`,
          marginTop: 20,
          padding: "22px 44px",
          borderRadius: 999,
          background: accentColor,
          color: "#0b1220",
          fontSize: 32,
          fontWeight: 600,
          boxShadow: `0 20px 60px ${withAlpha(accentColor, 0.45 + pulse * 0.25)}`,
        }}
      >
        {ctaLinkText || cta} →
      </div>
      <div style={{ display: "flex", gap: 18, opacity: fadeMp, marginTop: 28, flexWrap: "wrap", justifyContent: "center" }}>
        {marketplaces.map((m) => (
          <span
            key={m}
            style={{
              padding: "14px 28px",
              borderRadius: 999,
              border: `1.5px solid ${withAlpha(palette.white, 0.3)}`,
              background: withAlpha(palette.white, 0.05),
              fontSize: 26,
              fontFamily: monoStack,
              letterSpacing: 1,
            }}
          >
            {m}
          </span>
        ))}
      </div>
      <p
        style={{
          marginTop: 40,
          fontSize: 18,
          opacity: 0.4,
          letterSpacing: 4,
          fontFamily: monoStack,
        }}
      >
        GLOBALNEST.APP
      </p>
    </AbsoluteFill>
  );
};
