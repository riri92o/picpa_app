import { useEffect, useId, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion } from "framer-motion";
import {
  BRAND_LOGO,
  OPENING_BUBBLES,
  OPENING_MOTION,
} from "../constants/branding";
import { SKY_STARS } from "../constants/sky";
import { BrandLogo } from "./BrandLogo";
import { BubbleSurface } from "./BubbleSurface";
import {
  openingBubbleOffset,
  type OpeningBubbleDefinition,
} from "../ui/openingMotion";

function FloatingOpeningBubble({
  bubble,
  index,
  id,
  reduced,
}: {
  bubble: OpeningBubbleDefinition;
  index: number;
  id: string;
  reduced: boolean;
}) {
  const initial = reduced
    ? { x: 0, y: 0 }
    : openingBubbleOffset(bubble, index, 0);
  const x = useMotionValue(initial.x);
  const y = useMotionValue(initial.y);
  useEffect(() => {
    if (reduced) {
      x.set(0);
      y.set(0);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const position = openingBubbleOffset(bubble, index, now - start);
      x.set(position.x);
      y.set(position.y);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [bubble, index, reduced, x, y]);
  return (
    <div
      className="opening-bubble-anchor"
      style={{
        left: `${bubble.x}%`,
        top: `${bubble.y}%`,
        width: bubble.size,
        height: bubble.size,
      }}
    >
      <motion.svg viewBox="-54 -54 108 108" style={{ x, y }}>
        <BubbleSurface
          id={id}
          color={bubble.color}
          reduced={reduced}
          period={bubble.period * 0.77}
        />
      </motion.svg>
    </div>
  );
}

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
          <FloatingOpeningBubble
            key={index}
            bubble={bubble}
            index={index}
            id={`${id}-${index}`}
            reduced={!!reduced}
          />
        ))}
      </div>
      <button
        className="opening-logo-button"
        disabled={!ready}
        onClick={onComplete}
        aria-label="PicPa、オープニングをスキップ"
      >
        <BrandLogo />
      </button>
    </motion.div>
  );
}
