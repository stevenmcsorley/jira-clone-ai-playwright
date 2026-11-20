import { useEffect } from 'react'
import type { RefObject } from 'react'
import { nextFocusIndex } from '../utils/focusCycle'

const getTabStops = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]'))
    .filter(element =>
      element.tabIndex >= 0 &&
      !element.matches(':disabled') &&
      element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility === 'visible'
    )

export const useFocusTrap = (
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  initialFocusSelector?: string,
) => {
  useEffect(() => {
    const container = ref.current
    if (!active || !container) return

    const trigger = triggerRef.current
    const initialFocus = initialFocusSelector
      ? container.querySelector<HTMLElement>(initialFocusSelector)
      : getTabStops(container)[0]
    const firstTarget = initialFocus ?? container
    firstTarget.focus({ preventScroll: true })

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const tabStops = getTabStops(container)
      const activeIndex = tabStops.findIndex(element => element === document.activeElement)
      const next = nextFocusIndex(activeIndex, tabStops.length, event.shiftKey)
      event.preventDefault()
      const target = tabStops[next] ?? container
      target.focus()
    }

    document.addEventListener('keydown', handleTab)
    return () => {
      document.removeEventListener('keydown', handleTab)
      trigger?.focus({ preventScroll: true })
    }
  }, [ref, active, triggerRef, initialFocusSelector])
}
