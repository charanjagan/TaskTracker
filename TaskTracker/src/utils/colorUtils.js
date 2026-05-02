/**
 * @param {string} hex #RRGGBB
 * @param {number} alpha 0-1
 */
export function hexWithAlpha(hex, alpha) {
  const h = String(hex).replace('#', '');
  if (h.length !== 6 || Number.isNaN(parseInt(h, 16))) {
    return `rgba(0,0,0,${alpha})`;
  }
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Pick readable text (#18181B or #FFFFFF) for text on a tinted pill using the base hex.
 * @param {string} hex
 */
export function contrastTextForPill(hex) {
  const h = String(hex).replace('#', '');
  if (h.length !== 6) return '#18181B';
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.55 ? '#18181B' : '#FFFFFF';
}
