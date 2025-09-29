/**
 * Velocity Report Component
 *
 * Shows team velocity over multiple sprints with predictive analytics.
 * Helps with sprint planning and capacity forecasting.
 */

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
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

export const VelocityReport = () => {
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
        const sprints = await sprintsResponse.json()

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
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      },
      {
        label: 'Completed',
        data: velocityData.map(d => d.completed),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
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
          display: true,
          text: 'Story Points'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Sprint'
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading velocity data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="last6">Last 6 Sprints</option>
            <option value="last12">Last 12 Sprints</option>
            <option value="all">All Sprints</option>
          </select>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Average Velocity</div>
            <div className="text-2xl font-bold text-gray-900">{metrics.averageVelocity}</div>
            <div className="text-sm text-gray-500">story points</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Recent Average</div>
            <div className="text-2xl font-bold text-blue-600">{metrics.lastThreeAverage}</div>
            <div className="text-sm text-gray-500">last 3 sprints</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Trend</div>
            <div className={`text-2xl font-bold ${
              metrics.trend === 'increasing' ? 'text-green-600' :
              metrics.trend === 'decreasing' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {metrics.trend === 'increasing' ? '↗' : metrics.trend === 'decreasing' ? '↘' : '→'}
            </div>
            <div className="text-sm text-gray-500 capitalize">{metrics.trend}</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Consistency</div>
            <div className="text-2xl font-bold text-purple-600">{metrics.consistency}%</div>
            <div className="text-sm text-gray-500">predictability</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Predicted Next</div>
            <div className="text-2xl font-bold text-orange-600">{metrics.predictedNext}</div>
            <div className="text-sm text-gray-500">story points</div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div style={{ height: '400px' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Insights and Recommendations */}
      {metrics && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Velocity Insights</h3>
          <div className="space-y-3">

            {/* Trend Analysis */}
            {metrics.trend === 'increasing' && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Positive Velocity Trend</div>
                  <div className="text-sm text-gray-600">
                    Team velocity is increasing. Recent average ({metrics.lastThreeAverage}) is higher than overall average ({metrics.averageVelocity}).
                  </div>
                </div>
              </div>
            )}

            {metrics.trend === 'decreasing' && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
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
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">High Consistency</div>
                  <div className="text-sm text-gray-600">
                    Team has {metrics.consistency}% consistency. Velocity is highly predictable for sprint planning.
                  </div>
                </div>
              </div>
            )}

            {metrics.consistency < 60 && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Variable Velocity</div>
                  <div className="text-sm text-gray-600">
                    Team velocity varies significantly ({metrics.consistency}% consistency). Consider investigating factors affecting sprint delivery.
                  </div>
                </div>
              </div>
            )}

            {/* Planning Recommendation */}
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
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
              <div className="flex items-start space-x-3">
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
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sprint Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sprint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Planned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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