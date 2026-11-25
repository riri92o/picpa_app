import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, type MotionValue } from "framer-motion";
import { colorById } from "../constants/palette";
import {
  FLUID_SURFACE,
  HOME_MOTION,
  LIQUID_MOTION,
} from "../constants/liquidMotion";
import { SoapBubbleSurface } from "./SoapBubbleSurface";
import { createFluidMix, type FluidBox } from "../ui/fluidMix";
import { fluidHandoff } from "../ui/fluidSurface";
import { drawBubbleOrigins, type BubbleOrigin } from "../ui/viewport";
import type { ColorRitual } from "../ui/useColorRitual";
import { DrawMembrane } from "./DrawMembrane";
import { MEMBRANE_PHASES, MEMBRANE_PERIOD } from "../ui/drawMembrane";

function FluidLayer({
  box,
  result,
  colorId,
  startedAt,
  systemInset,
  mainOpacity,
  origins,
}: {
  box: FluidBox;
  result: string;
  colorId: string;
  startedAt: number;
  systemInset: boolean;
  mainOpacity: MotionValue<number>;
  origins: BubbleOrigin[];
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
      origins,
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
  }, [box, result, colorId, startedAt, systemInset, mainOpacity, origins]);
  return (
    <canvas ref={canvas} className="liquid-color-scene" aria-hidden="true" />
  );
}

export function LiquidColorScene({
  ritual,
  screenRef,
  bubbleRef,
  systemInset,
  expanded,
}: {
  ritual: ColorRitual;
  systemInset: boolean;
  expanded: boolean;
  screenRef: RefObject<HTMLElement | null>;
  bubbleRef: RefObject<HTMLButtonElement | null>;
}) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    setHost(document.getElementById("color-scene-root"));
  }, []);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<FluidBox | null>(null);
  useLayoutEffect(() => {
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
        prev &&
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
    // The screen slides during tab changes while the drawing layer stays fixed.
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
  }, [screenRef, bubbleRef, host, expanded]);
  const { phase, busy, reduced } = ritual;
  const droplets = useRef<(SVGGElement | null)[]>([]);
  const [mixOrigins, setMixOrigins] = useState<BubbleOrigin[] | null>(null);
  const mainOpacity = useMotionValue(1);
  useLayoutEffect(() => {
    if (!busy || reduced || phase === "reveal") mainOpacity.set(1);
  }, [busy, reduced, phase, mainOpacity]);
  const origins = useMemo(
    () => (box ? drawBubbleOrigins(box, systemInset) : []),
    [box, systemInset],
  );
  const frames = useMemo(
    () =>
      box
        ? MEMBRANE_PHASES.map((p) => drawBubbleOrigins(box, systemInset, p))
        : [],
    [box, systemInset],
  );
  useLayoutEffect(() => {
    if (!busy) {
      setMixOrigins(null);
      return;
    }
    // Freeze the actual resting pose so gathering starts exactly at each bead.
    setMixOrigins(
      origins.map((origin, i) => {
        const node = droplets.current[i];
        const root = node?.ownerSVGElement?.getScreenCTM();
        const screen = node?.getScreenCTM();
        if (!root || !screen) return origin;
        try {
          const m = root.inverse().multiply(screen);
          const r = 47 * Math.hypot(m.a, m.b);
          return [m.e, m.f, r].every(Number.isFinite) && r > 0
            ? { ...origin, x: m.e, y: m.f, r }
            : origin;
        } catch {
          return origin;
        }
      }),
    );
  }, [busy, ritual.startedAt, origins]);
  const result = colorById(ritual.resultId).hex;
  const mainColor =
    ritual.visibleColorId || phase === "settle" ? result : "#bdc1c5";
  const neutral = !ritual.visibleColorId && phase !== "settle";
  if (!host) return null;
  return createPortal(
    <div ref={sceneRef} className="color-scene-viewport" aria-hidden="true">
      {box && (
        <>
          <svg
            className="liquid-color-scene"
            data-phase={phase}
            viewBox={`0 0 ${box.width} ${box.height}`}
            aria-hidden="true"
          >
            <motion.g
              initial={false}
              animate={{ x: box.x, y: box.y, scale: box.size / 100 }}
              transition={{
                duration: reduced || busy ? 0 : HOME_MOTION.dock / 1000,
                ease: LIQUID_MOTION.ease,
              }}
            >
              <motion.g style={{ opacity: mainOpacity }}>
                <motion.g
                  animate={
                    reduced || neutral
                      ? { scale: 1, y: 0 }
                      : { scale: [1, 1.017, 0.993, 1], y: [0, -2, 1, 0] }
                  }
                  transition={{
                    duration: reduced ? 0 : LIQUID_MOTION.breathe,
                    repeat: reduced ? 0 : Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {expanded && neutral ? (
                    <DrawMembrane reduced={reduced} pressed={busy} />
                  ) : (
                    <SoapBubbleSurface
                      color={mainColor}
                      neutral={neutral}
                      revealed={!neutral}
                    />
                  )}
                </motion.g>
              </motion.g>
            </motion.g>
            {expanded &&
              (phase === "idle" || phase === "gather") &&
              origins.map((origin, i) => {
                return (
                  <motion.g
                    key={i}
                    initial={false}
                    animate={{ opacity: busy || !expanded ? 0 : 1 }}
                    transition={{
                      duration: reduced ? 0 : FLUID_SURFACE.entrance / 1000,
                    }}
                  >
                    <motion.g
                      ref={(node) => {
                        droplets.current[i] = node;
                      }}
                      data-droplet={origin.color ? "color" : "neutral"}
                      initial={false}
                      animate={{
                        x: reduced
                          ? origin.x
                          : frames.map((frame) => frame[i].x),
                        y: reduced
                          ? origin.y
                          : frames.map((frame) => frame[i].y),
                        scale: origin.r / 47,
                        opacity: origin.color ? 0.96 : 0,
                      }}
                      transition={{
                        duration: reduced ? 0 : MEMBRANE_PERIOD,
                        repeat: reduced ? 0 : Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <SoapBubbleSurface
                        color={origin.color ?? "#bdc1c5"}
                        neutral={!origin.color}
                        revealed={!!origin.color}
                      />
                    </motion.g>
                  </motion.g>
                );
              })}
          </svg>
          {busy && phase !== "reveal" && !reduced && mixOrigins && (
            <FluidLayer
              box={box}
              result={result}
              colorId={colorById(ritual.resultId).id}
              startedAt={ritual.startedAt}
              systemInset={systemInset}
              mainOpacity={mainOpacity}
              origins={mixOrigins}
            />
          )}
        </>
      )}
    </div>,
    host,
  );
}
