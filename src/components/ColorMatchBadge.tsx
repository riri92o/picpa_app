import { Sparkles } from "lucide-react";
import { SCORE_MESSAGES } from "../constants/scoreMessages";
import type { DayRecord } from "../domain/types";
import { useColorMatch } from "../ui/useColorMatch";

export function ColorMatchBadge({
  day,
  compact = false,
  showComment = false,
}: {
  day: DayRecord;
  compact?: boolean;
  showComment?: boolean;
}) {
  const { result, error, retry } = useColorMatch(day);
  const message = result
    ? SCORE_MESSAGES.find((item) => result.score >= item.minimum)?.text
    : undefined;
  return (
    <div
      className={`color-match ${compact ? "compact" : ""}`}
      role="status"
      aria-label={
        result
          ? `色マッチ度 ${result.score}点`
          : error
            ? "色マッチ度を計算できませんでした"
            : "色マッチ度を計算中"
      }
    >
      <Sparkles size={compact ? 14 : 20} aria-hidden="true" />
      <div className="color-match-copy">
        <span>色マッチ度</span>
      </div>
      {result ? (
        <div className="color-match-result">
          <strong>
            {result.score}
            <small>点</small>
          </strong>
          {showComment && (
            <small className="color-match-message">{message}</small>
          )}
        </div>
      ) : error ? (
        <button onClick={retry} aria-label="色マッチ度を再計算">
          再計算
        </button>
      ) : (
        <span className="score-loading" aria-hidden="true">
          ···
        </span>
      )}
    </div>
  );
}
