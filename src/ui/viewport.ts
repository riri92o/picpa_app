export interface ViewportMetrics {
  iosStandalone: boolean;
  safeTop: number;
  screenHeight: number;
  viewportHeight: number;
  portrait: boolean;
  scale: number;
}

/** Some iOS Home Screen versions reserve a native status-bar rectangle while
 * reporting a zero top inset. No DOM layer can paint into that rectangle. */
export function hasSystemStatusBarInset(metrics: ViewportMetrics): boolean {
  const gap = metrics.screenHeight - metrics.viewportHeight;
  return (
    metrics.iosStandalone &&
    metrics.portrait &&
    metrics.safeTop < 0.5 &&
    Math.abs(metrics.scale - 1) < 0.01 &&
    gap >= 18 &&
    gap <= 120
  );
}

interface FloatingBubble {
  x: number;
  y: number;
  r: number;
  dy: number;
}

export interface BubbleOrigin {
  x: number;
  y: number;
  r: number;
  color?: string;
}

/** The same ten sources feed the existing spring/whirl renderer. Five are colored
 * companions; five small neutral bubbles retain the original solver's topology. */
export function drawBubbleOrigins(
  box: { width: number; height: number; x: number; y: number; size: number },
  systemInset = false,
): BubbleOrigin[] {
  const companions = [
    [-0.72, -0.64, 0.2, "#e5a4d5"],
    [0.65, -0.68, 0.18, "#ebc1a0"],
    [0.94, 0.02, 0.18, "#eddb89"],
    [-0.79, 0.59, 0.22, "#94d9c8"],
    [0.63, 0.7, 0.21, "#b3a0e0"],
    [-1.03, -0.24, 0.045],
    [0.95, -0.4, 0.04],
    [-0.24, 0.94, 0.035],
    [0.21, -0.95, 0.04],
    [0.98, 0.65, 0.04],
  ] as const;
  return companions.map(([dx, dy, radius, color]) => {
    const r = box.size * radius;
    return {
      x: Math.max(r + 12, Math.min(box.width - r - 12, box.x + box.size * dx)),
      y: Math.max(
        systemInset ? r * 1.12 + 20 : r + 12,
        Math.min(box.height - r - 12, box.y + box.size * dy),
      ),
      r,
      color,
    };
  });
}

/** Shared by the resting SVG and gathering canvas so a fallback placement does
 * not jump when mixing starts. Leave room for contour deformation and float. */
export function floatingBubblePosition(
  bubble: FloatingBubble,
  width: number,
  height: number,
  systemInset = false,
) {
  return {
    x: width * bubble.x,
    y: systemInset
      ? Math.max(height * bubble.y, bubble.r * 1.12 + Math.abs(bubble.dy) + 12)
      : height * bubble.y,
  };
}
