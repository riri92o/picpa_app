import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { CollageSpacing, GridCount } from "../domain/types";
import { COLLAGE_EDGE, collageLayout } from "../domain/collageLayout";

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
  const [frame, setFrame] = useState<{
    width: number;
    padding: number;
    gap: number;
  }>();
  const layout = collageLayout(count, spacing);
  const frameWidth = layout.width + COLLAGE_EDGE * 2;
  const frameHeight = layout.height + COLLAGE_EDGE * 2;
  const widthWithoutGaps = layout.columns * layout.cellWidth + COLLAGE_EDGE * 2;
  const heightWithoutGaps = layout.rows * layout.cellHeight + COLLAGE_EDGE * 2;
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const bounds = element.getBoundingClientRect();
      const height = Math.max(0, bounds.height - 1);
      let scale = Math.max(
        0,
        Math.min(bounds.width / frameWidth, height / frameHeight),
      );
      // A scaled export gap can disappear on short screens. Reserve a minimum
      // visible gap, then refit the photos without changing their proportions.
      const gap = layout.gap ? Math.max(6, layout.gap * scale) : 0;
      scale = Math.max(
        0,
        Math.min(
          (bounds.width - gap * (layout.columns - 1)) / widthWithoutGaps,
          (height - gap * (layout.rows - 1)) / heightWithoutGaps,
        ),
      );
      setFrame({
        width: widthWithoutGaps * scale + gap * (layout.columns - 1),
        padding: COLLAGE_EDGE * scale,
        gap,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [
    frameWidth,
    frameHeight,
    widthWithoutGaps,
    heightWithoutGaps,
    layout.columns,
    layout.rows,
    layout.gap,
  ]);
  return (
    <div ref={ref} className="collage-stage">
      <div
        className={`collage-frame ${inactive ? "inactive" : ""}`}
        style={
          {
            width: frame?.width,
            padding: frame?.padding,
            "--collage-grid-gap":
              frame === undefined ? undefined : `${frame.gap}px`,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
}
