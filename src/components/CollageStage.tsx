import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { CollageSpacing, GridCount } from "../domain/types";
import { gridDimensions } from "../domain/image";

// Fit the original tile proportions into the available screen space.
export function CollageStage({
  count,
  spacing,
  inactive,
  children,
  headerRatio = 0,
}: {
  count: GridCount;
  spacing?: CollageSpacing;
  inactive: boolean;
  children: ReactNode;
  headerRatio?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const [cols, rows] = gridDimensions(count);
    const tileRatio = count === 4 ? 1.12 : count === 9 ? 1 : 1.25;
    const gap = spacing === "joined" ? 0 : 4,
      padding = 8;
    const measure = () => {
      const bounds = element.getBoundingClientRect();
      const photoWidth =
        cols *
          (((bounds.height - 1 - padding - gap * (rows - 1)) * tileRatio) /
            rows) +
        gap * (cols - 1) +
        padding;
      const byHeight =
        headerRatio > 0
          ? (bounds.height -
              1 -
              padding -
              gap * (rows - 1) +
              (rows * gap * (cols - 1)) / (cols * tileRatio)) /
              (rows / (cols * tileRatio) + headerRatio) +
            padding
          : photoWidth;
      setWidth(Math.max(0, Math.min(bounds.width, byHeight)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [count, spacing, headerRatio]);
  return (
    <div ref={ref} className="collage-stage">
      <div
        className={`collage-frame ${inactive ? "inactive" : ""}`}
        style={{ width }}
      >
        {children}
      </div>
    </div>
  );
}
