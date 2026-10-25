import type { ThemeChoice } from "../domain/types";

export type Appearance = "day" | "night";

/** Keep the existing settings values and resolve System without rewriting them. */
export function resolveAppearance(
  theme: ThemeChoice,
  systemDark: boolean,
): Appearance {
  return theme === "dark" || (theme === "system" && systemDark)
    ? "night"
    : "day";
}
