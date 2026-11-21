/**
 * Burnup Report Component
 *
 * Visualizes sprint progress by showing completed work vs total scope.
 * Tracks scope changes and completion trends throughout the sprint.
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

interface BurnupData {
  date: string
  completed: number
  totalScope: number
  scopeAdded: number
}

interface Sprint {
  id: number
  name: string
  startDate: string
  endDate: string
  status: string
}

export const BurnupReport = () => (
  <ReportsLayout>
    <BurnupReportContent />
  </ReportsLayout>
)

const BurnupReportContent = () => {
  const { resolved } = useTheme()
  const { projectId } = useParams<{ projectId: string }>()
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [burnupData, setBurnupData] = useState<BurnupData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch sprints for project
  useEffect(() => {
    const fetchSprints = async () => {
      try {
        const response = await fetch(`/api/sprints?projectId=${projectId}`)
        const sprintData = await response.json()
        setSprints(sprintData)

        // Select most recently worked sprint (completed first, then active)
        const completedSprints = sprintData.filter((s: Sprint) => s.status === 'completed')
        // Get the LAST completed sprint (most recent)
        const mostRecentCompleted = completedSprints.length > 0 ? completedSprints[completedSprints.length - 1] : null
        const activeSprint = sprintData.find((s: Sprint) => s.status === 'active')

        const defaultSprint = mostRecentCompleted || activeSprint || sprintData[0]

        if (defaultSprint) {
          setSelectedSprint(defaultSprint)
        }
      } catch (error) {
        console.error('Error fetching sprints:', error)
      }
    }

    if (projectId) {
      fetchSprints()
    }
  }, [projectId])

  // Generate burnup data for selected sprint
  useEffect(() => {
    const generateBurnupData = async () => {
      if (!selectedSprint) return

      setLoading(true)
      setError(null)
      try {
        // Get burndown data which has daily progression we can use for burnup
        const burndownResponse = await fetch(`/api/analytics/burndown/${selectedSprint.id}`)
        const burndownData = await burndownResponse.json()

        // Get sprint scope data for final totals
        const sprintScopeResponse = await fetch(`/api/analytics/sprint-scope/${selectedSprint.id}`)
        const sprintScope = await sprintScopeResponse.json()

        if (!selectedSprint.startDate || !selectedSprint.endDate) {
          console.warn('Sprint has null start or end date')
          setError('This sprint has not been started yet. Please start the sprint with dates to view the burnup chart.')
          setBurnupData([])
          setLoading(false)
          return
        }

        // Convert burndown data to burnup format
        const data: BurnupData[] = burndownData.map((dayData: any, index: number) => {
          const completed = dayData.actualCompleted || 0
          const remainingWork = dayData.remainingWork || 0

          // Current scope = completed + remaining work
          const currentScope = completed + remainingWork
          const originalScope = sprintScope.totalScope

          return {
            date: dayData.date,
            completed: completed,
            totalScope: currentScope,
            scopeAdded: currentScope - originalScope
          }
        })

        setBurnupData(data)
      } catch (error) {
        console.error('Error generating burnup data:', error)
      } finally {
        setLoading(false)
      }
    }

    generateBurnupData()
  }, [selectedSprint, projectId])

  // Chart configuration
  const chartData = {
    labels: burnupData.map(d => {
      const date = new Date(d.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'Work Completed',
        data: burnupData.map(d => d.completed),
        borderColor: 'rgb(134, 201, 143)',
        backgroundColor: 'rgba(134, 201, 143, 0.1)',
        fill: true,
        tension: 0
      },
      {
        label: 'Total Scope',
        data: burnupData.map(d => d.totalScope),
        borderColor: 'rgb(224, 164, 58)',
        backgroundColor: 'rgba(224, 164, 58, 0.1)',
        fill: false,
        tension: 0,
        borderDash: [5, 5]
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
            text: `Burnup Chart - ${selectedSprint?.name || 'Sprint'}`,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const point = burnupData[context.dataIndex]
                const label = context.dataset.label
                const value = context.parsed.y

                if (label === 'Work Completed') {
                  return `${label}: ${value} story points`
                } else {
                  const added = point.scopeAdded
                  return `${label}: ${value} story points${added > 0 ? ` (+${added} added)` : ''}`
                }
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
            display: false,
              text: 'Story Points'
            }
          },
          x: {
            ticks: isPhone ? { maxRotation: 45, autoSkip: true } : undefined,
            title: {
            display: false,
              text: 'Sprint Days'
            }
          }
        }
    }
  }, [burnupData, selectedSprint?.name])
  const themedOptions = useMemo(() => applyChartTheme(withReportStyle(chartOptions), resolved), [chartOptions, resolved])

  // Calculate sprint metrics
  const sprintMetrics = React.useMemo(() => {
    if (burnupData.length === 0) return null

    const latestData = burnupData[burnupData.length - 1]
    const initialScope = burnupData[0]?.totalScope || 0
    const currentScope = latestData?.totalScope || 0
    const completed = latestData?.completed || 0
    const remaining = Math.max(0, currentScope - completed)

    const completionRate = currentScope > 0 ? (completed / currentScope) * 100 : 0
    const scopeChange = initialScope > 0 ? ((currentScope - initialScope) / initialScope) * 100 : 0

    return {
      initialScope: Math.round(initialScope),
      currentScope: Math.round(currentScope),
      completed: Math.round(completed),
      remaining: Math.round(remaining),
      completionRate: isNaN(completionRate) ? 0 : Math.round(completionRate * 10) / 10,
      scopeChange: isNaN(scopeChange) ? 0 : Math.round(scopeChange * 10) / 10
    }
  }, [burnupData])

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
          <p className="font-medium">Error loading burnup data</p>
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
          <h1 className="text-2xl font-semibold text-gray-900">Burnup Report</h1>
          <p className="text-gray-600 mt-1">
            Track completed work and scope changes throughout the sprint
          </p>
        </div>

        {/* Sprint Selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="sprint-select" className="text-sm font-medium text-gray-700">
            Sprint:
          </label>
          <select
            id="sprint-select"
            value={selectedSprint?.id || ''}
            onChange={(e) => {
              const sprint = sprints.find(s => s.id === Number(e.target.value))
              setSelectedSprint(sprint || null)
            }}
            className="min-w-0 border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {sprints.map(sprint => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Cards */}
      {sprintMetrics && (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 md:grid-cols-5 [&>*:last-child:nth-child(odd)]:col-span-2 md:[&>*:last-child:nth-child(odd)]:col-span-1">
          <div className="bg-white px-4 py-3">
            <div className="text-sm font-medium text-gray-500">Initial Scope</div>
            <div className="text-2xl font-semibold tabular-nums text-gray-900">{sprintMetrics.initialScope}</div>
            <div className="text-sm text-gray-500">story points</div>
          </div>

          <div className="bg-white px-4 py-3">
            <div className="text-sm font-medium text-gray-500">Current Scope</div>
            <div className="text-2xl font-semibold tabular-nums text-gray-900">{sprintMetrics.currentScope}</div>
            <div className="text-sm text-gray-500">story points</div>
          </div>

          <div className="bg-white px-4 py-3">
            <div className="text-sm font-medium text-gray-500">Completed</div>
            <div className="text-2xl font-semibold tabular-nums text-gray-900">{sprintMetrics.completed}</div>
            <div className="text-sm text-gray-500">story points</div>
          </div>

          <div className="bg-white px-4 py-3">
            <div className="text-sm font-medium text-gray-500">Remaining</div>
            <div className="text-2xl font-semibold tabular-nums text-gray-900">{sprintMetrics.remaining}</div>
            <div className="text-sm text-gray-500">story points</div>
          </div>

          <div className="bg-white px-4 py-3">
            <div className="text-sm font-medium text-gray-500">Progress</div>
            <div className="text-2xl font-semibold tabular-nums text-gray-900">{sprintMetrics.completionRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">complete</div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
        <div className="relative h-72 sm:h-96">
          {chartHasData(chartData) ? <Line data={chartData} options={themedOptions} /> : <EmptyChart message="No story points in this sprint yet. Estimate its issues and the chart fills in." />}
        </div>
      </div>

      {/* Insights */}
      {sprintMetrics && (
        <div className="hidden has-[.insight]:block bg-white p-4 md:p-6 rounded-lg border border-gray-200">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Sprint Insights</h2>
          <div className="space-y-3">
            {sprintMetrics.scopeChange > 5 && (
              <div className="insight flex items-start gap-3">
                <div className="mt-2 size-1.5 shrink-0 rounded-full bg-gray-400"></div>
                <div>
                  <div className="font-medium text-gray-900">Scope Increase Detected</div>
                  <div className="text-sm text-gray-600">
                    Sprint scope increased by {sprintMetrics.scopeChange.toFixed(1)}% from initial planning.
                    Consider impact on sprint goals.
                  </div>
                </div>
              </div>
            )}

            {sprintMetrics.completionRate > 90 && (
              <div className="insight flex items-start gap-3">
                <div className="mt-2 size-1.5 shrink-0 rounded-full bg-gray-400"></div>
                <div>
                  <div className="font-medium text-gray-900">Excellent Progress</div>
                  <div className="text-sm text-gray-600">
                    Sprint is {sprintMetrics.completionRate.toFixed(1)}% complete.
                    Team is on track to meet sprint goals.
                  </div>
                </div>
              </div>
            )}

            {sprintMetrics.completionRate < 50 && selectedSprint?.status === 'active' && (
              <div className="insight flex items-start gap-3">
                <div className="mt-2 size-1.5 shrink-0 rounded-full bg-gray-400"></div>
                <div>
                  <div className="font-medium text-gray-900">Progress Behind Schedule</div>
                  <div className="text-sm text-gray-600">
                    Consider reviewing team capacity and removing impediments to accelerate progress.
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