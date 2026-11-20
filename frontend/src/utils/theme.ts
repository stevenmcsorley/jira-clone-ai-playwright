export type ThemePreference = 'dark' | 'light' | 'system'

export const THEME_STORAGE_KEY = 'ossicone-theme'
export const DEFAULT_THEME: ThemePreference = 'dark'

export const parseTheme = (value: unknown): ThemePreference =>
  value === 'dark' || value === 'light' || value === 'system' ? value : DEFAULT_THEME

export const resolveTheme = (pref: ThemePreference, systemPrefersDark: boolean): 'dark' | 'light' =>
  pref === 'system' ? (systemPrefersDark ? 'dark' : 'light') : pref

const nextPreferences: Record<ThemePreference, ThemePreference> = {
  dark: 'light',
  light: 'system',
  system: 'dark',
}

export const nextTheme = (pref: ThemePreference): ThemePreference => nextPreferences[pref]

const labels: Record<ThemePreference, string> = {
  dark: 'Dark',
  light: 'Light',
  system: 'System',
}

export const themeLabel = (pref: ThemePreference): string => labels[pref]
