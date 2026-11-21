/** True when at least one value in the chart is above zero, so a flat axis is not mistaken for a report. */
export const chartHasData = (data: { datasets: Array<{ data: unknown[] }> }): boolean =>
  data.datasets.some(d => d.data.some(v => {
    const n = typeof v === 'number' ? v : Number((v as { y?: number } | null)?.y ?? v)
    return Number.isFinite(n) && n > 0
  }))


type Scale = { grid?: object; ticks?: object; border?: object }

/**
 * The house look for every report chart, applied before the theme colours: no vertical grid lines, quiet horizontal
 * ones, no axis frame, labels that never rotate and never crowd (a long date axis is thinned, not squeezed).
 */
export const withReportStyle = <T extends object>(options: T): T => {
  const scales = (options as { scales?: Record<string, Scale> }).scales
  // Lines are drawn without point markers (they appear on hover), so a long series reads as a line, not a string of dots.
  const elements = { point: { radius: 0, hoverRadius: 4 }, line: { borderWidth: 2 }, ...(options as { elements?: object }).elements }
  if (!scales) return { ...options, elements } as T
  return {
    ...options,
    elements,
    scales: Object.fromEntries(Object.entries(scales).map(([id, scale]) => [id, id === 'x'
      ? { ...scale, grid: { ...scale.grid, display: false }, border: { ...scale.border, display: false }, ticks: { ...scale.ticks, autoSkip: true, maxRotation: 0, maxTicksLimit: 10 } }
      : { ...scale, border: { ...scale.border, display: false }, ticks: { ...scale.ticks, padding: 8 } }])),
  } as T
}
