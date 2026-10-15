import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { getCropGeometry } from "../domain/crop";
import type { PhotoPlacement } from "../domain/types";

interface Size {
  width: number;
  height: number;
}
interface PointerCoord {
  clientX: number;
  clientY: number;
}
interface DragStart {
  clientX: number;
  clientY: number;
  x: number;
  y: number;
}
interface PinchStart {
  dist: number;
  zoom: number;
  midX: number;
  midY: number;
  x: number;
  y: number;
}

export function CroppedPhoto({
  src,
  placement,
  alt,
  onPan,
  onZoom,
  showGrid = false,
}: {
  src?: string;
  placement: PhotoPlacement;
  alt: string;
  onPan?: (x: number, y: number) => void;
  onZoom?: (zoom: number) => void;
  showGrid?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef<Map<number, PointerCoord>>(new Map());
  const dragRef = useRef<DragStart | null>(null);
  const pinchRef = useRef<PinchStart | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
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

  // Track wheel zoom for desktop/trackpad pinch
  useEffect(() => {
    const element = frameRef.current;
    if (!element || !onZoom) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.005;
      const newZoom = Math.max(
        1,
        Math.min(2.4, Number((placement.zoom + delta).toFixed(2))),
      );
      onZoom(newZoom);
    };
    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, [onZoom, placement.zoom]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!onPan && !onZoom) return;
    if (!geometry) return;

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Ignore if pointer capture fails
    }

    pointersRef.current.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });
    setIsInteracting(true);

    if (pointersRef.current.size === 1) {
      dragRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
        x: placement.x,
        y: placement.y,
      };
      pinchRef.current = null;
    } else if (pointersRef.current.size === 2) {
      const [p1, p2] = Array.from(pointersRef.current.values());
      const dist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
      const midX = (p1.clientX + p2.clientX) / 2;
      const midY = (p1.clientY + p2.clientY) / 2;
      pinchRef.current = {
        dist: Math.max(dist, 1),
        zoom: placement.zoom,
        midX,
        midY,
        x: placement.x,
        y: placement.y,
      };
      dragRef.current = null;
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!geometry) return;
    if (!pointersRef.current.has(event.pointerId)) return;

    pointersRef.current.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const [p1, p2] = Array.from(pointersRef.current.values());
      const currentDist = Math.hypot(
        p1.clientX - p2.clientX,
        p1.clientY - p2.clientY,
      );
      const scale = currentDist / pinchRef.current.dist;
      const newZoom = Math.max(
        1,
        Math.min(2.4, Number((pinchRef.current.zoom * scale).toFixed(2))),
      );
      if (onZoom && newZoom !== placement.zoom) {
        onZoom(newZoom);
      }

      if (onPan) {
        const currentMidX = (p1.clientX + p2.clientX) / 2;
        const currentMidY = (p1.clientY + p2.clientY) / 2;
        const deltaX = geometry.maxPanX
          ? (currentMidX - pinchRef.current.midX) / geometry.maxPanX
          : 0;
        const deltaY = geometry.maxPanY
          ? (currentMidY - pinchRef.current.midY) / geometry.maxPanY
          : 0;
        const x = Math.max(-1, Math.min(1, pinchRef.current.x + deltaX));
        const y = Math.max(-1, Math.min(1, pinchRef.current.y + deltaY));
        onPan(x, y);
      }
    } else if (pointersRef.current.size === 1 && dragRef.current && onPan) {
      const start = dragRef.current;
      const x = geometry.maxPanX
        ? start.x + (event.clientX - start.clientX) / geometry.maxPanX
        : start.x;
      const y = geometry.maxPanY
        ? start.y + (event.clientY - start.clientY) / geometry.maxPanY
        : start.y;
      onPan(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
    }
  };

  const endPointer = (event: PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore
    }

    if (pointersRef.current.size === 1) {
      const remaining = Array.from(pointersRef.current.values())[0];
      dragRef.current = {
        clientX: remaining.clientX,
        clientY: remaining.clientY,
        x: placement.x,
        y: placement.y,
      };
      pinchRef.current = null;
    } else if (pointersRef.current.size === 0) {
      dragRef.current = null;
      pinchRef.current = null;
      setIsInteracting(false);
    }
  };

  const isEditable = Boolean(onPan || onZoom);

  return (
    <div
      ref={frameRef}
      className={`crop-view ${isEditable ? "editable" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
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
      {showGrid && (
        <div
          className={`crop-grid-overlay ${isInteracting ? "active" : ""}`}
          aria-hidden="true"
        >
          <div className="crop-grid-line h1" />
          <div className="crop-grid-line h2" />
          <div className="crop-grid-line v1" />
          <div className="crop-grid-line v2" />
          <div className="crop-grid-corner top-left" />
          <div className="crop-grid-corner top-right" />
          <div className="crop-grid-corner bottom-left" />
          <div className="crop-grid-corner bottom-right" />
        </div>
      )}
    </div>
  );
}
