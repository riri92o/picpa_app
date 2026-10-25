import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { HOME_MOTION, LIQUID_MOTION } from "../constants/liquidMotion";
import type { DayRecord } from "../domain/types";

export type RitualPhase = "idle" | "gather" | "swirl" | "settle" | "reveal";
interface RitualSession {
  date: string;
  colorId: string;
  phase: RitualPhase;
  startedAt: number;
}
export function useColorRitual(today: DayRecord, draw: () => DayRecord) {
  const reduced = !!useReducedMotion();
  const [session, setSession] = useState<RitualSession | null>(null);
  const timers = useRef<number[]>([]);
  const running = useRef(false);
  const cancel = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    running.current = false;
  }, []);
  useEffect(() => () => cancel(), [cancel]);
  useEffect(() => {
    cancel();
    setSession(null);
  }, [today.date, cancel]);
  useEffect(() => {
    const finish = () => {
      if (document.hidden) {
        cancel();
        setSession(null);
      }
    };
    document.addEventListener("visibilitychange", finish);
    if (reduced) {
      cancel();
      setSession(null);
    }
    return () => document.removeEventListener("visibilitychange", finish);
  }, [reduced, cancel]);
  const start = useCallback(() => {
    if (today.colorId || running.current) return;
    running.current = true;
    // Persist the one daily result before the visual sequence begins.
    const result = draw();
    if (!result.colorId || reduced) {
      cancel();
      return;
    }
    const initial: RitualSession = {
      date: result.date,
      colorId: result.colorId,
      phase: "gather",
      startedAt: performance.now(),
    };
    setSession(initial);
    const at = (time: number, phase: RitualPhase) => {
      timers.current.push(
        window.setTimeout(() => setSession({ ...initial, phase }), time),
      );
    };
    const { gather, swirl, settle } = LIQUID_MOTION;
    at(gather, "swirl");
    at(gather + swirl, "settle");
    at(gather + swirl + settle, "reveal");
  }, [today.colorId, draw, reduced, cancel]);
  const active = session?.date === today.date ? session : null;
  useEffect(() => {
    if (active?.phase !== "reveal") return;
    // Start the hold after the result has committed, even on a busy device.
    const timer = window.setTimeout(() => {
      cancel();
      setSession(null);
    }, HOME_MOTION.reveal);
    timers.current.push(timer);
    return () => window.clearTimeout(timer);
  }, [active?.phase, active?.date, cancel]);
  return {
    start,
    reduced,
    busy: !!active,
    phase: active?.phase ?? ("idle" as RitualPhase),
    startedAt: active?.startedAt ?? 0,
    resultId: active?.colorId ?? today.colorId,
    visibleColorId:
      active && active.phase !== "reveal" ? undefined : today.colorId,
  };
}
export type ColorRitual = ReturnType<typeof useColorRitual>;
