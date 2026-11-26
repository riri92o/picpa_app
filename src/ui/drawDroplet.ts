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
  const pigment = [1, 3, 5].map((i) => parseInt(tintHex.slice(i, i + 2), 16));
  const luminance = pigment.reduce(
    (sum, channel, i) => sum + channel * [0.2126, 0.7152, 0.0722][i],
    0,
  );
  // A clearer lens needs a little more chroma to keep neighboring pastel drops
  // distinguishable after the actual navy background is transmitted through it.
  const tint = pigment.map((channel) =>
    Math.max(0, Math.min(255, luminance + (channel - luminance) * 1.18)),
  );
  const pixels = new Uint8ClampedArray(size * size * 4);
  const radius = size * 0.47;
  const upperX = Math.cos(-2.3);
  const upperY = Math.sin(-2.3);
  const lowerX = Math.cos(0.92);
  const lowerY = Math.sin(0.92);

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
        facingKey > 0 ? Math.exp(-2 * ((u / 0.74) ** 2 + (v / 0.21) ** 2)) : 0;
      const windowBloom =
        facingKey > 0 ? Math.exp(-3 * ((u / 0.88) ** 2 + (v / 0.42) ** 2)) : 0;
      // Separate the crisp window from its faint bloom without clipping the
      // whole highlight into a flat white patch.
      const specular = Math.min(
        0.995,
        1 - (1 - windowLight * 1.16) * (1 - windowBloom * 0.1),
      );

      const keySide = clamp((-0.65 * nx - 0.76 * ny + 0.3) / 1.3);
      const innerShadow = 0.04 * rr * (1 - keySide);
      const tone = 0.83 + 0.14 * z + 0.07 * keySide - innerShadow;
      const wash = 0.34 + 0.22 * rr * rr * (0.6 + 0.4 * keySide);
      let alpha = wash;
      const channels = tint.map((channel) => channel * tone * wash);

      // Reflections break into lit arcs instead of an even frosted tube. The
      // lower arc is a colored transmission caustic, not a second white lamp.
      const inverseR = r > 1e-8 ? 1 / r : 0;
      const upperDot = Math.min(1, (nx * upperX + ny * upperY) * inverseR);
      const lowerDot = Math.min(1, (nx * lowerX + ny * lowerY) * inverseR);
      const upperArc = Math.exp((-2 * (1 - upperDot)) / 0.62 ** 2);
      const lowerArc = Math.exp((-2 * (1 - lowerDot)) / 0.58 ** 2);
      const fresnel = 0.018 + 0.982 * (1 - z) ** 2.1;
      const rim = fresnel * (0.075 + 0.56 * upperArc + 0.32 * lowerArc);
      const thickness = 435 + 85 * ny + 20 * Math.sin(nx * 2.7 + ny * 1.6);
      const phase =
        4 * Math.PI * 1.33 * thickness * Math.sqrt(1 - rr / (1.33 * 1.33));
      const wavelengths = [680, 550, 440];
      const environment = [176, 210, 234];
      for (let c = 0; c < 3; c++) {
        const interference = 0.5 + 0.5 * Math.cos(phase / wavelengths[c]);
        const edge =
          tint[c] * 0.5 + environment[c] * (0.25 + 0.25 * interference);
        channels[c] = channels[c] * (1 - rim) + edge * rim;
      }
      alpha = alpha * (1 - rim) + rim;

      const caustic = 0.36 * Math.exp(-(((r - 0.91) / 0.055) ** 2)) * lowerArc;
      const transmittedSky = [213, 237, 239];
      for (let c = 0; c < 3; c++) {
        const transmitted = tint[c] * 0.62 + transmittedSky[c] * 0.38;
        channels[c] = channels[c] * (1 - caustic) + transmitted * caustic;
      }
      alpha = alpha * (1 - caustic) + caustic;

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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 100 100"><defs><radialGradient id="body"><stop stop-color="${color}" stop-opacity=".34"/><stop offset=".7" stop-color="${color}" stop-opacity=".36"/><stop offset="1" stop-color="${color}" stop-opacity=".52"/></radialGradient><radialGradient id="light"><stop stop-color="#f7faff" stop-opacity=".98"/><stop offset=".3" stop-color="#f7faff" stop-opacity=".7"/><stop offset=".65" stop-color="#f7faff" stop-opacity=".07"/><stop offset="1" stop-color="#f7faff" stop-opacity="0"/></radialGradient><linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e0eafb" stop-opacity=".72"/><stop offset=".45" stop-color="${color}" stop-opacity=".1"/><stop offset="1" stop-color="#c5e3e5" stop-opacity=".48"/></linearGradient><linearGradient id="caustic" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#c5e3e5" stop-opacity="0"/><stop offset=".5" stop-color="#c5e3e5" stop-opacity=".5"/><stop offset="1" stop-color="#c5e3e5" stop-opacity="0"/></linearGradient></defs><circle r="47" fill="url(#body)" stroke="url(#rim)" stroke-width=".6"/><ellipse cx="-24" cy="-25" rx="20" ry="6.7" transform="rotate(-42 -24 -25)" fill="url(#light)"/><path d="M13 41 A43 43 0 0 0 41 13" fill="none" stroke="url(#caustic)" stroke-width="1.2" stroke-linecap="round"/></svg>`;
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
