// Paylaşılan stil ve animasyon yardımcıları.
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const palette = {
  emerald: "#10b981",
  teal: "#14b8a6",
  slate900: "#0f172a",
  slate500: "#64748b",
  white: "#ffffff",
  violet: "#8b5cf6",
  rose: "#fb7185",
  amber: "#f59e0b",
};

export const fontStack =
  "'SF Pro Display', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";

export const monoStack =
  "'SF Mono', 'JetBrains Mono', 'Menlo', ui-monospace, monospace";

export function useFadeIn(startFrame: number, durationFrames = 20) {
  const frame = useCurrentFrame();
  return interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
}

export function useFadeInOut(
  inFrame: number,
  inDur: number,
  outFrame: number,
  outDur: number,
) {
  const frame = useCurrentFrame();
  const inV = interpolate(frame, [inFrame, inFrame + inDur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outV = interpolate(frame, [outFrame, outFrame + outDur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return Math.min(inV, outV);
}

export function useSpringIn(startFrame: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 200 },
  });
}

export function useSoftSpring(startFrame: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 14, mass: 0.6, stiffness: 90 },
  });
}

export function useParallax(
  startFrame: number,
  durationFrames: number,
  fromY = 0,
  toY = -40,
) {
  const frame = useCurrentFrame();
  return interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [fromY, toY],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    },
  );
}

export function usePulse(startFrame: number, periodFrames = 60) {
  const frame = useCurrentFrame();
  const t = Math.max(0, frame - startFrame);
  return 0.5 + 0.5 * Math.sin((t / periodFrames) * Math.PI * 2);
}

export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const CinematicBackground: React.FC<{
  from: string;
  to: string;
  accent: string;
  secondary?: string;
}> = ({ from, to, accent, secondary }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const x1 = 30 + Math.sin(t * 0.6) * 10;
  const y1 = 25 + Math.cos(t * 0.5) * 8;
  const x2 = 70 + Math.cos(t * 0.4) * 10;
  const y2 = 75 + Math.sin(t * 0.7) * 8;
  const sec = secondary ?? accent;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(60% 50% at ${x1}% ${y1}%, ${withAlpha(
          accent,
          0.35,
        )} 0%, transparent 60%), radial-gradient(55% 45% at ${x2}% ${y2}%, ${withAlpha(
          sec,
          0.28,
        )} 0%, transparent 60%), linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.06,
          mixBlendMode: "overlay",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>\")",
          backgroundSize: "240px 240px",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 90% at 50% 50%, transparent 50%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
};
