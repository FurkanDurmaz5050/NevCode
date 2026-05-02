import { AbsoluteFill, Img, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
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

export const socialReelSchema = z.object({
  brandName: z.string(),
  productName: z.string(),
  hook: z.string(),
  cta: z.string(),
  ctaLinkText: z.string().optional(),
  language: z.string(),
  productImageUrl: z.string().url().optional(),
  marketFlag: z.string().default("🌍"),
  marketCountry: z.string().optional(),
  tagline: z.string().optional(),
  bullets: z.array(z.string()).max(4).optional(),
  accentColor: z.string().default(palette.violet),
  secondaryColor: z.string().optional(),
  bgFrom: z.string().optional(),
  bgTo: z.string().optional(),
});

export type SocialReelProps = z.infer<typeof socialReelSchema>;

export const socialReelDefaults: SocialReelProps = {
  brandName: "Markanız",
  productName: "Yeni koleksiyon",
  hook: "Avrupa rafların yıldızı",
  cta: "DM'den sipariş",
  ctaLinkText: "Sipariş",
  language: "TR",
  marketCountry: "Almanya",
  tagline: "",
  bullets: ["Lokal kargo 6 gün", "EU sertifikalı", "%34 marj"],
  productImageUrl:
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80",
  marketFlag: "🇩🇪",
  accentColor: palette.violet,
  secondaryColor: palette.rose,
  bgFrom: "#0f0524",
  bgTo: "#2d1065",
};

const HOOK_DUR = 150;
const SHOWCASE_DUR = 240;
const CTA_DUR = 210;

export const SocialReel: React.FC<SocialReelProps> = (props) => {
  const sec = props.secondaryColor ?? props.accentColor;
  return (
    <AbsoluteFill
      style={{
        fontFamily: fontStack,
        color: palette.white,
        overflow: "hidden",
      }}
    >
      <CinematicBackground
        from={props.bgFrom ?? "#0f0524"}
        to={props.bgTo ?? "#2d1065"}
        accent={props.accentColor}
        secondary={sec}
      />
      <Sequence from={0} durationInFrames={HOOK_DUR}>
        <Hook {...props} />
      </Sequence>
      <Sequence from={HOOK_DUR} durationInFrames={SHOWCASE_DUR}>
        <Showcase {...props} />
      </Sequence>
      <Sequence from={HOOK_DUR + SHOWCASE_DUR} durationInFrames={CTA_DUR}>
        <CallToAction {...props} />
      </Sequence>
    </AbsoluteFill>
  );
};

const Hook: React.FC<SocialReelProps> = ({ hook, marketFlag, accentColor, brandName, language, tagline }) => {
  const frame = useCurrentFrame();
  const fade = useFadeIn(0, 24);
  const flagSpring = useSoftSpring(4);
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
        textAlign: "center",
        gap: 40,
      }}
    >
      <p
        style={{
          fontSize: 28,
          opacity: 0.7,
          letterSpacing: 8,
          textTransform: "uppercase",
          margin: 0,
          fontFamily: monoStack,
        }}
      >
        {brandName} · {language}
      </p>
      <div
        style={{
          fontSize: 280,
          marginBottom: 20,
          transform: `scale(${0.6 + flagSpring * 0.4}) rotate(${Math.sin(frame / 10) * 6}deg)`,
          opacity: flagSpring,
          filter: `drop-shadow(0 30px 50px ${withAlpha(accentColor, 0.55)})`,
        }}
      >
        {marketFlag}
      </div>
      <h1
        style={{
          fontSize: 96,
          fontWeight: 800,
          lineHeight: 1.1,
          margin: 0,
          opacity: fade,
          transform: `translateY(${(1 - fade) * 30}px)`,
          letterSpacing: -2,
          background: `linear-gradient(135deg, ${palette.white}, ${accentColor})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          padding: "0 40px",
        }}
      >
        {hook}
      </h1>
      {tagline ? (
        <p
          style={{
            fontSize: 36,
            opacity: fade * 0.7,
            margin: 0,
            fontWeight: 300,
          }}
        >
          {tagline}
        </p>
      ) : null}
    </AbsoluteFill>
  );
};

const Showcase: React.FC<SocialReelProps> = ({
  productImageUrl,
  productName,
  brandName,
  bullets,
  accentColor,
}) => {
  const { durationInFrames } = useVideoConfig();
  const scale = useSoftSpring(0);
  const captionFade = useFadeIn(40, 24);
  const par = useParallax(0, durationInFrames, 0, -30);
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
        gap: 50,
      }}
    >
      {productImageUrl && (
        <div
          style={{
            width: 820,
            height: 1020,
            borderRadius: 56,
            overflow: "hidden",
            position: "relative",
            transform: `scale(${0.7 + scale * 0.3}) translateY(${par}px)`,
            boxShadow: `0 60px 120px rgba(0,0,0,0.65), 0 0 0 1px ${withAlpha(palette.white, 0.1)}, 0 0 100px ${withAlpha(accentColor, 0.35)}`,
          }}
        >
          <Img
            src={productImageUrl}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.6) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 36,
              bottom: 36,
              right: 36,
              opacity: captionFade,
              transform: `translateY(${(1 - captionFade) * 30}px)`,
            }}
          >
            <p
              style={{
                fontSize: 22,
                margin: 0,
                opacity: 0.75,
                letterSpacing: 4,
                textTransform: "uppercase",
                fontFamily: monoStack,
              }}
            >
              {brandName}
            </p>
            <p
              style={{
                fontSize: 52,
                margin: "10px 0 0",
                fontWeight: 700,
                letterSpacing: -1,
                lineHeight: 1.1,
              }}
            >
              {productName}
            </p>
          </div>
        </div>
      )}

      {bullets && bullets.length ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            opacity: captionFade,
            transform: `translateY(${(1 - captionFade) * 16}px)`,
            alignItems: "center",
          }}
        >
          {bullets.slice(0, 3).map((b, i) => (
            <span
              key={i}
              style={{
                padding: "14px 28px",
                borderRadius: 999,
                background: withAlpha(palette.white, 0.08),
                border: `1.5px solid ${withAlpha(accentColor, 0.5)}`,
                fontSize: 30,
                fontWeight: 500,
                backdropFilter: "blur(6px)",
              }}
            >
              {b}
            </span>
          ))}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const CallToAction: React.FC<SocialReelProps> = ({
  cta,
  ctaLinkText,
  accentColor,
  language,
  marketCountry,
}) => {
  const pulse = useFadeIn(0, 18);
  const btnPulse = usePulse(20, 80);
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 80,
        gap: 36,
      }}
    >
      <p
        style={{
          fontSize: 30,
          opacity: 0.6,
          letterSpacing: 8,
          textTransform: "uppercase",
          margin: 0,
          fontFamily: monoStack,
        }}
      >
        {marketCountry ? `${marketCountry} · ${language}` : language}
      </p>
      <h1
        style={{
          fontSize: 138,
          fontWeight: 800,
          lineHeight: 1.05,
          margin: 0,
          letterSpacing: -3,
          background: `linear-gradient(135deg, ${palette.white} 0%, ${accentColor} 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          opacity: pulse,
          transform: `scale(${0.9 + pulse * 0.1})`,
          padding: "0 40px",
        }}
      >
        {cta}
      </h1>
      <div
        style={{
          marginTop: 20,
          padding: "26px 56px",
          borderRadius: 999,
          background: accentColor,
          color: "#0b1220",
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: -0.5,
          opacity: pulse,
          boxShadow: `0 20px 60px ${withAlpha(accentColor, 0.45 + btnPulse * 0.25)}`,
        }}
      >
        {ctaLinkText || cta} →
      </div>
      <div
        style={{
          marginTop: 60,
          fontSize: 22,
          opacity: 0.45,
          letterSpacing: 6,
          fontFamily: monoStack,
        }}
      >
        GLOBALNEST.APP
      </div>
    </AbsoluteFill>
  );
};
