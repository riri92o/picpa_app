import { motion, useReducedMotion } from "framer-motion";
import { SKY_STARS } from "../constants/sky";
import { LIQUID_MOTION } from "../constants/liquidMotion";

/** Persistent across tabs, so the night sky never restarts on navigation. */
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
          className={`sky-star ${i % 5 === 0 ? "warm" : ""}`}
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
      {ambient && (
        <>
          <span className="sky-bubble sky-bubble-one" />
          <span className="sky-bubble sky-bubble-two" />
          <span className="sky-bubble sky-bubble-three" />
        </>
      )}
    </motion.div>
  );
}
