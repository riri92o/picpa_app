import { useEffect, useRef, useState, type RefObject } from "react";
import { motion } from "framer-motion";
import { colorById } from "../constants/palette";
import { FLOATING_BUBBLES, LIQUID_MOTION } from "../constants/liquidMotion";
import { ROUND_BUBBLES } from "../ui/bubbleGeometry";
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
    <canvas ref={canvas} className="liquid-color-scene" aria-hidden="true" />
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
  const waveY = box.y + box.size * 0.65 + 23;
  return (
    <>
      <svg
        className="liquid-color-scene"
        data-phase={phase}
        viewBox={`0 0 ${box.width} ${box.height}`}
        aria-hidden="true"
      >
        <g className="home-liquid-waves" fill="var(--accent)" opacity=".17">
          <path
            d={`M-20 ${waveY + 9} Q${box.width * 0.15} ${waveY - 30} ${box.width * 0.31} ${waveY} T${box.width * 0.65} ${waveY + 7} T${box.width + 20} ${waveY - 12} L${box.width + 20} ${waveY + 22} Q${box.width * 0.8} ${waveY - 4} ${box.width * 0.65} ${waveY + 26} T${box.width * 0.31} ${waveY + 17} T-20 ${waveY + 32}Z`}
          />
          <path
            d={`M-20 ${box.height - 100} Q${box.width * 0.13} ${box.height - 135} ${box.width * 0.29} ${box.height - 106} T${box.width * 0.62} ${box.height - 107} T${box.width + 20} ${box.height - 126} V${box.height + 20} H-20Z`}
          />
        </g>
        {FLOATING_BUBBLES.map((blob, i) => {
          const x = box.width * blob.x,
            y = box.height * blob.y;
          return (
            <motion.g
              key={i}
              initial={false}
              animate={{ opacity: busy ? 0 : 1 }}
              transition={{
                duration: reduced || busy ? 0 : LIQUID_MOTION.backgroundReveal,
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
                  opacity: i < 2 ? 0.26 : 0.36,
                }}
                transition={{
                  duration: reduced ? 0 : blob.period,
                  repeat: reduced ? 0 : Infinity,
                  ease: "easeInOut",
                }}
              >
                <motion.path
                  initial={false}
                  animate={{
                    d: reduced ? ROUND_BUBBLES[i % 3] : ROUND_BUBBLES,
                    fill: "var(--accent)",
                  }}
                  transition={{
                    d: {
                      duration: blob.period * 0.77,
                      repeat: reduced ? 0 : Infinity,
                      ease: "easeInOut",
                    },
                    fill: { duration: reduced ? 0 : 0.18 },
                  }}
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
              duration: phase === "settle" ? 0.3 : 0,
              delay: phase === "settle" ? 0.6 : 0,
            }}
          >
            <motion.g
              animate={
                reduced
                  ? { scale: 1, y: 0 }
                  : { scale: [1, 1.017, 0.993, 1], y: [0, -2, 1, 0] }
              }
              transition={{
                duration: reduced ? 0 : LIQUID_MOTION.breathe,
                repeat: reduced ? 0 : Infinity,
                ease: "easeInOut",
              }}
            >
              <motion.path
                stroke={
                  ritual.visibleColorId === "white" ||
                  ritual.visibleColorId === "black" ||
                  (phase === "settle" &&
                    ["white", "black"].includes(ritual.resultId ?? ""))
                    ? "var(--muted)"
                    : "none"
                }
                strokeWidth={0.8}
                initial={{ d: ROUND_BUBBLES[0] }}
                animate={{
                  d: reduced ? ROUND_BUBBLES[0] : ROUND_BUBBLES,
                  fill:
                    ritual.visibleColorId || phase === "settle"
                      ? result
                      : "#bdc1c5",
                }}
                transition={{
                  d: {
                    duration: LIQUID_MOTION.contour,
                    repeat: reduced ? 0 : Infinity,
                    ease: "easeInOut",
                  },
                  fill: { duration: 0 },
                }}
              />
            </motion.g>
          </motion.g>
          <motion.g
            initial={false}
            animate={{ opacity: !busy && ritual.visibleColorId ? 0.65 : 0 }}
            transition={{
              duration: reduced || busy ? 0 : LIQUID_MOTION.marksReveal,
              delay: reduced || busy ? 0 : LIQUID_MOTION.backgroundStagger,
              ease: "easeInOut",
            }}
            className="bubble-pop-marks"
            stroke="var(--accent)"
            strokeWidth="4"
            strokeLinecap="round"
          >
            <path d="M-61 25l-5-3M-60 38l-5 3M61 25l5-3M60 38l5 3" />
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
