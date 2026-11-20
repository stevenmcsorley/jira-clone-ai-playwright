import { useEffect } from 'react'

export const useBodyScrollLock = (active: boolean) => {
  useEffect(() => {
    if (!active) return

    const { style } = document.body
    const previousOverflow = style.overflow
    style.overflow = 'hidden'
    return () => {
      style.overflow = previousOverflow
    }
  }, [active])
}
