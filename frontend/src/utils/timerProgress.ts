/** How far a task's time has run against its estimate, for the progress bar. */
export const getTimerProgress = (
  elapsed: number, // milliseconds
  estimate: number, // hours
): {
  percentage: number
  color: 'green' | 'yellow' | 'red'
  elapsedHours: number
  remainingHours: number
} => {
  const elapsedHours = elapsed / (1000 * 60 * 60)
  const percentage = estimate > 0 ? (elapsedHours / estimate) * 100 : 0

  let color: 'green' | 'yellow' | 'red' = 'green'
  if (percentage > 110) color = 'red'
  else if (percentage > 90) color = 'yellow'

  return {
    percentage: Math.min(percentage, 100),
    color,
    elapsedHours: Math.round(elapsedHours * 10) / 10,
    remainingHours: Math.max(0, estimate - elapsedHours),
  }
}

/** 4_320_000 -> "1:12:00"; under an hour "12:00"; under a minute "0:42". */
export const formatClock = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`
  return `${minutes}:${pad(seconds)}`
}
