import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { z } from "zod";
import { fontStack, palette, useFadeIn, useSpringIn } from "../lib/style";

export const productHeroSchema = z.object({
  brandName: z.string(),
  productName: z.string(),
  hook: z.string(),
  cta: z.string(),
  language: z.string(),
  productImageUrl: z.string().url().optional(),
  accentColor: z.string().default(palette.emerald),
});

export type ProductHeroProps = z.infer<typeof productHeroSchema>;

export const productHeroDefaults: ProductHeroProps = {
  brandName: "Markanız",
  productName: "Ürün",
  hook: "Yurtdışında parlamaya hazır.",
  cta: "Şimdi keşfet",
  language: "TR",
  productImageUrl:
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80",
  accentColor: palette.emerald,
};

export const ProductHero: React.FC<ProductHeroProps> = ({
  brandName,
  productName,
  hook,
  cta,
  language,
  productImageUrl,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const fadeBrand = useFadeIn(10, 20);
  const springTitle = useSpringIn(40);
  const fadeHook = useFadeIn(80, 25);
  const fadeCta = useFadeIn(180, 25);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${palette.slate900} 0%, #1e293b 100%)`,
        fontFamily: fontStack,
        color: palette.white,
      }}
    >
      {productImageUrl && (
        <AbsoluteFill style={{ opacity: 0.18 }}>
          <Img
            src={productImageUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(8px)",
            }}
          />
        </AbsoluteFill>
      )}

      <AbsoluteFill
        style={{
          padding: 120,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 32,
        }}
      >
        <div
          style={{
            opacity: fadeBrand,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: accentColor,
            }}
          />
          <span
            style={{
              fontSize: 28,
              letterSpacing: 4,
              opacity: 0.85,
              textTransform: "uppercase",
            }}
          >
            {brandName} · {language}
          </span>
        </div>

        <h1
          style={{
            fontSize: 140,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -2,
            transform: `translateY(${(1 - springTitle) * 60}px)`,
            opacity: springTitle,
            margin: 0,
          }}
        >
          {productName}
        </h1>

        <p
          style={{
            fontSize: 56,
            opacity: fadeHook * 0.92,
            maxWidth: 1400,
            lineHeight: 1.25,
            margin: 0,
          }}
        >
          {hook}
        </p>

        <div
          style={{
            opacity: fadeCta,
            transform: `translateY(${(1 - fadeCta) * 20}px)`,
            display: "inline-flex",
            alignSelf: "flex-start",
            background: accentColor,
            color: palette.slate900,
            padding: "24px 48px",
            borderRadius: 999,
            fontSize: 36,
            fontWeight: 600,
            marginTop: 24,
          }}
        >
          {cta} →
        </div>
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 60,
          fontSize: 20,
          opacity: 0.4 + 0.3 * Math.sin(frame / 12),
        }}
      >
        globalnest.app
      </div>
    </AbsoluteFill>
  );
};
