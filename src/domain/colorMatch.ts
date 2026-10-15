import { COLOR_MATCH } from "../constants/colorMatch";
import { colorById } from "../constants/palette";
import { drawPlacement } from "./image";
import type { ColorMatchResult, DayRecord } from "./types";
import {
  colorFamily,
  sameFamily,
  subjectWeights,
  type Lab,
} from "./colorSubject";
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const linear = (n: number) => {
  const s = n / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
/** Oklab on sRGB canvas pixels; scoring tolerances are game rules, not a calibrated accuracy percentage. */
export function toOklab(r: number, g: number, b: number): Lab {
  const R = linear(r),
    G = linear(g),
    B = linear(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
export function pixelSimilarity(pixel: Lab, target: Lab): number {
  const pc = Math.hypot(pixel[1], pixel[2]),
    tc = Math.hypot(target[1], target[2]);
  const light =
    ((pixel[0] - target[0]) * COLOR_MATCH.lightnessWeight) /
    COLOR_MATCH.lightnessTolerance;
  if (tc < COLOR_MATCH.neutralChroma)
    return Math.exp(
      -(
        (Math.hypot(pixel[1] - target[1], pixel[2] - target[2]) /
          COLOR_MATCH.neutralTolerance) **
        2
      ) -
        ((pixel[0] - target[0]) / COLOR_MATCH.neutralLightnessTolerance) ** 2,
    );
  const angle =
    Math.atan2(pixel[2], pixel[1]) - Math.atan2(target[2], target[1]);
  const hue =
    (2 * Math.sqrt(pc * tc) * Math.sin(angle / 2)) / COLOR_MATCH.hueTolerance;
  const chroma = (pc - tc) / COLOR_MATCH.chromaTolerance;
  const presence = clamp(pc / (tc * 0.4));
  const angularDistance = Math.abs(
    Math.atan2(Math.sin(angle), Math.cos(angle)),
  );
  const oppositePenalty =
    (1 - clamp((angularDistance - Math.PI / 2) / (Math.PI / 2))) **
    COLOR_MATCH.oppositeHuePower;
  return (
    presence *
    oppositePenalty *
    Math.exp(-hue * hue - chroma * chroma - light * light)
  );
}

/** Choose dominant subjects independently of the target, then compare their color.
 * Minimum support rejects tiny patches; context and color coherence keep a
 * multicolored photo from scoring as highly as a unified subject.
 */
export function scoreSubjectColors(
  labs: (Lab | undefined)[],
  width: number,
  height: number,
  target: Lab,
) {
  const weights = subjectWeights(labs, width, height);
  const families = labs.map((lab) => (lab ? colorFamily(lab) : -1));
  const validCount = labs.filter(Boolean).length;
  const supports = new Array<number>(COLOR_MATCH.hueBins + 4).fill(0);
  families.forEach((family) => {
    if (family >= 0) supports[family]++;
  });
  const targetChroma = Math.hypot(target[1], target[2]);
  const similarities = labs.map((lab) =>
    lab ? pixelSimilarity(lab, target) : 0,
  );
  let total = 0,
    context = 0,
    covered = 0;
  labs.forEach((lab, i) => {
    if (!lab) return;
    const supported = supports.reduce(
      (sum, n, family) => sum + (sameFamily(family, families[i]) ? n : 0),
      0,
    );
    if (supported < validCount * COLOR_MATCH.minimumFamilyFraction) {
      weights[i] = 0;
      return;
    }
    if (targetChroma >= COLOR_MATCH.neutralChroma) {
      // White highlights and neutral shadows are weak color evidence. Retain
      // some weight so a neutral foreground cannot simply disappear.
      weights[i] *= 0.15 + 0.85 * clamp(Math.hypot(lab[1], lab[2]) / 0.035);
    }
    total += weights[i];
    context += weights[i] * similarities[i];
    if (similarities[i] >= COLOR_MATCH.coverageThreshold) covered++;
  });
  if (!total) return { score: 0, similarity: 0, coverage: 0 };
  let dominantWeight = 0,
    dominantSimilarity = 0;
  for (let family = 0; family < supports.length; family++) {
    let weight = 0,
      quality = 0;
    families.forEach((f, i) => {
      if (!sameFamily(family, f)) return;
      weight += weights[i];
      quality += weights[i] * similarities[i];
    });
    if (weight > dominantWeight) {
      dominantWeight = weight;
      dominantSimilarity = quality / weight;
    }
  }
  const similarity =
    COLOR_MATCH.subjectWeight * dominantSimilarity +
    ((1 - COLOR_MATCH.subjectWeight) * context) / total;
  const coherence = 0.75 + 0.25 * Math.sqrt(dominantWeight / total);
  return {
    score: Math.round(100 * similarity * coherence),
    similarity,
    coverage: covered / validCount,
  };
}
export function colorMatchSignature(day: DayRecord): string {
  return JSON.stringify([
    day.count,
    day.colorId,
    day.photos.map((p) => [p.id, p.x, p.y, p.zoom, p.rotation]),
  ]);
}
export function validColorMatch(day: DayRecord): ColorMatchResult | undefined {
  return day.colorMatch?.version === COLOR_MATCH.version &&
    day.colorMatch.signature === colorMatchSignature(day)
    ? day.colorMatch
    : undefined;
}
export async function analyzeColorMatch(
  day: DayRecord,
  getBlob: (id: string) => Promise<Blob | undefined>,
): Promise<ColorMatchResult> {
  if (!day.colorId || day.photos.length !== day.count)
    throw new Error("Incomplete collage");
  const hex = colorById(day.colorId).hex;
  const target = toOklab(
    ...([1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [
      number,
      number,
      number,
    ]),
  );
  const canvas = document.createElement("canvas");
  canvas.width = COLOR_MATCH.sampleWidth;
  canvas.height = Math.round(
    canvas.width / (day.count === 4 ? 1.12 : day.count === 9 ? 1 : 1.25),
  );
  const context = canvas.getContext("2d", {
    willReadFrequently: true,
    colorSpace: "srgb",
  });
  if (!context) throw new Error("Canvas unavailable");
  const photos: ColorMatchResult["photos"] = [];
  for (const placement of day.photos) {
    const blob = await getBlob(placement.id);
    if (!blob) throw new Error("Photo unavailable");
    const image = await createImageBitmap(blob);
    try {
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawPlacement(
        context,
        image,
        image.width,
        image.height,
        placement,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      ).data;
      const labs: (Lab | undefined)[] = [];
      for (let i = 0; i < pixels.length; i += 4)
        labs.push(
          pixels[i + 3] > 0
            ? toOklab(pixels[i], pixels[i + 1], pixels[i + 2])
            : undefined,
        );
      photos.push({
        id: placement.id,
        ...scoreSubjectColors(labs, canvas.width, canvas.height, target),
      });
    } finally {
      image.close();
    }
    // Yield between photos so completion feedback stays responsive.
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  }
  const average = (field: "score" | "similarity" | "coverage") =>
    photos.reduce((sum, p) => sum + p[field], 0) / photos.length;
  return {
    version: COLOR_MATCH.version,
    signature: colorMatchSignature(day),
    score: Math.round(average("score")),
    similarity: average("similarity"),
    coverage: average("coverage"),
    photos,
  };
}
