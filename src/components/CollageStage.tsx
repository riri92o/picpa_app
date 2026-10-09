import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { CollageSpacing, GridCount } from "../domain/types";
import { gridDimensions } from "../domain/image";

// Fit the original tile proportions into the available screen space.
export function CollageStage({
  count,
  spacing,
  inactive,
  children,
}: {
  count: GridCount;
  spacing?: CollageSpacing;
  inactive: boolean;
  children: ReactNode;
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
      const byHeight =
        cols *
          (((bounds.height - 1 - padding - gap * (rows - 1)) * tileRatio) /
            rows) +
        gap * (cols - 1) +
        padding;
      setWidth(Math.max(0, Math.min(bounds.width, byHeight)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [count, spacing]);
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
