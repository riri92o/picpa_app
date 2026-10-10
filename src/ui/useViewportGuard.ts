import { useLayoutEffect, useRef, useState } from "react";
import { hasSystemStatusBarInset } from "./viewport";

/** Read actual browser geometry, rather than guessing an iPhone's notch size. */
export function useViewportGuard(ready: boolean) {
  const probeRef = useRef<HTMLSpanElement>(null);
  const [systemInset, setSystemInset] = useState(false);
  useLayoutEffect(() => {
    const probe = probeRef.current;
    if (!ready || !probe) return;
    const standalone = window.matchMedia("(display-mode: standalone)");
    const ios =
      /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const measure = () => {
      setSystemInset(
        hasSystemStatusBarInset({
          iosStandalone:
            ios &&
            (standalone.matches ||
              (navigator as Navigator & { standalone?: boolean }).standalone ===
                true),
          safeTop: parseFloat(getComputedStyle(probe).height) || 0,
          screenHeight: window.screen.height,
          viewportHeight: window.innerHeight,
          portrait: window.innerHeight >= window.innerWidth,
          scale: window.visualViewport?.scale ?? 1,
        }),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(probe);
    window.addEventListener("resize", measure);
    window.addEventListener("pageshow", measure);
    window.visualViewport?.addEventListener("resize", measure);
    standalone.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("pageshow", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      standalone.removeEventListener("change", measure);
    };
  }, [ready]);
  return { probeRef, systemInset };
}
