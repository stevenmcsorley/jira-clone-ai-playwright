import { useTheme } from '../../contexts/ThemeContext'
import { nextTheme, themeLabel } from '../../utils/theme'

const iconPaths = {
  dark: 'M20.9 13.3A9 9 0 0 1 10.7 3.1 9 9 0 1 0 20.9 13.3Z',
  light: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5',
  system: 'M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm8 13v4m-4 0h8',
}

export const ThemeToggle = ({ className = '' }: { className?: string }) => {
  const { preference, cycle } = useTheme()
  const label = `Theme: ${themeLabel(preference)}. Switch to ${themeLabel(nextTheme(preference))}`

  return (
    <button
      type="button"
      onClick={cycle}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 md:size-9 ${className}`}
      aria-label={label}
      title={label}
      data-testid="theme-toggle"
    >
      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path d={iconPaths[preference]} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
