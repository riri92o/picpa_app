const clamp = (value: number) => Math.max(0, Math.min(1, value));
const canonicalColor = (color: string) =>
  typeof color === "string" && /^#[\da-f]{6}$/i.test(color)
    ? color.toLowerCase()
    : "#b8cbe4";

/** Draw-only droplets have a wider reflected environment than the larger daily
 * color sphere. This keeps its soft highlight readable at 30–38 CSS pixels.
 * Pixels are returned as ordinary, unpremultiplied RGBA. */
export function renderDrawDroplet(
  size: number,
  color: string,
): Uint8ClampedArray {
  const tintHex = canonicalColor(color);
  const tint = [1, 3, 5].map((i) => parseInt(tintHex.slice(i, i + 2), 16));
  const pixels = new Uint8ClampedArray(size * size * 4);
  const radius = size * 0.47;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5 - size / 2) / radius;
      const ny = (y + 0.5 - size / 2) / radius;
      const rr = nx * nx + ny * ny;
      if (rr >= 1) continue;
      const r = Math.sqrt(rr);
      const z = Math.sqrt(1 - rr);
      const coverage = clamp((1 - r) * radius);

      // The same upper-left softbox as the existing sphere material. Reflection
      // coordinates curve the highlight along the surface instead of painting
      // a fixed white ellipse onto its face.
      const rx = 2 * z * nx;
      const ry = 2 * z * ny;
      const rz = 2 * z * z - 1;
      const facingKey = rx * -0.656 + ry * -0.727 + rz * -0.202;
      const u = rx * 0.742 + ry * -0.67;
      const v = rx * -0.135 + ry * -0.15 + rz * 0.979;
      const windowLight =
        facingKey > 0 ? Math.exp(-2 * ((u / 0.64) ** 2 + (v / 0.28) ** 2)) : 0;
      const windowBloom =
        facingKey > 0 ? Math.exp(-3 * ((u / 0.9) ** 2 + (v / 0.44) ** 2)) : 0;
      const specular = clamp(windowLight * 1.5 + windowBloom * 0.1);

      const keySide = clamp((-0.65 * nx - 0.76 * ny + 0.3) / 1.3);
      const innerShadow =
        0.13 * Math.exp(-(((r - 0.85) / 0.09) ** 2)) * (1 - keySide);
      const tone = 0.72 + 0.21 * z + 0.1 * keySide - innerShadow;
      const wash = 0.4 + 0.22 * rr;
      let alpha = wash;
      const channels = tint.map((channel) => channel * tone * wash);

      // A restrained colored fringe sits at grazing angles. Its body stays
      // transparent; the opposite inner edge is softly shaded like a water lens.
      const fresnel = 0.018 + 0.982 * (1 - z) ** 2.1;
      const rim = fresnel * (0.23 + 0.5 * keySide + 0.1 * clamp(ny));
      const thickness = 435 + 85 * ny + 20 * Math.sin(nx * 2.7 + ny * 1.6);
      const phase =
        4 * Math.PI * 1.33 * thickness * Math.sqrt(1 - rr / (1.33 * 1.33));
      const wavelengths = [680, 550, 440];
      const environment = [176, 210, 234];
      for (let c = 0; c < 3; c++) {
        const interference = 0.5 + 0.5 * Math.cos(phase / wavelengths[c]);
        const edge =
          environment[c] * (0.45 + 0.55 * interference) + tint[c] * 0.13;
        channels[c] = channels[c] * (1 - rim) + edge * rim;
      }
      alpha = alpha * (1 - rim) + rim;

      const reflectedWhite = [247, 250, 255];
      for (let c = 0; c < 3; c++)
        channels[c] =
          channels[c] * (1 - specular) + reflectedWhite[c] * specular;
      alpha = alpha * (1 - specular) + specular;

      const index = (y * size + x) * 4;
      for (let c = 0; c < 3; c++)
        pixels[index + c] = alpha ? channels[c] / alpha : 0;
      pixels[index + 3] = 255 * alpha * coverage;
    }
  }
  return pixels;
}

const droplets = new Map<string, string>();

function fallbackDroplet(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 100 100"><defs><radialGradient id="body" cx="30%" cy="22%" r="84%"><stop stop-color="${color}" stop-opacity=".72"/><stop offset=".58" stop-color="${color}" stop-opacity=".5"/><stop offset="1" stop-color="${color}" stop-opacity=".68"/></radialGradient><radialGradient id="light"><stop stop-color="#f7faff" stop-opacity=".9"/><stop offset=".35" stop-color="#f7faff" stop-opacity=".45"/><stop offset="1" stop-color="#f7faff" stop-opacity="0"/></radialGradient></defs><circle r="47" fill="url(#body)" stroke="#d3e4f1" stroke-opacity=".42" stroke-width=".7"/><ellipse cx="-24" cy="-25" rx="19" ry="8" transform="rotate(-42 -24 -25)" fill="url(#light)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Bounded, draw-only material cache; no photograph, stored color or daily-color
 * sphere is modified. The temporary raster canvas is released immediately. */
export function drawDropletImage(color: string): string {
  const key = canonicalColor(color);
  const cached = droplets.get(key);
  if (cached) {
    droplets.delete(key);
    droplets.set(key, cached);
    return cached;
  }
  let canvas: HTMLCanvasElement | undefined;
  let image: string;
  try {
    if (typeof document === "undefined") throw new Error("Canvas unavailable");
    canvas = document.createElement("canvas");
    const size = 256;
    canvas.width = canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    const data = context.createImageData(size, size);
    data.data.set(renderDrawDroplet(size, key));
    context.putImageData(data, 0, 0);
    image = canvas.toDataURL("image/png");
  } catch {
    image = fallbackDroplet(key);
  } finally {
    if (canvas) canvas.width = canvas.height = 0;
  }
  if (droplets.size >= 8) droplets.delete(droplets.keys().next().value!);
  droplets.set(key, image);
  return image;
}
