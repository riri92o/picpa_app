import { MEMBRANE_DROPLETS, membranePoint } from "./drawMembrane";

export interface ViewportMetrics {
  iosStandalone: boolean;
  safeTop: number;
  screenHeight: number;
  viewportHeight: number;
  portrait: boolean;
  scale: number;
}

/** CSS describes the canvas we can paint. innerHeight may omit an iOS system
 * inset, so it is only a fallback when the CSS measurement is unavailable. */
export function layoutViewportHeight(innerHeight: number, cssHeight: number) {
  return Number.isFinite(cssHeight) && cssHeight > 0 ? cssHeight : innerHeight;
}

/** Keyboard-visible area in layout coordinates. Page zoom keeps its normal
 * layout instead of shrinking the app a second time. */
export function visibleViewportFrame(
  layoutHeight: number,
  visual?: { height: number; offsetTop: number; scale: number },
) {
  if (
    !visual ||
    Math.abs(visual.scale - 1) > 0.01 ||
    !Number.isFinite(visual.height) ||
    visual.height <= 0
  )
    return { height: layoutHeight, top: 0 };
  const height = Math.min(layoutHeight, visual.height);
  const top = Number.isFinite(visual.offsetTop)
    ? Math.max(0, Math.min(layoutHeight - height, visual.offsetTop))
    : 0;
  return { height, top };
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
  phase = 0,
): BubbleOrigin[] {
  return MEMBRANE_DROPLETS.map(({ angle, radius, color }) => {
    const point = membranePoint(angle, phase);
    const r = box.size * radius;
    return {
      x: Math.max(
        r + 12,
        Math.min(box.width - r - 12, box.x + (box.size * point.x) / 100),
      ),
      y: Math.max(
        systemInset ? r * 1.12 + 20 : r + 12,
        Math.min(box.height - r - 12, box.y + (box.size * point.y) / 100),
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
