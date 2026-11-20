import { useEffect } from 'react'

export const useEscapeKey = (active: boolean, onEscape: () => void) => {
  useEffect(() => {
    if (!active) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      onEscape()
    }

    // Handle Escape before controls inside the overlay, such as GlobalSearch.
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [active, onEscape])
}
