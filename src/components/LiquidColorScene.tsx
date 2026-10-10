import {
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, type MotionValue } from "framer-motion";
import { colorById } from "../constants/palette";
import {
  FLOATING_BUBBLES,
  FLUID_SURFACE,
  LIQUID_MOTION,
} from "../constants/liquidMotion";
import { BubbleSurface } from "./BubbleSurface";
import { createFluidMix, type FluidBox } from "../ui/fluidMix";
import { fluidHandoff } from "../ui/fluidSurface";
import { floatingBubblePosition } from "../ui/viewport";
import type { ColorRitual } from "../ui/useColorRitual";

function FluidLayer({
  box,
  result,
  colorId,
  startedAt,
  systemInset,
  mainOpacity,
}: {
  box: FluidBox;
  result: string;
  colorId: string;
  startedAt: number;
  systemInset: boolean;
  mainOpacity: MotionValue<number>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvas.current) return;
    const render = createFluidMix(
      canvas.current,
      box,
      result,
      colorId,
      systemInset,
    );
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = now - startedAt;
      render(elapsed);
      mainOpacity.set(fluidHandoff(elapsed).main);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [box, result, colorId, startedAt, systemInset, mainOpacity]);
  return (
    <canvas ref={canvas} className="liquid-color-scene" aria-hidden="true" />
  );
}

export function LiquidColorScene({
  ritual,
  screenRef,
  bubbleRef,
  systemInset,
}: {
  ritual: ColorRitual;
  systemInset: boolean;
  screenRef: RefObject<HTMLElement | null>;
  bubbleRef: RefObject<HTMLButtonElement | null>;
}) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    setHost(document.getElementById("color-scene-root"));
  }, []);
  const sceneRef = useRef<HTMLDivElement>(null);
  const materialId = useId().replace(/:/g, "");
  const [box, setBox] = useState<FluidBox>({
    width: 390,
    height: 844,
    x: 195,
    y: 100,
    size: 98,
  });
  useEffect(() => {
    const screen = screenRef.current,
      bubble = bubbleRef.current,
      scene = sceneRef.current;
    if (!screen || !bubble || !scene) return;
    const measure = () => {
      const a = scene.getBoundingClientRect(),
        b = bubble.getBoundingClientRect();
      const next = {
        width: a.width,
        height: a.height,
        x: b.x - a.x + b.width / 2,
        y: b.y - a.y + b.height / 2,
        size: b.width,
      };
      setBox((prev) =>
        Object.keys(next).every(
          (key) => prev[key as keyof FluidBox] === next[key as keyof FluidBox],
        )
          ? prev
          : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(screen);
    observer.observe(scene);
    observer.observe(bubble);
    // The screen slides during tab changes while this backdrop stays fixed.
    // Follow those style updates so the visible surface and its tap target agree.
    const transitionObserver = new MutationObserver(measure);
    if (screen.parentElement)
      transitionObserver.observe(screen.parentElement, {
        attributes: true,
        attributeFilter: ["style"],
      });
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      transitionObserver.disconnect();
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, [screenRef, bubbleRef, host]);
  const { phase, busy, reduced } = ritual;
  const mainOpacity = useMotionValue(1);
  useLayoutEffect(() => {
    if (!busy || reduced) mainOpacity.set(1);
  }, [busy, reduced, mainOpacity]);
  const result = colorById(ritual.resultId).hex;
  const mainColor =
    ritual.visibleColorId || phase === "settle" ? result : "#bdc1c5";
  const neutral = !ritual.visibleColorId && phase !== "settle";
  if (!host) return null;
  return createPortal(
    // Draw outside the animated, safe-area-padded screen. The measured layer is
    // also the canvas coordinate system, so mixing still lands on the button.
    <div ref={sceneRef} className="color-scene-viewport" aria-hidden="true">
      <svg
        className="liquid-color-scene"
        data-phase={phase}
        viewBox={`0 0 ${box.width} ${box.height}`}
        aria-hidden="true"
      >
        {FLOATING_BUBBLES.map((blob, i) => {
          const { x, y } = floatingBubblePosition(
            blob,
            box.width,
            box.height,
            systemInset,
          );
          return (
            <motion.g
              key={i}
              initial={false}
              animate={{ opacity: busy ? 0 : 1 }}
              transition={{
                duration: reduced
                  ? 0
                  : busy
                    ? FLUID_SURFACE.entrance / 1000
                    : LIQUID_MOTION.backgroundReveal,
                delay:
                  reduced || busy
                    ? 0
                    : (i % 5) * LIQUID_MOTION.backgroundStagger,
                ease: busy ? FLUID_SURFACE.handoffEase : "easeInOut",
              }}
            >
              <motion.g
                initial={false}
                animate={{
                  x: reduced ? x : [x, x + blob.dx, x - blob.dx * 0.4, x],
                  y: reduced ? y : [y, y + blob.dy, y - blob.dy * 0.3, y],
                  scale: blob.r / 47,
                  opacity: i < 2 ? 0.46 : 0.7,
                }}
                transition={{
                  duration: reduced ? 0 : blob.period,
                  repeat: reduced ? 0 : Infinity,
                  ease: "easeInOut",
                }}
              >
                <BubbleSurface
                  id={`${materialId}-ambient-${i}`}
                  color={mainColor}
                  neutral={neutral}
                  reduced={reduced}
                  period={blob.period * 0.77}
                />
              </motion.g>
            </motion.g>
          );
        })}
        <g transform={`translate(${box.x} ${box.y}) scale(${box.size / 100})`}>
          <motion.g style={{ opacity: mainOpacity }}>
            <motion.g
              animate={
                reduced
                  ? { scale: 1, y: 0 }
                  : {
                      scale: [1, 1.017, 0.993, 1],
                      y: [0, -2, 1, 0],
                    }
              }
              transition={{
                duration: reduced ? 0 : LIQUID_MOTION.breathe,
                repeat: reduced ? 0 : Infinity,
                ease: "easeInOut",
              }}
            >
              <BubbleSurface
                id={`${materialId}-main`}
                color={mainColor}
                neutral={neutral}
                reduced={reduced}
              />
            </motion.g>
          </motion.g>
        </g>
      </svg>
      {busy && !reduced && (
        <FluidLayer
          box={box}
          result={result}
          colorId={colorById(ritual.resultId).id}
          startedAt={ritual.startedAt}
          systemInset={systemInset}
          mainOpacity={mainOpacity}
        />
      )}
    </div>,
    host,
  );
}
