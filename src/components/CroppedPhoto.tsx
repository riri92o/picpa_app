import { useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { getCropGeometry } from "../domain/crop";
import type { PhotoPlacement } from "../domain/types";

interface Size {
  width: number;
  height: number;
}
interface DragStart {
  pointerId: number;
  clientX: number;
  clientY: number;
  x: number;
  y: number;
}

export function CroppedPhoto({
  src,
  placement,
  alt,
  onPan,
}: {
  src?: string;
  placement: PhotoPlacement;
  alt: string;
  onPan?: (x: number, y: number) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragStart | null>(null);
  const [frame, setFrame] = useState<Size>({ width: 0, height: 0 });
  const [source, setSource] = useState<Size>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const measure = () =>
      setFrame({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const geometry =
    frame.width && frame.height && source.width && source.height
      ? getCropGeometry(
          frame.width,
          frame.height,
          source.width,
          source.height,
          placement,
        )
      : null;
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!onPan || !geometry) return;
    dragRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      x: placement.x,
      y: placement.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragRef.current;
    if (!start || start.pointerId !== event.pointerId || !onPan || !geometry)
      return;
    const x = geometry.maxPanX
      ? start.x + (event.clientX - start.clientX) / geometry.maxPanX
      : start.x;
    const y = geometry.maxPanY
      ? start.y + (event.clientY - start.clientY) / geometry.maxPanY
      : start.y;
    onPan(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
  };
  const endDrag = () => {
    dragRef.current = null;
  };

  return (
    <div
      ref={frameRef}
      className={`crop-view ${onPan ? "editable" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {src && (
        <img
          src={src}
          alt={alt}
          draggable={false}
          onLoad={(event) =>
            setSource({
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            })
          }
          style={
            geometry
              ? {
                  width: geometry.imageWidth,
                  height: geometry.imageHeight,
                  left: `calc(50% + ${geometry.panX}px)`,
                  top: `calc(50% + ${geometry.panY}px)`,
                  transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
