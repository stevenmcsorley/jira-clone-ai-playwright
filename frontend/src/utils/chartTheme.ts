export type ChartThemeName = 'light' | 'dark'

export const chartTheme = (name: ChartThemeName) => name === 'dark' ? {
  text: '#dfdcd2',
  mutedText: '#9b988f',
  grid: 'rgba(155,152,143,0.16)',
  border: 'rgba(155,152,143,0.28)',
  tooltipBackground: '#1d1d1b',
  tooltipText: '#efede5',
  tooltipBorder: 'rgba(155,152,143,0.3)',
} : {
  text: '#3f3e38',
  mutedText: '#6f6c63',
  grid: 'rgba(24,24,22,0.08)',
  border: 'rgba(24,24,22,0.15)',
  tooltipBackground: '#181816',
  tooltipText: '#f7f6f2',
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
