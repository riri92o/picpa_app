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
