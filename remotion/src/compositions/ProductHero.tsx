import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";
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

export const productHeroSchema = z.object({
  brandName: z.string(),
  productName: z.string(),
  hook: z.string(),
  cta: z.string(),
  ctaLinkText: z.string().optional(),
  language: z.string(),
  productImageUrl: z.string().url().optional(),
  marketCountry: z.string().optional(),
  marketFlag: z.string().optional(),
  tagline: z.string().optional(),
  accentColor: z.string().default(palette.emerald),
  secondaryColor: z.string().optional(),
  bgFrom: z.string().optional(),
  bgTo: z.string().optional(),
});

export type ProductHeroProps = z.infer<typeof productHeroSchema>;

export const productHeroDefaults: ProductHeroProps = {
  brandName: "Markanız",
  productName: "Ürün",
  hook: "Yurtdışında parlamaya hazır.",
  cta: "Şimdi keşfet",
  ctaLinkText: "Keşfet",
  language: "TR",
  marketCountry: "Almanya",
  marketFlag: "🇩🇪",
  tagline: "",
  productImageUrl:
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80",
  accentColor: palette.emerald,
  secondaryColor: palette.teal,
  bgFrom: palette.slate900,
  bgTo: "#1e293b",
};

export const ProductHero: React.FC<ProductHeroProps> = ({
  brandName,
  productName,
  hook,
  cta,
  ctaLinkText,
  language,
  productImageUrl,
  marketCountry,
  marketFlag,
  tagline,
  accentColor,
  secondaryColor,
  bgFrom,
  bgTo,
}) => {
  const { durationInFrames } = useVideoConfig();
  const fadeBrand = useFadeIn(8, 18);
  const titleSpring = useSoftSpring(28);
  const fadeHook = useFadeIn(70, 22);
  const fadeCta = useFadeIn(150, 24);
  const ctaPulse = usePulse(180, 90);
  const parY = useParallax(0, durationInFrames, 0, -60);
  const sec = secondaryColor ?? accentColor;

  return (
    <AbsoluteFill style={{ fontFamily: fontStack, color: palette.white }}>
      <CinematicBackground
        from={bgFrom ?? palette.slate900}
        to={bgTo ?? "#1e293b"}
        accent={accentColor}
        secondary={sec}
      />

      {productImageUrl && (
        <AbsoluteFill style={{ opacity: 0.22 }}>
          <Img
            src={productImageUrl}
            style={{
              width: "108%",
              height: "108%",
              objectFit: "cover",
              filter: "blur(14px) saturate(1.1)",
              transform: `translateY(${parY}px) scale(1.05)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(180deg, ${withAlpha(
                bgFrom ?? palette.slate900,
                0.4,
              )} 0%, ${withAlpha(bgTo ?? "#1e293b", 0.85)} 100%)`,
            }}
          />
        </AbsoluteFill>
      )}

      <AbsoluteFill
        style={{
          padding: "120px 140px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 36,
        }}
      >
        {/* Brand chip */}
        <div
          style={{
            opacity: fadeBrand,
            transform: `translateY(${(1 - fadeBrand) * 16}px)`,
            display: "inline-flex",
            alignSelf: "flex-start",
            alignItems: "center",
            gap: 14,
            padding: "12px 22px",
            borderRadius: 999,
            background: withAlpha(palette.white, 0.06),
            border: `1px solid ${withAlpha(palette.white, 0.14)}`,
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: accentColor,
              boxShadow: `0 0 16px ${withAlpha(accentColor, 0.9)}`,
            }}
          />
          <span
            style={{
              fontSize: 22,
              letterSpacing: 4,
              opacity: 0.9,
              textTransform: "uppercase",
              fontFamily: monoStack,
            }}
          >
            {brandName} · {marketFlag ?? ""} {language}
          </span>
        </div>

        {/* Eyebrow */}
        {tagline ? (
          <p
            style={{
              fontSize: 30,
              opacity: fadeBrand * 0.65,
              margin: 0,
              letterSpacing: 1,
            }}
          >
            {tagline}
          </p>
        ) : null}

        {/* Title */}
        <h1
          style={{
            fontSize: 156,
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: -3.5,
            transform: `translateY(${(1 - titleSpring) * 80}px)`,
            opacity: titleSpring,
            margin: 0,
            background: `linear-gradient(135deg, ${palette.white} 0%, ${withAlpha(
              accentColor,
              0.95,
            )} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: `0 6px 60px ${withAlpha(accentColor, 0.4)}`,
          }}
        >
          {productName}
        </h1>

        {/* Hook */}
        <p
          style={{
            fontSize: 52,
            opacity: fadeHook * 0.94,
            maxWidth: 1500,
            lineHeight: 1.22,
            margin: 0,
            fontWeight: 300,
            letterSpacing: -0.5,
          }}
        >
          {hook}
        </p>

        {/* CTA */}
        <div
          style={{
            opacity: fadeCta,
            transform: `translateY(${(1 - fadeCta) * 24}px)`,
            display: "inline-flex",
            alignSelf: "flex-start",
            alignItems: "center",
            gap: 16,
            background: accentColor,
            color: "#0b1220",
            padding: "26px 52px",
            borderRadius: 999,
            fontSize: 38,
            fontWeight: 600,
            marginTop: 20,
            boxShadow: `0 20px 60px ${withAlpha(accentColor, 0.45 + ctaPulse * 0.25)}`,
          }}
        >
          {ctaLinkText || cta}
          <span style={{ fontSize: 36 }}>→</span>
        </div>

        {marketCountry ? (
          <p
            style={{
              fontSize: 24,
              opacity: fadeCta * 0.55,
              margin: "8px 0 0",
              fontFamily: monoStack,
              letterSpacing: 2,
            }}
          >
            {marketCountry.toUpperCase()} · POWERED BY GLOBALNEST
          </p>
        ) : null}
      </AbsoluteFill>

      {/* Corner mark */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          right: 70,
          fontSize: 22,
          letterSpacing: 4,
          opacity: 0.35 + 0.25 * ctaPulse,
          fontFamily: monoStack,
        }}
      >
        globalnest.app
      </div>
    </AbsoluteFill>
  );
};
