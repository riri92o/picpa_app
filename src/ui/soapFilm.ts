import { vividAccent } from "./theme";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const rgb = (hex: string) =>
  [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));

/** A sphere reflecting one broad upper-left softbox. Film interference is confined
 * to grazing angles; the clear center transmits the app's actual background.
 * This material is baked once per color, never recomputed by an animation frame. */
export function renderSoapFilm(
  size: number,
  color: string,
  neutral = false,
  revealed = false,
  emphasized = revealed,
) {
  const pixels = new Uint8ClampedArray(size * size * 4);
  const tint = rgb(neutral ? "#d8e2f0" : vividAccent(color));
  const radius = size * 0.47;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5 - size / 2) / radius;
      const ny = (y + 0.5 - size / 2) / radius;
      const rr = nx * nx + ny * ny;
      if (rr >= 1) continue;
      const z = Math.sqrt(1 - rr);
      const r = Math.sqrt(rr);
      const coverage = clamp((1 - r) * radius);
      // Reflection of the viewing ray by the spherical surface normal.
      const rx = 2 * z * nx,
        ry = 2 * z * ny,
        rz = 2 * z * z - 1;
      const facingKey = rx * -0.656 + ry * -0.727 + rz * -0.202;
      const u = rx * 0.742 + ry * -0.67;
      const v = rx * -0.135 + ry * -0.15 + rz * 0.979;
      const windowLight =
        facingKey > 0
          ? Math.exp(-2 * (Math.pow(u / 0.43, 2) + Math.pow(v / 0.12, 2)))
          : 0;
      const windowBloom =
        facingKey > 0
          ? Math.exp(-3 * (Math.pow(u / 0.68, 2) + Math.pow(v / 0.26, 2)))
          : 0;
      const fresnel = 0.018 + 0.982 * Math.pow(1 - z, 2.1);
      const keySide = clamp((-0.65 * nx - 0.76 * ny + 0.3) / 1.3);
      const rimLight = 0.18 + 0.55 * keySide + 0.1 * clamp(ny);
      // Smooth film thickness, with no noise or painted-on rainbow ribbons.
      const thickness = 420 + 125 * ny + 18 * Math.sin(nx * 2.8 + ny * 1.7);
      const refractedCos = Math.sqrt(1 - rr / (1.33 * 1.33));
      const phase = 4 * Math.PI * 1.33 * thickness * refractedCos;
      const interference = [680, 550, 440].map(
        (wavelength) => 0.5 + 0.5 * Math.cos(phase / wavelength),
      );
      const filmAlpha = fresnel * rimLight;
      // A selected color needs enough pigment to remain recognizable over navy.
      // Decorative bubbles keep the lighter film; both share the same reflections.
      const focused = revealed && emphasized && !neutral;
      const washAlpha =
        (neutral ? 0.012 : focused ? 0.7 : revealed ? 0.38 : 0.16) *
        (focused ? 0.8 + 0.2 * rr : revealed ? 0.5 + 0.5 * rr : 0.2 + 0.8 * rr);
      const specularAlpha = clamp(windowLight * 0.84 + windowBloom * 0.1);
      // Composite in premultiplied form, preserving real transparency in the PNG.
      let alpha = washAlpha;
      const channels = tint.map((channel) => channel * washAlpha);
      const edgeColors = [181, 209, 228].map(
        (channel, c) =>
          channel * (0.35 + 0.65 * interference[c]) + tint[c] * 0.14,
      );
      for (let c = 0; c < 3; c++)
        channels[c] = channels[c] * (1 - filmAlpha) + edgeColors[c] * filmAlpha;
      alpha = alpha * (1 - filmAlpha) + filmAlpha;
      const reflectedWhite = [247, 250, 255];
      for (let c = 0; c < 3; c++)
        channels[c] =
          channels[c] * (1 - specularAlpha) + reflectedWhite[c] * specularAlpha;
      alpha = alpha * (1 - specularAlpha) + specularAlpha;
      const p = (y * size + x) * 4;
      for (let c = 0; c < 3; c++)
        pixels[p + c] = alpha ? channels[c] / alpha : 0;
      pixels[p + 3] = 255 * alpha * coverage;
    }
  }
  return pixels;
}

const films = new Map<string, string>();
/** Bounded in-memory material cache; no assets, photos or settings are persisted. */
export function soapFilmImage(
  color: string,
  neutral = false,
  revealed = false,
  emphasized = revealed,
) {
  const key = `${color.toLowerCase()}:${neutral}:${revealed}:${emphasized}`;
  const cached = films.get(key);
  if (cached) {
    films.delete(key);
    films.set(key, cached);
    return cached;
  }
  const size = 384;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    canvas.width = canvas.height = 0;
    return `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 100 100"><circle r="47" fill="#b8cbe4" fill-opacity=".08" stroke="#cdddf0" stroke-opacity=".3" stroke-width=".5"/><path d="M-37-18A41 41 0 0 1-11-39" fill="none" stroke="white" stroke-opacity=".6" stroke-width="1" stroke-linecap="round"/></svg>')}`;
  }
  const data = context.createImageData(size, size);
  data.data.set(renderSoapFilm(size, color, neutral, revealed, emphasized));
  context.putImageData(data, 0, 0);
  const url = canvas.toDataURL("image/png");
  canvas.width = canvas.height = 0;
  if (films.size >= 16) films.delete(films.keys().next().value!);
  films.set(key, url);
  return url;
}
