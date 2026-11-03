const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** A transparent film over an undistorted photo. One upper-left softbox and a
 * thin, colored grazing-angle reflection leave the center completely clear.
 * Baked once per artwork, reused for every circle, then released by the caller. */
export function renderPhotoBubbleFilm(size: number, color: string) {
  const pixels = new Uint8ClampedArray(size * size * 4);
  const tint = [1, 3, 5].map((index) =>
    parseInt(color.slice(index, index + 2), 16),
  );
  const radius = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5 - radius) / radius;
      const ny = (y + 0.5 - radius) / radius;
      const rr = nx * nx + ny * ny;
      if (rr >= 1 || rr < 0.36) continue;
      const r = Math.sqrt(rr),
        z = Math.sqrt(1 - rr);
      const coverage = clamp((1 - r) * radius);
      const rx = 2 * z * nx,
        ry = 2 * z * ny,
        rz = 2 * z * z - 1;
      const facingKey = rx * -0.58 + ry * -0.64 + rz * -0.5;
      const u = rx * 0.741 + ry * -0.671;
      const v = rx * -0.335 + ry * -0.37 + rz * 0.866;
      const keySide = clamp((-0.65 * nx - 0.76 * ny + 0.3) / 1.3);
      const clearEdge = clamp((r - 0.6) / 0.08);
      const softbox =
        facingKey > 0
          ? Math.exp(-2 * ((u / 0.52) ** 2 + (v / 0.075) ** 2)) * 0.98 +
            Math.exp(-3 * ((u / 0.7) ** 2 + (v / 0.2) ** 2)) * 0.1
          : 0;
      const fresnel = 0.018 + 0.982 * (1 - z) ** 2.1;
      const outer = Math.exp(-(((1 - r) / 0.014) ** 2));
      const inner = Math.exp(-(((r - 0.967) / 0.016) ** 2));
      const film =
        clamp(fresnel * 0.16 + outer * (0.34 + keySide * 0.3) + inner * 0.13) *
        clearEdge;
      const specular = clamp(softbox + outer * keySide * 0.16) * clearEdge;
      const alpha = film * (1 - specular) + specular;
      // Thin-film interference varies smoothly with surface angle and thickness.
      // The actual daily color supplies most of the rim; rainbow is a reflection.
      const thickness = 420 + 125 * ny + 18 * Math.sin(nx * 2.8 + ny * 1.7);
      const phase =
        4 * Math.PI * 1.33 * thickness * Math.sqrt(1 - rr / 1.33 ** 2);
      const p = (y * size + x) * 4;
      for (const [c, wavelength] of [680, 550, 440].entries()) {
        const interference =
          55 + 200 * (0.5 + 0.5 * Math.cos(phase / wavelength));
        const rim = (tint[c] * 0.76 + 255 * 0.24) * 0.6 + interference * 0.4;
        pixels[p + c] = alpha
          ? (rim * film * (1 - specular) + 251 * specular) / alpha
          : 0;
      }
      pixels[p + 3] = 255 * alpha * coverage;
    }
  }
  return pixels;
}
