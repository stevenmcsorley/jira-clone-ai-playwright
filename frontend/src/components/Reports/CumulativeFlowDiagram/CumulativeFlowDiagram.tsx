/**
 * Cumulative Flow Diagram Component
 *
 * Shows the statuses of project issues over time.
 * Identifies bottlenecks and workflow accumulation patterns.
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTheme } from '../../../contexts/ThemeContext'
import { chartHasData, EmptyChart, withReportStyle } from '../kit'
import { ReportsLayout } from '../../../pages/Reports/Reports'
import { applyChartTheme } from '../../../utils/chartTheme'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import type { ChartOptions } from 'chart.js'
import { Line } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface CFDData {
  date: string
  todo: number
  inProgress: number
  codeReview: number
  done: number
  total: number
}

interface CFDMetrics {
  avgCycleTime: number
  avgThroughput: number
  currentWIP: number
  bottleneckStatus: string | null
  wipTrend: 'increasing' | 'decreasing' | 'stable'
}

export const CumulativeFlowDiagram = () => (
  <ReportsLayout>
    <CumulativeFlowDiagramContent />
  </ReportsLayout>
)

const CumulativeFlowDiagramContent = () => {
  const { resolved } = useTheme()
  const { projectId } = useParams<{ projectId: string }>()
  const [cfdData, setCfdData] = useState<CFDData[]>([])
  const [metrics, setMetrics] = useState<CFDMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(30) // days
  const [error, setError] = useState<string | null>(null)

  // Fetch CFD data
  useEffect(() => {
    const fetchCFDData = async () => {
      if (!projectId) return

      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/analytics/cumulative-flow/${projectId}?days=${timeRange}`)

        if (!response.ok) {
          throw new Error('Failed to fetch CFD data')
        }

        const data = await response.json()
        setCfdData(data.chartData || [])
        setMetrics(data.metrics || null)
      } catch (error) {
        console.error('Error fetching CFD data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchCFDData()
  }, [projectId, timeRange])

  // Chart configuration - stacked cumulative areas, one band per status.
  // Done sits at the bottom of the stack (dataset 0, fill to origin); each
  // subsequent band fills down to the previous dataset ('-1') and the y axis
  // is stacked so the top edge of "To Do" is the total issue count.
  const chartData = {
    labels: cfdData.map(d => {
      const date = new Date(d.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'Done',
        data: cfdData.map(d => d.done),
        backgroundColor: 'rgba(134, 201, 143, 0.3)',
        borderColor: 'rgb(134, 201, 143)',
        borderWidth: 2,
        fill: 'origin' as const,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 4
      },
      {
        label: 'Code Review',
        data: cfdData.map(d => d.codeReview),
        backgroundColor: 'rgba(155, 152, 143, 0.3)',
        borderColor: 'rgb(155, 152, 143)',
        borderWidth: 2,
        fill: '-1' as const,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 4
      },
      {
        label: 'In Progress',
        data: cfdData.map(d => d.inProgress),
        backgroundColor: 'rgba(207, 192, 138, 0.3)',
        borderColor: 'rgb(207, 192, 138)',
        borderWidth: 2,
        fill: '-1' as const,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 4
      },
      {
        label: 'To Do',
        data: cfdData.map(d => d.todo),
        backgroundColor: 'rgba(156, 163, 175, 0.4)',
        borderColor: 'rgb(156, 163, 175)',
        borderWidth: 2,
        fill: '-1' as const,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 4
      }
    ]
  }

  const chartOptions = useMemo<ChartOptions<'line'>>(() => {
    const isPhone = window.matchMedia('(max-width: 639px)').matches

    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: isPhone ? 'bottom' : 'top', align: 'end' as const, labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8, padding: 16 } },
          title: {
            display: false,
            text: 'Cumulative Flow Diagram',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            mode: 'index' as const,
            intersect: false,
            callbacks: {
              label: function(context: any) {
                return `${context.dataset.label}: ${context.parsed.y} issues`
              },
              footer: function(tooltipItems: any[]) {
                const dataIndex = tooltipItems[0].dataIndex
                const data = cfdData[dataIndex]
                return `Total: ${data.total} issues`
              }
            }
          }
        },
        scales: {
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              precision: 0
            },
            title: {
            display: false,
              text: 'Number of Issues'
            }
          },
          x: {
            ticks: isPhone ? { maxRotation: 45, autoSkip: true } : undefined,
            title: {
            display: false,
              text: 'Date'
            }
          }
        },
        interaction: {
          mode: 'nearest' as const,
          axis: 'x' as const,
          intersect: false
        }
    }
  }, [cfdData])
  const themedOptions = useMemo(() => applyChartTheme(withReportStyle(chartOptions), resolved), [chartOptions, resolved])

  if (loading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading report"
        className="h-64 motion-safe:animate-pulse rounded-lg bg-gray-100"
      />
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">
          <p className="font-medium">Error loading cumulative flow data</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cumulative Flow Diagram</h1>
          <p className="text-gray-600 mt-1">
            Shows the statuses of your project's issues over time. Identify bottlenecks in your workflow.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="time-range" className="text-sm font-medium text-gray-700">
            Time Range:
          </label>
          <select
            id="time-range"
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="min-w-0 border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={14}>Last 2 weeks</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 md:grid-cols-4 [&>*:last-child:nth-child(odd)]:col-span-2 md:[&>*:last-child:nth-child(odd)]:col-span-1">
          <div className="bg-white px-4 py-3">
            <div className="text-sm font-medium text-gray-500">Avg Cycle Time</div>
            <div className="text-2xl font-semibold tabular-nums text-gray-900">{metrics.avgCycleTime}</div>
            <div className="text-sm text-gray-500">days</div>
          </div>

          <div className="bg-white px-4 py-3">
            <div className="text-sm font-medium text-gray-500">Avg Throughput</div>
            <div className="text-2xl font-semibold tabular-nums text-gray-900">{metrics.avgThroughput}</div>
            <div className="text-sm text-gray-500">issues/week</div>
          </div>

          <div className="bg-white px-4 py-3">
            <div className="text-sm font-medium text-gray-500">Current WIP</div>
            <div className="text-2xl font-semibold tabular-nums text-gray-900">{metrics.currentWIP}</div>
            <div className="text-sm text-gray-500">in progress + review</div>
          </div>

          <div className="bg-white px-4 py-3">
            <div className="text-sm font-medium text-gray-500">WIP Trend</div>
            <div className={`text-2xl font-semibold ${metrics.wipTrend === 'increasing' ? 'text-red-600' : 'text-gray-900'}`}>
              {metrics.wipTrend === 'increasing' ? 'Rising' : metrics.wipTrend === 'decreasing' ? 'Falling' : 'Steady'}
            </div>
            <div className="text-sm text-gray-500">work in progress</div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
        {cfdData.length === 0 || cfdData.every(d => d.total === 0) ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="font-medium text-gray-900">No issue activity in this time range</p>
            <p className="text-sm text-gray-500 mt-1">
              Create issues or pick a wider time range to see the cumulative flow of work.
            </p>
          </div>
        ) : (
          <div className="relative h-72 sm:h-96">
            {chartHasData(chartData) ? <Line data={chartData} options={themedOptions} /> : <EmptyChart message="No issue history in this range yet." />}
          </div>
        )}
      </div>

      {/* Insights */}
      {metrics && (
        <div className="hidden has-[.insight]:block bg-white p-4 md:p-6 rounded-lg border border-gray-200">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Workflow Insights</h2>
          <div className="space-y-3">

            {/* Bottleneck Detection */}
            {metrics.bottleneckStatus && (
              <div className="insight flex items-start gap-3">
                <div className="mt-2 size-1.5 shrink-0 rounded-full bg-gray-400"></div>
                <div>
                  <div className="font-medium text-gray-900">Bottleneck Detected</div>
                  <div className="text-sm text-gray-600">
                    Issues are accumulating in "{metrics.bottleneckStatus}" status.
                    Consider reviewing team capacity and removing impediments.
                  </div>
                </div>
              </div>
            )}

            {/* WIP Trend Analysis */}
            {metrics.wipTrend === 'increasing' && (
              <div className="insight flex items-start gap-3">
                <div className="mt-2 size-1.5 shrink-0 rounded-full bg-gray-400"></div>
                <div>
                  <div className="font-medium text-gray-900">Rising Work in Progress</div>
                  <div className="text-sm text-gray-600">
                    WIP is increasing ({metrics.currentWIP} issues). Consider limiting parallel work
                    and focusing on completion over starting new work.
                  </div>
                </div>
              </div>
            )}

            {metrics.wipTrend === 'decreasing' && (
              <div className="insight flex items-start gap-3">
                <div className="mt-2 size-1.5 shrink-0 rounded-full bg-gray-400"></div>
                <div>
                  <div className="font-medium text-gray-900">Healthy WIP Reduction</div>
                  <div className="text-sm text-gray-600">
                    Work in progress is decreasing, indicating good flow and completion focus.
                  </div>
                </div>
              </div>
            )}

            {/* Cycle Time Analysis */}
            {metrics.avgCycleTime > 10 && (
              <div className="insight flex items-start gap-3">
                <div className="mt-2 size-1.5 shrink-0 rounded-full bg-gray-400"></div>
                <div>
                  <div className="font-medium text-gray-900">Long Cycle Time</div>
                  <div className="text-sm text-gray-600">
                    Average cycle time is {metrics.avgCycleTime} days.
                    Consider breaking down issues into smaller tasks for faster delivery.
                  </div>
                </div>
              </div>
            )}

            {metrics.avgCycleTime <= 5 && (
              <div className="insight flex items-start gap-3">
                <div className="mt-2 size-1.5 shrink-0 rounded-full bg-gray-400"></div>
                <div>
                  <div className="font-medium text-gray-900">Efficient Cycle Time</div>
                  <div className="text-sm text-gray-600">
                    Average cycle time of {metrics.avgCycleTime} days indicates efficient workflow and good task sizing.
                  </div>
                </div>
              </div>
            )}

            {/* Throughput Analysis */}
            {metrics.avgThroughput < 2 && (
              <div className="insight flex items-start gap-3">
                <div className="mt-2 size-1.5 shrink-0 rounded-full bg-gray-400"></div>
                <div>
                  <div className="font-medium text-gray-900">Low Throughput</div>
                  <div className="text-sm text-gray-600">
                    Team is completing {metrics.avgThroughput} issues per week.
                    Consider investigating blockers and optimizing the development process.
                  </div>
                </div>
              </div>
            )}

            {!metrics.bottleneckStatus && metrics.wipTrend === 'stable' && metrics.avgCycleTime <= 7 && (
              <div className="insight flex items-start gap-3">
                <div className="mt-2 size-1.5 shrink-0 rounded-full bg-gray-400"></div>
                <div>
                  <div className="font-medium text-gray-900">Healthy Flow</div>
                  <div className="text-sm text-gray-600">
                    Your workflow appears healthy with stable WIP, good cycle time, and no apparent bottlenecks.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}