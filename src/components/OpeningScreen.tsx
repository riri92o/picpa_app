import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BRAND_LOGO,
  OPENING_BUBBLES,
  OPENING_MOTION,
} from "../constants/branding";
import { SKY_STARS } from "../constants/sky";
import { BrandLogo } from "./BrandLogo";
import { BubbleSurface } from "./BubbleSurface";

export function OpeningScreen({
  ready,
  onComplete,
}: {
  ready: boolean;
  onComplete: () => void;
}) {
  const reduced = useReducedMotion();
  const [held, setHeld] = useState(false);
  const [artworkReady, setArtworkReady] = useState(false);
  const started = useRef(performance.now());
  const id = `opening-${useId().replace(/:/g, "")}`;
  useEffect(() => {
    let active = true;
    const image = new Image();
    const loaded = () => {
      if (active) setArtworkReady(true);
    };
    const timeout = window.setTimeout(loaded, OPENING_MOTION.artworkTimeout);
    image.onload = loaded;
    image.onerror = loaded;
    image.src = BRAND_LOGO.url;
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, []);
  useEffect(() => {
    const duration = reduced
      ? OPENING_MOTION.reducedDuration
      : OPENING_MOTION.minimumDuration;
    const timer = window.setTimeout(
      () => setHeld(true),
      Math.max(0, duration - (performance.now() - started.current)),
    );
    return () => window.clearTimeout(timer);
  }, [reduced]);
  useEffect(() => {
    if (held && ready && artworkReady) onComplete();
  }, [held, ready, artworkReady, onComplete]);

  return (
    <motion.div
      className="opening-screen"
      role="status"
      aria-label="PicPaを起動中"
      initial={false}
      exit={{ opacity: 0 }}
      transition={{
        duration: reduced ? 0.12 : OPENING_MOTION.fadeDuration,
        ease: OPENING_MOTION.ease,
      }}
    >
      <div className="opening-art" aria-hidden="true">
        <span className="opening-haze" />
        {SKY_STARS.slice(0, 24).map((star, index) => (
          <span
            className={`opening-star ${index % 9 === 0 ? "opening-sparkle" : ""}`}
            key={index}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              animationDelay: `${-index * 0.7}s`,
            }}
          />
        ))}
        {OPENING_BUBBLES.map((bubble, index) => (
          <div
            className="opening-bubble-anchor"
            key={index}
            style={{
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              width: bubble.size,
              height: bubble.size,
            }}
          >
            <motion.svg
              viewBox="-54 -54 108 108"
              initial={false}
              animate={
                reduced
                  ? { x: 0, y: 0 }
                  : {
                      x: [0, bubble.dx, -bubble.dx * 0.35, 0],
                      y: [0, bubble.dy, -bubble.dy * 0.3, 0],
                    }
              }
              transition={{
                duration: bubble.period,
                ease: "easeInOut",
                repeat: reduced ? 0 : Infinity,
              }}
            >
              <BubbleSurface
                id={`${id}-${index}`}
                color={bubble.color}
                reduced={!!reduced}
                period={bubble.period * 0.77}
              />
            </motion.svg>
          </div>
        ))}
      </div>
      <motion.button
        className="opening-logo-button"
        disabled={!ready}
        onClick={onComplete}
        aria-label="PicPa、オープニングをスキップ"
        initial={reduced ? false : { opacity: 0, scale: 0.96, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.7, ease: OPENING_MOTION.ease }}
      >
        <BrandLogo />
      </motion.button>
    </motion.div>
  );
}
