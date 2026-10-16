import { mixHex } from "../ui/theme";

/** The daily color stays visible; only the edges receive a soft milky reflection. */
export function waterFilm(color: string) {
  return {
    body: color,
    light: mixHex(color, "#ffffff", 0.08),
    shade: mixHex(color, "#061322", 0.08),
    reflection: mixHex(color, "#fff8f2", 0.84),
  };
}
