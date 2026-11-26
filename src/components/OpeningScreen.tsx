import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BRAND_LOGO, OPENING_MOTION } from "../constants/branding";
import { BrandLogo } from "./BrandLogo";

export function OpeningScreen({
  ready,
  onComplete,
}: {
  ready: boolean;
  onComplete: () => void;
}) {
  const reduced = useReducedMotion();
  const [held, setHeld] = useState(false);
  const [artwork, setArtwork] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  const [revealComplete, setRevealComplete] = useState(false);
  const started = useRef(performance.now());
  useEffect(() => {
    let active = true;
    let settled = false;
    const image = new Image();
    const finish = (state: "ready" | "unavailable") => {
      if (!active || settled) return;
      settled = true;
      window.clearTimeout(timeout);
      setArtwork(state);
    };
    const timeout = window.setTimeout(
      () => finish("unavailable"),
      OPENING_MOTION.artworkTimeout,
    );
    image.onload = () => {
      // Start the reveal when the approved artwork can actually be painted.
      // A late image still gets its reveal; failures retain the bounded exit.
      if (typeof image.decode !== "function") {
        finish("ready");
        return;
      }
      void image.decode().then(
        () => finish("ready"),
        () => finish("ready"),
      );
    };
    image.onerror = () => finish("unavailable");
    image.src = BRAND_LOGO.url;
    return () => {
      active = false;
      window.clearTimeout(timeout);
      image.onload = image.onerror = null;
    };
  }, []);
  useEffect(() => {
    if (artwork !== "ready" || reduced) return;
    const timer = window.setTimeout(
      () => setRevealComplete(true),
      OPENING_MOTION.logoRevealDuration * 1000 + OPENING_MOTION.logoClearHold,
    );
    return () => window.clearTimeout(timer);
  }, [artwork, reduced]);
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
    if (
      held &&
      ready &&
      (artwork === "unavailable" ||
        (artwork === "ready" && (reduced || revealComplete)))
    )
      onComplete();
  }, [held, ready, artwork, revealComplete, reduced, onComplete]);

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
      <button
        className="opening-logo-button"
        disabled={!ready}
        onClick={onComplete}
        aria-label="PicPa、オープニングをスキップ"
      >
        <motion.span
          className="opening-logo-aura"
          aria-hidden="true"
          initial={false}
          animate={{
            opacity: reduced || artwork !== "ready" ? 0 : [0, 0.28, 0.1],
            scale: reduced ? 1 : artwork === "ready" ? [0.9, 1.06, 1] : 0.9,
          }}
          transition={{ duration: reduced ? 0 : 2.1, ease: "easeInOut" }}
        />
        <motion.span
          className="opening-logo-reveal"
          initial={false}
          animate={{
            opacity: artwork === "ready" ? 1 : 0,
            filter: reduced || artwork === "ready" ? "blur(0px)" : "blur(18px)",
            scale: reduced || artwork === "ready" ? 1 : 0.965,
            y: reduced || artwork === "ready" ? 0 : 7,
          }}
          transition={{
            duration: reduced ? 0.12 : OPENING_MOTION.logoRevealDuration,
            ease: [0.22, 0.61, 0.36, 1],
          }}
        >
          <BrandLogo />
        </motion.span>
      </button>
    </motion.div>
  );
}
