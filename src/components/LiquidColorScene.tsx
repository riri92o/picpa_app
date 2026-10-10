import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { motion } from "framer-motion";
import { colorById } from "../constants/palette";
import { FLOATING_BUBBLES, LIQUID_MOTION } from "../constants/liquidMotion";
import { BubbleSurface } from "./BubbleSurface";
import { createFluidMix, type FluidBox } from "../ui/fluidMix";
import type { ColorRitual } from "../ui/useColorRitual";

function FluidLayer({
  box,
  result,
  colorId,
  startedAt,
}: {
  box: FluidBox;
  result: string;
  colorId: string;
  startedAt: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvas.current) return;
    const render = createFluidMix(canvas.current, box, result, colorId);
    let frame = 0;
    const tick = (now: number) => {
      render(now - startedAt);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [box, result, colorId, startedAt]);
  return (
    <motion.canvas
      ref={canvas}
      className="liquid-color-scene"
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22 }}
    />
  );
}

export function LiquidColorScene({
  ritual,
  screenRef,
  bubbleRef,
}: {
  ritual: ColorRitual;
  screenRef: RefObject<HTMLElement | null>;
  bubbleRef: RefObject<HTMLButtonElement | null>;
}) {
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
      bubble = bubbleRef.current;
    if (!screen || !bubble) return;
    const measure = () => {
      const a = screen.getBoundingClientRect(),
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
    observer.observe(bubble);
    return () => observer.disconnect();
  }, [screenRef, bubbleRef]);
  const { phase, busy, reduced } = ritual;
  const result = colorById(ritual.resultId).hex;
  const mainColor =
    ritual.visibleColorId || phase === "settle" ? result : "#bdc1c5";
  const neutral = !ritual.visibleColorId && phase !== "settle";
  return (
    <>
      <svg
        className="liquid-color-scene"
        data-phase={phase}
        viewBox={`0 0 ${box.width} ${box.height}`}
        aria-hidden="true"
      >
        {FLOATING_BUBBLES.map((blob, i) => {
          const x = box.width * blob.x,
            y = box.height * blob.y;
          return (
            <motion.g
              key={i}
              initial={false}
              animate={{ opacity: busy ? 0 : 1 }}
              transition={{
                duration: reduced
                  ? 0
                  : busy
                    ? 0.22
                    : LIQUID_MOTION.backgroundReveal,
                delay:
                  reduced || busy
                    ? 0
                    : (i % 5) * LIQUID_MOTION.backgroundStagger,
                ease: "easeInOut",
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
          <motion.g
            initial={false}
            animate={{ opacity: !busy || phase === "settle" ? 1 : 0 }}
            transition={{
              duration: reduced
                ? 0
                : phase === "settle"
                  ? 0.55
                  : busy
                    ? 0.22
                    : 0,
              delay: phase === "settle" ? 0.3 : 0,
            }}
          >
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
        />
      )}
    </>
  );
}
