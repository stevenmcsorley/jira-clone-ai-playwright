/**
 * Cumulative Flow Diagram Component
 *
 * Shows the statuses of project issues over time.
 * Identifies bottlenecks and workflow accumulation patterns.
 */

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
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

export const CumulativeFlowDiagram = () => {
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

  // Chart configuration - simple CFD with each status as its own line
  const chartData = {
    labels: cfdData.map(d => {
      const date = new Date(d.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'To Do',
        data: cfdData.map(d => d.todo),
        backgroundColor: 'rgba(156, 163, 175, 0.3)',
        borderColor: 'rgb(156, 163, 175)',
        borderWidth: 2,
        fill: 'origin',
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4
      },
      {
        label: 'In Progress',
        data: cfdData.map(d => d.inProgress),
        backgroundColor: 'rgba(251, 191, 36, 0.5)',
        borderColor: 'rgb(251, 191, 36)',
        borderWidth: 2,
        fill: 'origin',
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4
      },
      {
        label: 'Done',
        data: cfdData.map(d => d.done),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        fill: 'origin',
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4
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
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Issues'
        }
      },
      x: {
        title: {
          display: true,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading cumulative flow data...</span>
      </div>
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
      <div className="flex items-center justify-between">
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
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Avg Cycle Time</div>
            <div className="text-2xl font-bold text-gray-900">{metrics.avgCycleTime}</div>
            <div className="text-sm text-gray-500">days</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Avg Throughput</div>
            <div className="text-2xl font-bold text-blue-600">{metrics.avgThroughput}</div>
            <div className="text-sm text-gray-500">issues/week</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Current WIP</div>
            <div className="text-2xl font-bold text-yellow-600">{metrics.currentWIP}</div>
            <div className="text-sm text-gray-500">in progress</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">WIP Trend</div>
            <div className={`text-2xl font-bold ${
              metrics.wipTrend === 'increasing' ? 'text-red-600' :
              metrics.wipTrend === 'decreasing' ? 'text-green-600' : 'text-gray-600'
            }`}>
              {metrics.wipTrend === 'increasing' ? '↗' : metrics.wipTrend === 'decreasing' ? '↘' : '→'}
            </div>
            <div className="text-sm text-gray-500 capitalize">{metrics.wipTrend}</div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div style={{ height: '500px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Insights */}
      {metrics && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Insights</h3>
          <div className="space-y-3">

            {/* Bottleneck Detection */}
            {metrics.bottleneckStatus && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
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
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
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
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
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
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
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
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
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
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
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
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
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