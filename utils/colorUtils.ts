/**
 * Parses a hex color string and returns its RGB components.
 * Supports both shorthand (#rgb) and full (#rrggbb) formats.
 */
function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');

  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }

  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }

  return null;
}

/**
 * Returns a legible text color for a given background hex color.
 * Uses the WCAG relative luminance formula to pick between dark and light text.
 *
 * @param hexColor - A hex color string (e.g. '#ff0000' or '#f00').
 * @returns '#111111' for light backgrounds, '#ffffff' for dark ones.
 */
export function getContrastColor(hexColor: string): string {
  const rgb = parseHex(hexColor);

  if (!rgb) return '#111111';

  // Linearize sRGB channels per WCAG 2.1
  const toLinear = (channel: number): number => {
    const srgb = channel / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };

  const luminance = 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);

  return luminance > 0.179 ? '#111111' : '#ffffff';
}
