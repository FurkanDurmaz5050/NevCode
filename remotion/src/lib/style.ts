// Paylaşılan stil ve animasyon yardımcıları.
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const palette = {
  emerald: "#10b981",
  teal: "#14b8a6",
  slate900: "#0f172a",
  slate500: "#64748b",
  white: "#ffffff",
  violet: "#8b5cf6",
};

export const fontStack =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export function useFadeIn(startFrame: number, durationFrames = 20) {
  const frame = useCurrentFrame();
  return interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
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
