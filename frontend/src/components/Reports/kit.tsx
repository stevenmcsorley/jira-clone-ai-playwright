import { BarChart3 } from 'lucide-react'
import { Chart as ChartJS } from 'chart.js'

ChartJS.defaults.font.family = '"Geist", system-ui, sans-serif'
ChartJS.defaults.font.size = 12

export { chartHasData, withReportStyle } from '../../utils/reportChart'

/** What a report says when there is nothing to draw: why, and what fills it in. */
export const EmptyChart = ({ message }: { message: string }) => (
  <div className="flex h-full flex-col items-center justify-center gap-2 text-center" data-testid="empty-chart">
    <BarChart3 className="size-8 text-gray-400" strokeWidth={1.5} aria-hidden="true" />
    <p className="max-w-sm text-sm text-gray-500">{message}</p>
  </div>
)
