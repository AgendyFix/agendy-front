/** Texto legible (oscuro o claro) sobre un fondo #RRGGBB, según luminancia relativa WCAG. */
export function pickTextOn(hex: string): "#111111" | "#FFFFFF" {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#FFFFFF";
  const n = parseInt(m[1], 16);
  const lin = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  // Con luminancia > ~0.18 el contraste es mayor con texto oscuro que con blanco
  return luminance > 0.18 ? "#111111" : "#FFFFFF";
}
