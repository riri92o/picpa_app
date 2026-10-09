/** Positive, short feedback; keep wording separate from the scoring rules. */
export const SCORE_MESSAGES = [
  { minimum: 95, text: "今日の色、ばっちり！" },
  { minimum: 85, text: "色のまとまりが素敵！" },
  { minimum: 65, text: "いい色、見つけた！" },
  { minimum: 40, text: "今日の色を発見！" },
  { minimum: 0, text: "あなたらしい色の記録！" },
] as const;
