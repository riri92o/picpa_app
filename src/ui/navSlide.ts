/** The three tab centers occupy the middle of each third of the bar. */
export function navSlidePosition(
  clientX: number,
  left: number,
  width: number,
  grabOffset = 0,
) {
  if (width <= 0) return 0;
  return Math.max(
    0,
    Math.min(2, ((clientX - left - grabOffset) / width) * 3 - 0.5),
  );
}

export function navSlideIntent(dx: number, dy: number) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 10) return "pending";
  return Math.abs(dx) > Math.abs(dy) * 1.2 ? "horizontal" : "vertical";
}
