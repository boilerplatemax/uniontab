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
