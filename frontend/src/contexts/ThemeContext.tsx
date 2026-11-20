import { createContext, useContext, useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { DEFAULT_THEME, THEME_STORAGE_KEY, nextTheme, parseTheme, resolveTheme } from '../utils/theme'
import type { ThemePreference } from '../utils/theme'

interface ThemeContextValue {
  preference: ThemePreference
  resolved: ReturnType<typeof resolveTheme>
  setPreference: (preference: ThemePreference) => void
  cycle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const systemThemeQuery = '(prefers-color-scheme: dark)'

const readPreference = () => {
  try {
    return parseTheme(window.localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    return DEFAULT_THEME
  }
}

const subscribeToSystemTheme = (onChange: () => void) => {
  const media = window.matchMedia(systemThemeQuery)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

const getSystemPrefersDark = () => window.matchMedia(systemThemeQuery).matches
const subscribeToFixedTheme = () => () => {}
const getFixedThemeSnapshot = () => false

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [preference, setPreference] = useState(readPreference)
  const followsSystem = preference === 'system'
  const systemPrefersDark = useSyncExternalStore(
    followsSystem ? subscribeToSystemTheme : subscribeToFixedTheme,
    followsSystem ? getSystemPrefersDark : getFixedThemeSnapshot,
  )
  const resolved = resolveTheme(preference, systemPrefersDark)

  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolved === 'dark')
    root.style.colorScheme = resolved
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', resolved === 'dark' ? '#0b1120' : '#2563eb')
  }, [resolved])

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference)
    } catch {
      // The preference still applies when storage is unavailable.
    }
  }, [preference])

  const cycle = () => setPreference(nextTheme)

  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference, cycle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const theme = useContext(ThemeContext)
  if (!theme) throw new Error('useTheme must be used within a ThemeProvider')
  return theme
}
