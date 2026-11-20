export const nextFocusIndex = (activeIndex: number, length: number, backwards: boolean): number => {
  if (length === 0) return -1
  if (activeIndex < 0 || activeIndex >= length) return backwards ? length - 1 : 0

  return (activeIndex + (backwards ? -1 : 1) + length) % length
}
