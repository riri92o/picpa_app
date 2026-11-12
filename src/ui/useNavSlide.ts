import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from "react";
import { navSlideIntent, navSlidePosition } from "./navSlide";

interface Gesture {
  id: number;
  x: number;
  y: number;
  left: number;
  width: number;
  offset: number;
  active: boolean;
}

export function useNavSlide({
  nav,
  index,
  disabled,
  layoutKey,
  onSelect,
}: {
  nav: RefObject<HTMLElement | null>;
  index: number;
  disabled: boolean;
  layoutKey: string;
  onSelect: (index: number) => void;
}) {
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const [position, setPosition] = useState<number | null>(null);
  const release = useCallback(() => {
    const current = gesture.current;
    gesture.current = null;
    if (current && nav.current?.hasPointerCapture(current.id))
      nav.current.releasePointerCapture(current.id);
  }, [nav]);
  const cancel = useCallback(() => {
    release();
    setPosition(null);
  }, [release]);
  useLayoutEffect(cancel, [cancel, index, disabled, layoutKey]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) cancel();
    };
    const outsideRelease = (event: globalThis.PointerEvent) => {
      if (
        gesture.current?.id === event.pointerId &&
        event.target instanceof Node &&
        !nav.current?.contains(event.target)
      )
        cancel();
    };
    const additionalPointer = (event: globalThis.PointerEvent) => {
      if (gesture.current && gesture.current.id !== event.pointerId) {
        suppressClick.current = true;
        cancel();
      }
    };
    window.addEventListener("blur", cancel);
    window.addEventListener("resize", cancel);
    window.addEventListener("pointerup", outsideRelease, true);
    window.addEventListener("pointercancel", outsideRelease, true);
    window.addEventListener("pointerdown", additionalPointer, true);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("blur", cancel);
      window.removeEventListener("resize", cancel);
      window.removeEventListener("pointerup", outsideRelease, true);
      window.removeEventListener("pointercancel", outsideRelease, true);
      window.removeEventListener("pointerdown", additionalPointer, true);
      document.removeEventListener("visibilitychange", hidden);
      release();
    };
  }, [cancel, nav, release]);
  return {
    position,
    handlers: {
      onPointerDown(event: PointerEvent<HTMLElement>) {
        if (gesture.current) {
          suppressClick.current = true;
          cancel();
          return;
        }
        if (disabled || !event.isPrimary || event.button !== 0) return;
        suppressClick.current = false;
        const box = event.currentTarget.getBoundingClientRect();
        if (!box.width) return;
        const center = box.left + (box.width * (index + 0.5)) / 3;
        const radius =
          (parseFloat(
            getComputedStyle(event.currentTarget).getPropertyValue(
              "--nav-bubble-size",
            ),
          ) || 56) / 2;
        const offset = event.clientX - center;
        gesture.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          left: box.left,
          width: box.width,
          offset: Math.abs(offset) <= radius ? offset : 0,
          active: false,
        };
      },
      onPointerMove(event: PointerEvent<HTMLElement>) {
        const current = gesture.current;
        if (!current || current.id !== event.pointerId || disabled) return;
        if (!current.active) {
          const intent = navSlideIntent(
            event.clientX - current.x,
            event.clientY - current.y,
          );
          if (intent === "pending") return;
          suppressClick.current = true;
          if (intent === "vertical") {
            cancel();
            return;
          }
          current.active = true;
          // Capture only after a drag is recognized, preserving ordinary taps.
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        setPosition(
          navSlidePosition(
            event.clientX,
            current.left,
            current.width,
            current.offset,
          ),
        );
      },
      onPointerUp(event: PointerEvent<HTMLElement>) {
        const current = gesture.current;
        if (!current || current.id !== event.pointerId) return;
        const next = Math.round(
          navSlidePosition(
            event.clientX,
            current.left,
            current.width,
            current.offset,
          ),
        );
        const commit = current.active && !disabled;
        cancel();
        if (commit && next !== index) onSelect(next);
      },
      onPointerCancel(event: PointerEvent<HTMLElement>) {
        if (gesture.current?.id === event.pointerId) cancel();
      },
      onLostPointerCapture(event: PointerEvent<HTMLElement>) {
        // Transferring implicit touch capture from a button to nav is expected.
        if (
          event.target === event.currentTarget &&
          gesture.current?.id === event.pointerId
        )
          cancel();
      },
      onClickCapture(event: MouseEvent<HTMLElement>) {
        if (suppressClick.current && event.detail > 0) {
          suppressClick.current = false;
          event.preventDefault();
          event.stopPropagation();
        }
      },
    },
  };
}
