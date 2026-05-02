import { AbsoluteFill, Sequence } from "remotion";
import { z } from "zod";
import { fontStack, palette, useFadeIn, useSpringIn } from "../lib/style";

export const marketSpotlightSchema = z.object({
  brandName: z.string(),
  productName: z.string(),
  marketCountry: z.string(),
  marketFlag: z.string(),
  marketplaces: z.array(z.string()).max(4),
  hook: z.string(),
  bullets: z.array(z.string()).max(4),
  cta: z.string(),
  language: z.string(),
  accentColor: z.string().default(palette.emerald),
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
  language: "DE",
  accentColor: palette.emerald,
};

export const MarketSpotlight: React.FC<MarketSpotlightProps> = (props) => {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${palette.slate900} 0%, #0b1220 100%)`,
        fontFamily: fontStack,
        color: palette.white,
      }}
    >
      <Sequence from={0} durationInFrames={120}>
        <Intro {...props} />
      </Sequence>
      <Sequence from={120} durationInFrames={420}>
        <Bullets {...props} />
      </Sequence>
      <Sequence from={540} durationInFrames={360}>
        <Outro {...props} />
      </Sequence>
    </AbsoluteFill>
  );
};

const Intro: React.FC<MarketSpotlightProps> = ({ marketCountry, marketFlag, brandName, language, accentColor }) => {
  const fadeFlag = useSpringIn(5);
  const fadeText = useFadeIn(30, 30);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div style={{ fontSize: 320, transform: `scale(${0.6 + fadeFlag * 0.4})`, opacity: fadeFlag }}>
        {marketFlag}
      </div>
      <div style={{ opacity: fadeText, textAlign: "center" }}>
        <p style={{ fontSize: 28, opacity: 0.7, letterSpacing: 4, textTransform: "uppercase", margin: 0 }}>
          {brandName} · {language}
        </p>
        <h1 style={{ fontSize: 110, fontWeight: 700, margin: "16px 0 0", color: accentColor }}>
          {marketCountry}
        </h1>
      </div>
    </AbsoluteFill>
  );
};

const Bullets: React.FC<MarketSpotlightProps> = ({ hook, bullets, accentColor }) => {
  const fadeHook = useFadeIn(0, 25);
  return (
    <AbsoluteFill style={{ padding: 120, display: "flex", flexDirection: "column", justifyContent: "center", gap: 48 }}>
      <h2
        style={{
          fontSize: 84,
          fontWeight: 700,
          lineHeight: 1.15,
          margin: 0,
          opacity: fadeHook,
          transform: `translateY(${(1 - fadeHook) * 30}px)`,
        }}
      >
        {hook}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {bullets.map((b, i) => (
          <BulletRow key={i} text={b} delay={40 + i * 30} accentColor={accentColor} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const BulletRow: React.FC<{ text: string; delay: number; accentColor: string }> = ({ text, delay, accentColor }) => {
  const slide = useSpringIn(delay);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        transform: `translateX(${(1 - slide) * -60}px)`,
        opacity: slide,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          background: accentColor,
          flexShrink: 0,
        }}
      />
      <p style={{ fontSize: 44, margin: 0, opacity: 0.95 }}>{text}</p>
    </div>
  );
};

const Outro: React.FC<MarketSpotlightProps> = ({ cta, marketplaces, accentColor, productName }) => {
  const fadeCta = useFadeIn(20, 30);
  const fadeMp = useFadeIn(80, 30);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 48, textAlign: "center" }}>
      <p style={{ fontSize: 40, opacity: 0.7, margin: 0 }}>{productName}</p>
      <h1
        style={{
          fontSize: 120,
          fontWeight: 700,
          margin: 0,
          color: accentColor,
          opacity: fadeCta,
          transform: `scale(${0.85 + fadeCta * 0.15})`,
        }}
      >
        {cta}
      </h1>
      <div style={{ display: "flex", gap: 24, opacity: fadeMp }}>
        {marketplaces.map((m) => (
          <span
            key={m}
            style={{
              padding: "16px 32px",
              borderRadius: 999,
              border: "2px solid rgba(255,255,255,0.4)",
              fontSize: 32,
            }}
          >
            {m}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
