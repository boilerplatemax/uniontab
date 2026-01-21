/**
 * Calculate contrast color (black or white) based on background color for accessibility.
 * Uses WCAG relative luminance formula.
 * @param hexColor - Hex color string (with or without #)
 * @returns '#000000' for light backgrounds, '#ffffff' for dark backgrounds
 */
export function getContrastColor(hexColor: string): string {
  // Remove # if present and handle invalid inputs
  const hex = hexColor.replace('#', '');

  if (hex.length !== 6) {
    return '#ffffff'; // Default to white for invalid colors
  }

  // Parse RGB values
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Validate parsed values
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return '#ffffff';
  }

  // Calculate relative luminance using WCAG formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Default theme color for unions (blue)
 */
export const DEFAULT_THEME_COLOR = '#2563eb';

/**
 * Convert hex color to HSL values
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
  const b = parseInt(cleanHex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL values to hex color
 */
function hslToHex(h: number, s: number, l: number): string {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  const hueToRgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate a very light tint of a color (for backgrounds)
 * @param hexColor - Hex color string (with or without #)
 * @param lightness - Target lightness (0-100), default 97 for very light
 * @returns Hex color string for the light tint
 */
export function getLightTint(hexColor: string, lightness: number = 97): string {
  const hex = hexColor.replace('#', '');

  if (hex.length !== 6) {
    return '#FFF1F2'; // Default fallback
  }

  const hsl = hexToHsl(hexColor);
  // Keep the hue and reduce saturation for a subtle tint
  return hslToHex(hsl.h, Math.min(hsl.s, 60), lightness);
}

/**
 * Generate a darker shade of a color (for gradients)
 * @param hexColor - Hex color string (with or without #)
 * @param amount - Amount to darken (0-100), default 15
 * @returns Hex color string for the darker shade
 */
export function getDarkerShade(hexColor: string, amount: number = 15): string {
  const hex = hexColor.replace('#', '');

  if (hex.length !== 6) {
    return hexColor; // Return original for invalid colors
  }

  const hsl = hexToHsl(hexColor);
  return hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - amount));
}
