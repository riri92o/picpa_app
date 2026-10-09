import { useEffect, useState } from "react";
import type { DayRecord, ColorMatchResult } from "../domain/types";
import { colorMatchSignature, validColorMatch } from "../domain/colorMatch";
import { useApp } from "../state/AppContext";

export function useColorMatch(day?: DayRecord) {
  const { ensureColorMatch } = useApp();
  const cached = day ? validColorMatch(day) : undefined;
  const date = day?.completedAt ? day.date : undefined;
  const signature = day ? colorMatchSignature(day) : "";
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    date?: string;
    signature?: string;
    result?: ColorMatchResult;
    error?: boolean;
  }>({});
  useEffect(() => {
    if (!date || cached) return;
    let alive = true;
    setState({ date, signature });
    void ensureColorMatch(date)
      .then((result) => {
        if (alive) setState({ date, signature, result });
      })
      .catch(() => {
        if (alive) setState({ date, signature, error: true });
      });
    return () => {
      alive = false;
    };
  }, [date, signature, cached, ensureColorMatch, attempt]);
  const current =
    state.date === date && state.signature === signature ? state : undefined;
  return {
    result: cached ?? current?.result,
    error: current?.error ?? false,
    retry: () => setAttempt((n) => n + 1),
  };
}
