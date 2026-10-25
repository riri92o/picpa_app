import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BRAND_LOGO,
  EXPORT_BRAND_LOGO,
  OPENING_MOTION,
} from "../constants/branding";
import { useAppearance } from "../ui/AppearanceContext";
import { BrandLogo } from "./BrandLogo";

export function OpeningScreen({
  ready,
  onComplete,
}: {
  ready: boolean;
  onComplete: () => void;
}) {
  const reduced = useReducedMotion();
  const appearance = useAppearance();
  const logoUrl = appearance === "day" ? EXPORT_BRAND_LOGO.url : BRAND_LOGO.url;
  const [held, setHeld] = useState(false);
  const [loadedLogo, setLoadedLogo] = useState<string | null>(null);
  const artworkReady = loadedLogo === logoUrl;
  const started = useRef(performance.now());
  useEffect(() => {
    let active = true;
    const image = new Image();
    const loaded = () => {
      if (active) setLoadedLogo(logoUrl);
    };
    const timeout = window.setTimeout(loaded, OPENING_MOTION.artworkTimeout);
    image.onload = loaded;
    image.onerror = loaded;
    image.src = logoUrl;
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [logoUrl]);
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
      <button
        className="opening-logo-button"
        disabled={!ready}
        onClick={onComplete}
        aria-label="PicPa、オープニングをスキップ"
      >
        <BrandLogo variant={appearance === "day" ? "day" : "bubble"} />
      </button>
    </motion.div>
  );
}
