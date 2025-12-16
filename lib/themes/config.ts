/**
 * Theme Configuration
 *
 * Defines available themes for union homepages and tabs.
 * Each theme has a unique ID, display name, and description.
 */

export type ThemeId = 'default' | 'modern';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
}

export const themes: Record<ThemeId, ThemeConfig> = {
  default: {
    id: 'default',
    name: 'Classic',
    description: 'Facebook-style layout with cover photo, profile section, and tabs',
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Clean website style with hero banner and news-like posts',
  },
};

export const themeOptions: ThemeConfig[] = Object.values(themes);

export function getTheme(themeId: string): ThemeConfig {
  return themes[themeId as ThemeId] || themes.default;
}
