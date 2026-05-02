import { AbsoluteFill, Img, Sequence, useCurrentFrame } from "remotion";
import { z } from "zod";
import { fontStack, palette, useFadeIn, useSpringIn } from "../lib/style";

export const socialReelSchema = z.object({
  brandName: z.string(),
  productName: z.string(),
  hook: z.string(),
  cta: z.string(),
  language: z.string(),
  productImageUrl: z.string().url().optional(),
  marketFlag: z.string().default("🌍"),
  accentColor: z.string().default(palette.violet),
});

export type SocialReelProps = z.infer<typeof socialReelSchema>;

export const socialReelDefaults: SocialReelProps = {
  brandName: "Markanız",
  productName: "Yeni koleksiyon",
  hook: "Avrupa rafların yıldızı 🇪🇺",
  cta: "DM'den sipariş",
  language: "TR",
  productImageUrl:
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80",
  marketFlag: "🇩🇪",
  accentColor: palette.violet,
};

export const SocialReel: React.FC<SocialReelProps> = (props) => {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${palette.slate900} 0%, #1a103d 100%)`,
        fontFamily: fontStack,
        color: palette.white,
        overflow: "hidden",
      }}
    >
      <Sequence from={0} durationInFrames={180}>
        <Hook {...props} />
      </Sequence>
      <Sequence from={180} durationInFrames={240}>
        <Showcase {...props} />
      </Sequence>
      <Sequence from={420} durationInFrames={180}>
        <CallToAction {...props} />
      </Sequence>
    </AbsoluteFill>
  );
};

const Hook: React.FC<SocialReelProps> = ({ hook, marketFlag, accentColor }) => {
  const frame = useCurrentFrame();
  const fade = useFadeIn(0, 20);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 80, textAlign: "center" }}>
      <div
        style={{
          fontSize: 240,
          marginBottom: 60,
          transform: `rotate(${Math.sin(frame / 8) * 8}deg)`,
        }}
      >
        {marketFlag}
      </div>
      <h1
        style={{
          fontSize: 88,
          fontWeight: 800,
          lineHeight: 1.15,
          margin: 0,
          opacity: fade,
          background: `linear-gradient(135deg, ${palette.white}, ${accentColor})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {hook}
      </h1>
    </AbsoluteFill>
  );
};

const Showcase: React.FC<SocialReelProps> = ({ productImageUrl, productName, brandName }) => {
  const scale = useSpringIn(0);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 60 }}>
      {productImageUrl && (
        <div
          style={{
            width: 800,
            height: 1000,
            borderRadius: 48,
            overflow: "hidden",
            transform: `scale(${0.7 + scale * 0.3})`,
            boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
          }}
        >
          <Img src={productImageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      <p style={{ fontSize: 48, marginTop: 60, opacity: 0.9 }}>
        {brandName} — <strong>{productName}</strong>
      </p>
    </AbsoluteFill>
  );
};

const CallToAction: React.FC<SocialReelProps> = ({ cta, accentColor, language }) => {
  const pulse = useFadeIn(0, 15);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", padding: 80 }}>
      <p style={{ fontSize: 36, opacity: 0.6, letterSpacing: 6, textTransform: "uppercase", margin: 0 }}>
        {language}
      </p>
      <h1
        style={{
          fontSize: 130,
          fontWeight: 800,
          lineHeight: 1.05,
          margin: "32px 0 0",
          color: accentColor,
          opacity: pulse,
          transform: `scale(${0.9 + pulse * 0.1})`,
        }}
      >
        {cta}
      </h1>
      <div
        style={{
          marginTop: 80,
          fontSize: 28,
          opacity: 0.5,
        }}
      >
        globalnest.app
      </div>
    </AbsoluteFill>
  );
};
