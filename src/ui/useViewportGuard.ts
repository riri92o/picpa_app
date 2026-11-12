import { useLayoutEffect, useRef, useState } from "react";
import {
  hasSystemStatusBarInset,
  layoutViewportHeight,
  visibleViewportFrame,
} from "./viewport";

/** Read actual browser geometry, rather than guessing an iPhone's notch size. */
export function useViewportGuard(ready: boolean) {
  const probeRef = useRef<HTMLSpanElement>(null);
  const viewportRef = useRef<HTMLSpanElement>(null);
  const [systemInset, setSystemInset] = useState(false);
  useLayoutEffect(() => {
    const probe = probeRef.current;
    const viewport = viewportRef.current;
    if (!ready || !probe || !viewport) return;
    const standalone = window.matchMedia("(display-mode: standalone)");
    const ios =
      /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const measure = () => {
      const appHeight = layoutViewportHeight(
        window.innerHeight,
        viewport.getBoundingClientRect().height,
      );
      const visual = visibleViewportFrame(
        appHeight,
        window.visualViewport ?? undefined,
      );
      const safeTop = parseFloat(getComputedStyle(probe).height) || 0;
      const values = {
        "--app-height": `${appHeight}px`,
        "--visible-height": `${visual.height}px`,
        "--visible-top": `${visual.top}px`,
      };
      const root = document.documentElement;
      for (const [name, value] of Object.entries(values))
        if (root.style.getPropertyValue(name) !== value)
          root.style.setProperty(name, value);
      setSystemInset(
        hasSystemStatusBarInset({
          iosStandalone:
            ios &&
            (standalone.matches ||
              (navigator as Navigator & { standalone?: boolean }).standalone ===
                true),
          safeTop,
          screenHeight: window.screen.height,
          viewportHeight: appHeight,
          portrait: appHeight >= window.innerWidth,
          scale: window.visualViewport?.scale ?? 1,
        }),
      );
    };
    measure();
    let frame = 0;
    let settled = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };
    const resume = () => {
      schedule();
      window.clearTimeout(settled);
      // iOS can finish restoring viewport geometry after pageshow itself.
      settled = window.setTimeout(schedule, 350);
    };
    const onVisibility = () => {
      if (!document.hidden) resume();
      else window.clearTimeout(settled);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(probe);
    observer.observe(viewport);
    window.addEventListener("resize", schedule);
    window.addEventListener("pageshow", resume);
    window.addEventListener("orientationchange", resume);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule, {
      passive: true,
    });
    document.addEventListener("visibilitychange", onVisibility);
    standalone.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settled);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pageshow", resume);
      window.removeEventListener("orientationchange", resume);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
      document.removeEventListener("visibilitychange", onVisibility);
      standalone.removeEventListener("change", schedule);
    };
  }, [ready]);
  return { probeRef, viewportRef, systemInset };
}
