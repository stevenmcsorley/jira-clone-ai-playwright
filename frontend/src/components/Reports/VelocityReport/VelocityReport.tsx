/**
 * Velocity Report Component
 *
 * Shows team velocity over multiple sprints with predictive analytics.
 * Helps with sprint planning and capacity forecasting.
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
  BarElement,
  PointElement,
  LineElement,
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
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface VelocityData {
  sprintName: string
  sprintNumber: number
  planned: number
  completed: number
  startDate: string
  endDate: string
}

interface VelocityMetrics {
  averageVelocity: number
  lastThreeAverage: number
  trend: 'increasing' | 'decreasing' | 'stable'
  consistency: number
  predictedNext: number
}

export const VelocityReport = () => (
  <ReportsLayout>
    <VelocityReportContent />
  </ReportsLayout>
)

const VelocityReportContent = () => {
  const { resolved } = useTheme()
  const { projectId } = useParams<{ projectId: string }>()
  const [velocityData, setVelocityData] = useState<VelocityData[]>([])
  const [metrics, setMetrics] = useState<VelocityMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('last6') // last6, last12, all

  // Fetch velocity data
  useEffect(() => {
    const fetchVelocityData = async () => {
      if (!projectId) return

      setLoading(true)
      try {
        // Fetch completed sprints
        const sprintsResponse = await fetch(`/api/sprints?projectId=${projectId}&status=completed`)
        // The API returns every sprint whatever the query says, so keep only the finished ones: a future or running sprint is not a velocity.
        const sprints = (await sprintsResponse.json()).filter((s: any) => s.status === 'completed' && s.startDate)

        // Generate velocity data for each sprint using analytics API
        const velocityPromises = sprints.map(async (sprint: any) => {
          // Use the sprint scope analytics API for accurate historical data
          const scopeResponse = await fetch(`/api/analytics/sprint-scope/${sprint.id}`)
          const scopeData = await scopeResponse.json()

          return {
            sprintName: sprint.name,
            sprintNumber: sprint.id,
            planned: scopeData.totalScope || 0,
            completed: scopeData.completedWork || 0,
            startDate: sprint.startDate,
            endDate: sprint.endDate
          }
        })

        const velocityData = await Promise.all(velocityPromises)

        // Sort by start date
        velocityData.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

        // Apply time range filter
        let filteredData = velocityData
        if (timeRange === 'last6') {
          filteredData = velocityData.slice(-6)
        } else if (timeRange === 'last12') {
          filteredData = velocityData.slice(-12)
        }

        setVelocityData(filteredData)

        // Calculate metrics
        if (filteredData.length > 0) {
          const completedVelocities = filteredData.map(d => d.completed).filter(v => !isNaN(v))
          if (completedVelocities.length === 0) {
            setMetrics(null)
            return
          }

          const averageVelocity = completedVelocities.reduce((sum, v) => sum + v, 0) / completedVelocities.length

          const lastThree = completedVelocities.slice(-3)
          const lastThreeAverage = lastThree.length > 0 ? lastThree.reduce((sum, v) => sum + v, 0) / lastThree.length : 0

          // Calculate trend
          let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
          if (filteredData.length >= 3) {
            const firstHalf = completedVelocities.slice(0, Math.floor(completedVelocities.length / 2))
            const secondHalf = completedVelocities.slice(Math.floor(completedVelocities.length / 2))

            const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length
            const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length

            if (secondAvg > firstAvg * 1.1) trend = 'increasing'
            else if (secondAvg < firstAvg * 0.9) trend = 'decreasing'
          }

          // Calculate consistency (standard deviation)
          const variance = completedVelocities.reduce((sum, v) => sum + Math.pow(v - averageVelocity, 2), 0) / completedVelocities.length
          const stdDev = Math.sqrt(variance)
          const consistency = averageVelocity > 0 ? Math.max(0, 100 - (stdDev / averageVelocity) * 100) : 0

          // Predict next sprint velocity (weighted average favoring recent sprints)
          let predictedNext = averageVelocity
          if (filteredData.length >= 3) {
            const weights = [0.5, 0.3, 0.2] // Most recent gets highest weight
            const recentThree = completedVelocities.slice(-3)
            predictedNext = recentThree.reduce((sum, v, i) => sum + v * weights[i], 0)
          }

          setMetrics({
            averageVelocity: isNaN(averageVelocity) ? 0 : Math.round(averageVelocity),
            lastThreeAverage: isNaN(lastThreeAverage) ? 0 : Math.round(lastThreeAverage),
            trend,
            consistency: isNaN(consistency) ? 0 : Math.round(consistency),
            predictedNext: isNaN(predictedNext) ? 0 : Math.round(predictedNext)
          })
        }
      } catch (error) {
        console.error('Error fetching velocity data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVelocityData()
  }, [projectId, timeRange])

  // Chart configuration
  const chartData = {
    labels: velocityData.map(d => d.sprintName),
    datasets: [
      {
        label: 'Planned',
        data: velocityData.map(d => d.planned),
        backgroundColor: 'rgba(155, 152, 143, 0.45)',
        borderWidth: 0,
        borderRadius: 2
      },
      {
        label: 'Completed',
        data: velocityData.map(d => d.completed),
        backgroundColor: 'rgba(224, 164, 58, 0.95)',
        borderWidth: 0,
        borderRadius: 2
      }
    ]
  }

  const chartOptions = useMemo<ChartOptions<'bar'>>(() => {
    const isPhone = window.matchMedia('(max-width: 639px)').matches

    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: isPhone ? 'bottom' : 'top', align: 'end' as const, labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8, padding: 16 } },
          title: {
            display: false,
            text: 'Team Velocity by Sprint',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const dataIndex = context.dataIndex
                const data = velocityData[dataIndex]
                const label = context.dataset.label
                const value = context.parsed.y

                if (label === 'Completed') {
                  const completionRate = data.planned > 0 ? ((data.completed / data.planned) * 100).toFixed(1) : '0'
                  return `${label}: ${value} story points (${completionRate}% of planned)`
                }
                return `${label}: ${value} story points`
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
              text: 'Sprint'
            }
          }
        }
    }
  }, [velocityData])
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Velocity Report</h1>
          <p className="text-gray-600 mt-1">
            Track team velocity and predict future sprint capacity
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
            onChange={(e) => setTimeRange(e.target.value)}
            className="min-w-0 border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="last6">Last 6 Sprints</option>
            <option value="last12">Last 12 Sprints</option>
            <option value="all">All Sprints</option>
          </select>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 md:grid-cols-5 [&>*:last-child:nth-child(odd)]:col-span-2 md:[&>*:last-child:nth-child(odd)]:col-span-1">
          <div className="bg-white px-4 py-3">
            <div className="text-sm font-medium text-gray-500">Average Velocity</div>
            <div className="text-2xl font-semibold tabular-nums text-gray-900">{metrics.averageVelocity}</div>
            <div className="text-sm text-gray-500">story points</div>
          </div>

          <div className="bg-white px-4 py-3">
            <div className="text-sm font-medium text-gray-500">Recent Average</div>
            <div className="text-2xl font-semibold tabular-nums text-gray-900">{metrics.lastThreeAverage}</div>
            <div className="text-sm text-gray-500">last 3 sprints</div>
          </div>

          <div className="bg-white px-4 py-3">
            <div className="text-sm font-medium text-gray-500">Trend</div>
            <div className={`text-2xl font-semibold ${metrics.trend === 'decreasing' ? 'text-red-600' : 'text-gray-900'}`}>
              {metrics.trend === 'increasing' ? 'Rising' : metrics.trend === 'decreasing' ? 'Falling' : 'Steady'}
            </div>
            <div className="text-sm text-gray-500">recent sprints</div>
          </div>

          <div className="bg-white px-4 py-3">
            <div className="text-sm font-medium text-gray-500">Consistency</div>
            <div className="text-2xl font-semibold tabular-nums text-gray-900">{metrics.consistency}%</div>
            <div className="text-sm text-gray-500">predictability</div>
          </div>

          <div className="bg-white px-4 py-3">
            <div className="text-sm font-medium text-gray-500">Predicted Next</div>
            <div className="text-2xl font-semibold tabular-nums text-gray-900">{metrics.predictedNext}</div>
            <div className="text-sm text-gray-500">story points</div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
        <div className="relative h-72 sm:h-96">
          {chartHasData(chartData) ? <Bar data={chartData} options={themedOptions} /> : <EmptyChart message="No completed sprints with story points yet. Velocity appears once a sprint finishes." />}
        </div>
      </div>

      {/* Insights and Recommendations */}
      {metrics && (
        <div className="hidden has-[.insight]:block bg-white p-4 md:p-6 rounded-lg border border-gray-200">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Velocity Insights</h2>
          <div className="space-y-3">

            {/* Trend Analysis */}
            {metrics.trend === 'increasing' && (
              <div className="insight flex items-start gap-3">
                <div className="mt-2 size-1.5 shrink-0 rounded-full bg-gray-400"></div>
                <div>
                  <div className="font-medium text-gray-900">Positive Velocity Trend</div>
                  <div className="text-sm text-gray-600">
                    Team velocity is increasing. Recent average ({metrics.lastThreeAverage}) is higher than overall average ({metrics.averageVelocity}).
                  </div>
                </div>
              </div>
            )}

            {metrics.trend === 'decreasing' && (
              <div className="insight flex items-start gap-3">
                <div className="mt-2 size-1.5 shrink-0 rounded-full bg-gray-400"></div>
                <div>
                  <div className="font-medium text-gray-900">Declining Velocity</div>
                  <div className="text-sm text-gray-600">
                    Team velocity is decreasing. Consider reviewing team capacity and identifying impediments.
                  </div>
                </div>
              </div>
            )}

            {/* Consistency Analysis */}
            {metrics.consistency > 80 && (
              <div className="insight flex items-start gap-3">
                <div className="mt-2 size-1.5 shrink-0 rounded-full bg-gray-400"></div>
                <div>
                  <div className="font-medium text-gray-900">High Consistency</div>
                  <div className="text-sm text-gray-600">
                    Team has {metrics.consistency}% consistency. Velocity is highly predictable for sprint planning.
                  </div>
                </div>
              </div>
            )}

            {metrics.consistency < 60 && (
              <div className="insight flex items-start gap-3">
                <div className="mt-2 size-1.5 shrink-0 rounded-full bg-gray-400"></div>
                <div>
                  <div className="font-medium text-gray-900">Variable Velocity</div>
                  <div className="text-sm text-gray-600">
                    Team velocity varies significantly ({metrics.consistency}% consistency). Consider investigating factors affecting sprint delivery.
                  </div>
                </div>
              </div>
            )}

            {/* Planning Recommendation */}
            <div className="insight flex items-start gap-3">
              <div className="mt-2 size-1.5 shrink-0 rounded-full bg-gray-400"></div>
              <div>
                <div className="font-medium text-gray-900">Sprint Planning Recommendation</div>
                <div className="text-sm text-gray-600">
                  For next sprint, plan {metrics.predictedNext} story points based on recent performance trends.
                  Consider a buffer of ±{Math.round(metrics.predictedNext * 0.15)} points for uncertainty.
                </div>
              </div>
            </div>

            {/* Data Insight */}
            {velocityData.length < 3 && (
              <div className="insight flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Limited Data</div>
                  <div className="text-sm text-gray-600">
                    More sprint data needed for accurate velocity predictions. Recommendations will improve after 3+ completed sprints.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sprint Details Table */}
      {velocityData.length > 0 && (
        <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sprint Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  ">
                    Sprint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  ">
                    Planned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  ">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  ">
                    Completion Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {velocityData.map((sprint, index) => {
                  const completionRate = sprint.planned > 0 ? (sprint.completed / sprint.planned) * 100 : 0
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {sprint.sprintName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sprint.planned}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sprint.completed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          completionRate >= 90 ? 'bg-green-100 text-green-800' :
                          completionRate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {completionRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}