import { motion, useReducedMotion } from "framer-motion";
import { SKY_BOKEH, SKY_DECOR_BUBBLES, SKY_STARS } from "../constants/sky";
import { LIQUID_MOTION } from "../constants/liquidMotion";

/** Persistent across tabs, so the sky never restarts on navigation. */
export function LiquidBackdrop({
  busy = false,
  ambient = false,
}: {
  busy?: boolean;
  ambient?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="night-sky"
      aria-hidden="true"
      initial={false}
      animate={{ opacity: busy ? 0.25 : 1 }}
      transition={{ duration: reduced ? 0 : LIQUID_MOTION.backgroundReveal }}
    >
      {SKY_STARS.map((star, i) => (
        <span
          key={i}
          className={`sky-star ${i % 9 === 0 ? "sparkle" : ""} ${i % 5 === 0 ? "warm" : ""}`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            animationDuration: `${star.duration}s`,
            animationDelay: `${-i * 0.7}s`,
          }}
        />
      ))}
      <span className="sky-haze haze-one" />
      <span className="sky-haze haze-two" />
      <span className="sky-haze haze-three" />
      {SKY_BOKEH.map((spot, i) => (
        <span
          key={`bokeh-${i}`}
          className="sky-bokeh"
          style={{
            left: `${spot.x}%`,
            top: `${spot.y}%`,
            width: spot.size,
            height: spot.size,
          }}
        />
      ))}
      {ambient && (
        <>
          <span className="sky-bubble sky-bubble-one" />
          <span className="sky-bubble sky-bubble-two" />
          <span className="sky-bubble sky-bubble-three" />
          {SKY_DECOR_BUBBLES.map((bubble, i) => (
            <span
              key={`bubble-${i}`}
              className={`sky-bubble ${bubble.size < 10 ? "sky-bubble-speck" : "sky-bubble-decor"}`}
              style={{
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                width: bubble.size,
                height: bubble.size,
                opacity: bubble.opacity,
                animationDuration: `${bubble.period}s`,
                animationDelay: `${-i * 1.8}s`,
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
}
