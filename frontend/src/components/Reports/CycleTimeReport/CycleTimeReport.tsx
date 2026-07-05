/**
 * Cycle Time Report Component
 *
 * Shows how long completed issues took from starting work to done.
 * Backed by GET /api/analytics/cycle-time/:projectId which derives timings
 * from the issue activity history (issue_events) where available.
 */

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import type { ChartOptions } from 'chart.js'
import { Bar } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface CycleTimeDatapoint {
  issueId: number
  title: string
  type: string
  priority: string
  completedAt: string
  cycleTimeDays: number
  source: 'events' | 'timestamps'
}

interface CycleTimeStats {
  count: number
  averageDays: number
  medianDays: number
  p85Days: number
}

interface CycleTimeTrendPoint {
  period: string
  averageDays: number
  count: number
}

interface CycleTimeReportData {
  datapoints: CycleTimeDatapoint[]
  stats: CycleTimeStats
  trend: CycleTimeTrendPoint[]
}

const MAX_CHART_ISSUES = 30

export const CycleTimeReport = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const [report, setReport] = useState<CycleTimeReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState(180) // days

  useEffect(() => {
    const fetchCycleTimeData = async () => {
      if (!projectId) return

      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/analytics/cycle-time/${projectId}?days=${timeRange}`)

        if (!response.ok) {
          throw new Error('Failed to fetch cycle time data')
        }

        const data: CycleTimeReportData = await response.json()
        setReport(data)
      } catch (err) {
        console.error('Error fetching cycle time data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchCycleTimeData()
  }, [projectId, timeRange])

  const datapoints = report?.datapoints ?? []
  const stats = report?.stats ?? null

  // Most recently completed issues, oldest first so the chart reads left to right
  const chartPoints = datapoints.slice(-MAX_CHART_ISSUES)

  const chartData = {
    labels: chartPoints.map(d =>
      d.title.length > 24 ? `${d.title.slice(0, 24)}…` : d.title
    ),
    datasets: [
      {
        label: 'Cycle time (days)',
        data: chartPoints.map(d => d.cycleTimeDays),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }
    ]
  }

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: `Cycle Time of Recently Completed Issues${datapoints.length > MAX_CHART_ISSUES ? ` (last ${MAX_CHART_ISSUES})` : ''}`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const point = chartPoints[context.dataIndex]
            const completed = new Date(point.completedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
            const basis = point.source === 'events' ? 'status history' : 'created/updated timestamps'
            return [
              `Cycle time: ${point.cycleTimeDays} days`,
              `Completed: ${completed}`,
              `Based on: ${basis}`
            ]
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Days'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Issue'
        },
        ticks: {
          maxRotation: 60,
          minRotation: 30
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading cycle time data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">
          <p className="font-medium">Error loading cycle time data</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cycle Time Report</h1>
          <p className="text-gray-600 mt-1">
            Cycle time is how long an issue takes from when work starts (moved to In Progress)
            until it is Done. Shorter, consistent cycle times mean faster, more predictable delivery.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="time-range" className="text-sm font-medium text-gray-700">
            Completed within:
          </label>
          <select
            id="time-range"
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 6 months</option>
            <option value={365}>Last year</option>
          </select>
        </div>
      </div>

      {stats && stats.count > 0 ? (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-500">Average</div>
              <div className="text-2xl font-bold text-gray-900">{stats.averageDays}</div>
              <div className="text-sm text-gray-500">days</div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-500">Median</div>
              <div className="text-2xl font-bold text-blue-600">{stats.medianDays}</div>
              <div className="text-sm text-gray-500">days</div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-500">85th Percentile</div>
              <div className="text-2xl font-bold text-purple-600">{stats.p85Days}</div>
              <div className="text-sm text-gray-500">days (85% ship faster)</div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-500">Completed Issues</div>
              <div className="text-2xl font-bold text-green-600">{stats.count}</div>
              <div className="text-sm text-gray-500">in selected range</div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div style={{ height: '400px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Monthly trend */}
          {report && report.trend.length > 1 && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Trend</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Cycle Time (days)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issues Completed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.trend.map((point) => (
                      <tr key={point.period}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {point.period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {point.averageDays}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {point.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty state */
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="font-medium text-gray-900">No completed issues in this time range</p>
            <p className="text-sm text-gray-500 mt-1">
              Cycle time is measured on Done issues. Complete some issues, or widen the time range,
              and this report will fill in.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
