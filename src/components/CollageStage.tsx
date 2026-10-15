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
  const [width, setWidth] = useState<number>();
  const layout = collageLayout(count, spacing);
  const frameWidth = layout.width + COLLAGE_EDGE * 2;
  const frameHeight = layout.height + COLLAGE_EDGE * 2;
  const scale = width === undefined ? undefined : width / frameWidth;
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const bounds = element.getBoundingClientRect();
      const byHeight =
        (Math.max(0, bounds.height - 1) * frameWidth) / frameHeight;
      setWidth(Math.max(0, Math.min(bounds.width, byHeight)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [frameWidth, frameHeight]);
  return (
    <div ref={ref} className="collage-stage">
      <div
        className={`collage-frame ${inactive ? "inactive" : ""}`}
        style={
          {
            width,
            padding: scale === undefined ? undefined : COLLAGE_EDGE * scale,
            "--collage-grid-gap":
              scale === undefined ? undefined : `${layout.gap * scale}px`,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
}
