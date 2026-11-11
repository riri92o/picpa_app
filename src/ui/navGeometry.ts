/** One closed, gently waved membrane. Every tab has the same Bezier topology
 * so the existing Motion transition can move the cavity with the bubble. */
export function floatingNavGeometry(
  width: number,
  height: number,
  bubbleSize: number,
  raise: number,
  index: number,
) {
  const center = (width * (index + 0.5)) / 3;
  const cy = bubbleSize / 2 - raise;
  const radius = bubbleSize / 2 + 6;
  const bridge = Math.min(7, Math.max(1, width / 6 - radius - 3));
  const left = center - radius - bridge;
  const right = center + radius + bridge;
  const cornerLeft = Math.min(height * 0.42, left / 2);
  const cornerRight = Math.min(height * 0.42, (width - right) / 2);
  const dl = left - cornerLeft;
  const dr = width - cornerRight - right;
  const al = Math.min(3.5, dl * 0.045);
  const ar = Math.min(3, dr * 0.045);
  const top = height * 0.15625;
  const bottom = height - 3;
  const k = 0.55228475;
  const n = (value: number) => Math.round(value * 1000) / 1000;
  const commands: (string | number)[][] = [
    ["M", 1, height * 0.51],
    ["C", 1, height * 0.29, cornerLeft * 0.3, top, cornerLeft, top],
    [
      "C",
      cornerLeft + dl / 6,
      top,
      cornerLeft + dl / 3,
      top - al,
      cornerLeft + dl / 2,
      top - al,
    ],
    [
      "C",
      cornerLeft + (dl * 2) / 3,
      top - al,
      cornerLeft + (dl * 5) / 6,
      top,
      left,
      top,
    ],
    [
      "C",
      left + bridge * 0.6,
      top,
      center - radius,
      cy - 2,
      center - radius,
      cy,
    ],
    [
      "C",
      center - radius,
      cy + radius * k,
      center - radius * k,
      cy + radius,
      center,
      cy + radius,
    ],
    [
      "C",
      center + radius * k,
      cy + radius,
      center + radius,
      cy + radius * k,
      center + radius,
      cy,
    ],
    ["C", center + radius, cy - 2, right - bridge * 0.6, top, right, top],
    [
      "C",
      right + dr / 6,
      top,
      right + dr / 3,
      top + ar,
      right + dr / 2,
      top + ar,
    ],
    [
      "C",
      right + (dr * 2) / 3,
      top + ar,
      right + (dr * 5) / 6,
      top,
      width - cornerRight,
      top,
    ],
    [
      "C",
      width - cornerRight * 0.3,
      top,
      width - 1,
      height * 0.29,
      width - 1,
      height * 0.52,
    ],
    ["C", width - 1, height * 0.78, width - 10, bottom - 1, width - 25, bottom],
    [
      "C",
      width * 0.73,
      bottom + 2,
      width * 0.6,
      bottom - 4,
      width * 0.49,
      bottom - 3,
    ],
    ["C", width * 0.32, bottom - 3, width * 0.18, bottom + 2, 25, bottom],
    ["C", 10, bottom - 1, 1, height * 0.8, 1, height * 0.51],
    ["Z"],
  ];
  return {
    path: commands
      .map((command) =>
        command
          .map((value) => (typeof value === "number" ? n(value) : value))
          .join(" "),
      )
      .join(" "),
    center,
    cy,
    radius,
    left,
    right,
  };
}
