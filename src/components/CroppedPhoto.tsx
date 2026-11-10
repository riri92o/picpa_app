import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { getCropGeometry } from "../domain/crop";
import {
  beginCropGesture,
  moveCropGesture,
  MIN_CROP_ZOOM,
  MAX_CROP_ZOOM,
  type CropPoint,
} from "../domain/cropGesture";
import type { PhotoPlacement } from "../domain/types";

interface Size {
  width: number;
  height: number;
}
export function CroppedPhoto({
  src,
  placement,
  alt,
  onTransform,
}: {
  src?: string;
  placement: PhotoPlacement;
  alt: string;
  onTransform?: (patch: Pick<PhotoPlacement, "zoom" | "x" | "y">) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, CropPoint>());
  const gesture = useRef<ReturnType<typeof beginCropGesture>>(null);
  const currentPlacement = useRef(placement);
  currentPlacement.current = placement;
  const editable = !!onTransform;
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

  useLayoutEffect(() => {
    if (!editable) return;
    const element = frameRef.current;
    const cancel = () => {
      const ids = [...pointers.current.keys()];
      pointers.current.clear();
      gesture.current = null;
      for (const id of ids)
        if (element?.hasPointerCapture(id)) element.releasePointerCapture(id);
    };
    const onVisibility = () => {
      if (document.hidden) cancel();
    };
    cancel();
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancel();
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [
    editable,
    placement.id,
    placement.rotation,
    src,
    frame.width,
    frame.height,
    source.width,
    source.height,
  ]);

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
    if (
      !onTransform ||
      !geometry ||
      pointers.current.size >= 2 ||
      event.button !== 0
    )
      return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    pointers.current.set(event.pointerId, {
      x: event.clientX - rect.left - rect.width / 2,
      y: event.clientY - rect.top - rect.height / 2,
    });
    gesture.current = beginCropGesture(currentPlacement.current, [
      ...pointers.current.values(),
    ]);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (
      !pointers.current.has(event.pointerId) ||
      !gesture.current ||
      !onTransform ||
      !geometry
    )
      return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    pointers.current.set(event.pointerId, {
      x: event.clientX - rect.left - rect.width / 2,
      y: event.clientY - rect.top - rect.height / 2,
    });
    const patch = moveCropGesture(
      gesture.current,
      [...pointers.current.values()],
      frame,
      source,
    );
    currentPlacement.current = { ...currentPlacement.current, ...patch };
    onTransform(patch);
  };
  const endGesture = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(event.pointerId)) return;
    // Rebase on every finger change so lifting one finger never jumps the crop.
    gesture.current = beginCropGesture(currentPlacement.current, [
      ...pointers.current.values(),
    ]);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      !onTransform ||
      !geometry ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    const step = event.shiftKey ? 30 : 10;
    const moves: Record<string, CropPoint> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    let patch: Pick<PhotoPlacement, "zoom" | "x" | "y">;
    if (moves[event.key]) {
      const start = beginCropGesture(currentPlacement.current, [
        { x: 0, y: 0 },
      ])!;
      patch = moveCropGesture(start, [moves[event.key]], frame, source);
    } else if (["+", "=", "-", "_"].includes(event.key)) {
      const current = currentPlacement.current;
      patch = {
        x: current.x,
        y: current.y,
        zoom: Math.max(
          MIN_CROP_ZOOM,
          Math.min(
            MAX_CROP_ZOOM,
            current.zoom + (["-", "_"].includes(event.key) ? -0.1 : 0.1),
          ),
        ),
      };
    } else return;
    event.preventDefault();
    currentPlacement.current = { ...currentPlacement.current, ...patch };
    onTransform(patch);
  };

  return (
    <div
      ref={frameRef}
      className={`crop-view ${onTransform ? "editable" : ""}`}
      tabIndex={onTransform ? 0 : undefined}
      role={onTransform ? "group" : undefined}
      aria-label={onTransform ? "写真の位置と大きさを調整" : undefined}
      title={onTransform ? "矢印キーで移動、＋・−キーで拡大縮小" : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onLostPointerCapture={endGesture}
      onKeyDown={handleKeyDown}
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
