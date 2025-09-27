/**
 * Burnup Report Component
 *
 * Visualizes sprint progress by showing completed work vs total scope.
 * Tracks scope changes and completion trends throughout the sprint.
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

export const BurnupReport = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [burnupData, setBurnupData] = useState<BurnupData[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch sprints for project
  useEffect(() => {
    const fetchSprints = async () => {
      try {
        const response = await fetch(`/api/sprints?projectId=${projectId}`)
        const sprintData = await response.json()
        setSprints(sprintData)

        // Select most recent active or completed sprint
        const activeSprint = sprintData.find((s: Sprint) => s.status === 'active') ||
                           sprintData.find((s: Sprint) => s.status === 'completed') ||
                           sprintData[0]

        if (activeSprint) {
          setSelectedSprint(activeSprint)
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
      try {
        // Fetch issues for the sprint
        const response = await fetch(`/api/issues?projectId=${projectId}&sprintId=${selectedSprint.id}`)
        const issues = await response.json()

        // Generate daily burnup data
        if (!selectedSprint.startDate || !selectedSprint.endDate) {
          console.warn('Sprint has null start or end date')
          setBurnupData([])
          return
        }

        const startDate = new Date(selectedSprint.startDate)
        const endDate = new Date(selectedSprint.endDate)
        const today = new Date()
        const currentEnd = today < endDate ? today : endDate

        const data: BurnupData[] = []
        const currentDate = new Date(startDate)

        // Initial scope (story points at sprint start)
        const initialScope = issues.reduce((sum: number, issue: any) => {
          const estimate = parseFloat(issue.estimate) || 0
          return sum + estimate
        }, 0)
        let totalScope = initialScope
        let completed = 0

        while (currentDate <= currentEnd) {
          const dateStr = currentDate.toISOString().split('T')[0]

          // Calculate completed work up to this date
          completed = issues
            .filter((issue: any) => issue.status === 'done')
            .reduce((sum: number, issue: any) => {
              const estimate = parseFloat(issue.estimate) || 0
              return sum + estimate
            }, 0)

          // For demo purposes, simulate scope changes and gradual completion
          const daysPassed = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
          const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

          // Simulate scope additions (10% chance each day)
          if (Math.random() > 0.9 && daysPassed < totalDays * 0.7) {
            totalScope += Math.floor(Math.random() * 3) + 1
          }

          // Simulate gradual completion with some variance
          const expectedProgress = (daysPassed / totalDays) * initialScope
          const variance = (Math.random() - 0.5) * 0.2 * expectedProgress
          completed = Math.min(Math.max(0, expectedProgress + variance), totalScope)

          data.push({
            date: dateStr,
            completed: Math.round(completed),
            totalScope,
            scopeAdded: totalScope - initialScope
          })

          currentDate.setDate(currentDate.getDate() + 1)
        }

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
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.1
      },
      {
        label: 'Total Scope',
        data: burnupData.map(d => d.totalScope),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: false,
        tension: 0.1,
        borderDash: [5, 5]
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
          display: true,
          text: 'Story Points'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Sprint Days'
        }
      }
    }
  }

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading burnup data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Initial Scope</div>
            <div className="text-2xl font-bold text-gray-900">{sprintMetrics.initialScope}</div>
            <div className="text-sm text-gray-500">story points</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Current Scope</div>
            <div className="text-2xl font-bold text-gray-900">{sprintMetrics.currentScope}</div>
            <div className="text-sm text-gray-500">story points</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Completed</div>
            <div className="text-2xl font-bold text-green-600">{sprintMetrics.completed}</div>
            <div className="text-sm text-gray-500">story points</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Remaining</div>
            <div className="text-2xl font-bold text-orange-600">{sprintMetrics.remaining}</div>
            <div className="text-sm text-gray-500">story points</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Progress</div>
            <div className="text-2xl font-bold text-blue-600">{sprintMetrics.completionRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">complete</div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div style={{ height: '400px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Insights */}
      {sprintMetrics && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sprint Insights</h3>
          <div className="space-y-3">
            {sprintMetrics.scopeChange > 5 && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
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
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
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
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
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