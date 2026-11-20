export type ChartThemeName = 'light' | 'dark'

export const chartTheme = (name: ChartThemeName) => name === 'dark' ? {
  text: '#dbe2ec',
  mutedText: '#94a3b8',
  grid: 'rgba(148,163,184,0.16)',
  border: 'rgba(148,163,184,0.28)',
  tooltipBackground: '#1e293b',
  tooltipText: '#f1f5f9',
  tooltipBorder: 'rgba(148,163,184,0.3)',
} : {
  text: '#374151',
  mutedText: '#6b7280',
  grid: 'rgba(17,24,39,0.08)',
  border: 'rgba(17,24,39,0.15)',
  tooltipBackground: '#111827',
  tooltipText: '#f9fafb',
  tooltipBorder: 'rgba(255,255,255,0.1)',
}

type ScaleOptions = {
  ticks?: object
  grid?: object
  border?: object
  title?: object
}

type ThemeableOptions = {
  scales?: Record<string, ScaleOptions>
  plugins?: false | {
    legend?: false | { labels?: object }
    title?: false | object
    tooltip?: false | object
  }
}

export const applyChartTheme = <T extends object,>(options: T, name: ChartThemeName): T => {
  const theme = chartTheme(name)
  const { scales, plugins } = options as ThemeableOptions

  return {
    ...options,
    color: theme.text,
    ...(scales && {
      scales: Object.fromEntries(Object.entries(scales).map(([id, scale]) => [id, {
        ...scale,
        ticks: { ...scale.ticks, color: theme.mutedText },
        grid: { ...scale.grid, color: theme.grid },
        border: { ...scale.border, color: theme.border },
        title: { ...scale.title, color: theme.text },
      }])),
    }),
    plugins: plugins === false ? false : {
      ...plugins,
      legend: plugins?.legend === false ? false : {
        ...plugins?.legend,
        labels: { ...plugins?.legend?.labels, color: theme.text },
      },
      title: plugins?.title === false ? false : { ...plugins?.title, color: theme.text },
      tooltip: plugins?.tooltip === false ? false : {
        ...plugins?.tooltip,
        backgroundColor: theme.tooltipBackground,
        titleColor: theme.tooltipText,
        bodyColor: theme.tooltipText,
        borderColor: theme.tooltipBorder,
      },
    },
  }
}
