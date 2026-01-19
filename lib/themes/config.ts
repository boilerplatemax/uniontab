/**
 * Theme Configuration
 *
 * Defines available themes for union homepages and tabs.
 * Each theme has a unique ID, display name, and description.
 * Premium themes require a paid subscription (Base or Plus plan).
 */

export type ThemeId = 'default' | 'modern' | 'prestige';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  isPremium?: boolean;
  requiredPlans?: string[];
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
  prestige: {
    id: 'prestige',
    name: 'Prestige',
    description: 'Premium dark theme with elegant glass effects and gold accents',
    isPremium: true,
    requiredPlans: ['Base', 'Plus'],
  },
};

export const themeOptions: ThemeConfig[] = Object.values(themes);

export const freeThemeOptions: ThemeConfig[] = Object.values(themes).filter(t => !t.isPremium);

export const premiumThemeOptions: ThemeConfig[] = Object.values(themes).filter(t => t.isPremium);

export function getTheme(themeId: string): ThemeConfig {
  return themes[themeId as ThemeId] || themes.default;
}

export function canAccessTheme(themeId: string, planName?: string | null): boolean {
  const theme = themes[themeId as ThemeId];
  if (!theme) return false;
  if (!theme.isPremium) return true;
  if (!planName || planName === 'Free') return false;
  if (theme.requiredPlans && theme.requiredPlans.length > 0) {
    return theme.requiredPlans.includes(planName);
  }
  return true;
}
