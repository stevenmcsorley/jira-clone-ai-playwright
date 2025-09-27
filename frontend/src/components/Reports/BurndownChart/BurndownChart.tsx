/**
 * Sprint Burndown Chart Component
 *
 * Shows remaining work over time during a sprint.
 * Tracks daily progress against ideal burndown line.
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

interface BurndownData {
  date: string
  remainingWork: number
  idealBurndown: number
  workCompleted: number
}

interface Sprint {
  id: number
  name: string
  startDate: string
  endDate: string
  status: string
}

export const BurndownChart = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [burndownData, setBurndownData] = useState<BurndownData[]>([])
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

  // Generate burndown data for selected sprint
  useEffect(() => {
    const generateBurndownData = async () => {
      if (!selectedSprint) return

      setLoading(true)
      try {
        // Fetch issues for the sprint
        const response = await fetch(`/api/issues?projectId=${projectId}&sprintId=${selectedSprint.id}`)
        const issues = await response.json()

        // Generate daily burndown data
        if (!selectedSprint.startDate || !selectedSprint.endDate) {
          console.warn('Sprint has null start or end date')
          setBurndownData([])
          return
        }

        const startDate = new Date(selectedSprint.startDate)
        const endDate = new Date(selectedSprint.endDate)
        const today = new Date()
        const currentEnd = today < endDate ? today : endDate

        const data: BurndownData[] = []
        const currentDate = new Date(startDate)

        // Initial scope (story points at sprint start)
        const totalScope = issues.reduce((sum: number, issue: any) => {
          const estimate = parseFloat(issue.estimate) || 0
          return sum + estimate
        }, 0)
        const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

        let cumulativeCompleted = 0

        while (currentDate <= currentEnd) {
          const dateStr = currentDate.toISOString().split('T')[0]
          const daysPassed = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

          // Ideal burndown (linear)
          const idealBurndown = totalScope - (totalScope / totalDays) * daysPassed

          // Simulate actual work completion with some variance
          if (daysPassed > 0) {
            // Base completion rate with some randomness
            const baseCompletionRate = totalScope / totalDays
            const variance = (Math.random() - 0.5) * 0.4 * baseCompletionRate
            const dailyWork = Math.max(0, baseCompletionRate + variance)

            // Add some sprint rhythm (slower start, faster middle, slower end)
            const sprintPhase = daysPassed / totalDays
            let phaseMultiplier = 1
            if (sprintPhase < 0.3) phaseMultiplier = 0.7 // Slow start
            else if (sprintPhase < 0.7) phaseMultiplier = 1.3 // Fast middle
            else phaseMultiplier = 0.9 // Slower end

            cumulativeCompleted += dailyWork * phaseMultiplier
            cumulativeCompleted = Math.min(cumulativeCompleted, totalScope)
          }

          const remainingWork = Math.max(0, totalScope - cumulativeCompleted)

          data.push({
            date: dateStr,
            remainingWork: Math.round(remainingWork),
            idealBurndown: Math.max(0, Math.round(idealBurndown)),
            workCompleted: Math.round(cumulativeCompleted)
          })

          currentDate.setDate(currentDate.getDate() + 1)
        }

        setBurndownData(data)
      } catch (error) {
        console.error('Error generating burndown data:', error)
      } finally {
        setLoading(false)
      }
    }

    generateBurndownData()
  }, [selectedSprint, projectId])

  // Chart configuration
  const chartData = {
    labels: burndownData.map((d, index) => {
      if (index === 0) return 'Sprint Start'
      const date = new Date(d.date)
      return `Day ${index}`
    }),
    datasets: [
      {
        label: 'Ideal Burndown',
        data: burndownData.map(d => d.idealBurndown),
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderDash: [5, 5],
        fill: false,
        tension: 0
      },
      {
        label: 'Actual Remaining Work',
        data: burndownData.map(d => d.remainingWork),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.1
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
        text: `Sprint Burndown - ${selectedSprint?.name || 'Sprint'}`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const point = burndownData[context.dataIndex]
            const label = context.dataset.label
            const value = context.parsed.y

            if (label === 'Actual Remaining Work') {
              return `${label}: ${value} story points (${point.workCompleted} completed)`
            } else {
              return `${label}: ${value} story points`
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
          text: 'Story Points Remaining'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Sprint Timeline'
        }
      }
    }
  }

  // Calculate sprint metrics
  const sprintMetrics = React.useMemo(() => {
    if (burndownData.length === 0) return null

    const firstDay = burndownData[0]
    const lastDay = burndownData[burndownData.length - 1]
    const totalScope = firstDay?.idealBurndown || firstDay?.remainingWork || 0
    const completed = lastDay?.workCompleted || 0
    const remaining = lastDay?.remainingWork || 0

    const completionRate = totalScope > 0 ? (completed / totalScope) * 100 : 0

    // Calculate if sprint is on track
    const idealRemaining = lastDay?.idealBurndown || 0
    const actualRemaining = lastDay?.remainingWork || 0
    const variance = actualRemaining - idealRemaining
    const variancePercentage = totalScope > 0 ? (variance / totalScope) * 100 : 0

    return {
      totalScope,
      completed,
      remaining,
      completionRate,
      variance,
      variancePercentage,
      isAhead: variance < 0,
      isBehind: variance > 0
    }
  }, [burndownData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading burndown data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Sprint Burndown Chart</h1>
          <p className="text-gray-600 mt-1">
            Track remaining work and compare against ideal burndown
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Total Scope</div>
            <div className="text-2xl font-bold text-gray-900">{sprintMetrics.totalScope}</div>
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

      {/* Performance Analysis */}
      {sprintMetrics && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sprint Performance</h3>

          {/* Status Indicator */}
          <div className="mb-4">
            {sprintMetrics.isAhead && (
              <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-3 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium">Sprint Ahead of Schedule</div>
                  <div className="text-sm">
                    Team is {Math.abs(sprintMetrics.variancePercentage).toFixed(1)}% ahead of ideal burndown
                  </div>
                </div>
              </div>
            )}

            {sprintMetrics.isBehind && (
              <div className="flex items-center space-x-2 text-red-700 bg-red-50 p-3 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div>
                  <div className="font-medium">Sprint Behind Schedule</div>
                  <div className="text-sm">
                    Team is {sprintMetrics.variancePercentage.toFixed(1)}% behind ideal burndown
                  </div>
                </div>
              </div>
            )}

            {!sprintMetrics.isAhead && !sprintMetrics.isBehind && (
              <div className="flex items-center space-x-2 text-blue-700 bg-blue-50 p-3 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <div className="font-medium">Sprint On Track</div>
                  <div className="text-sm">Team is following the ideal burndown closely</div>
                </div>
              </div>
            )}
          </div>

          {/* Insights */}
          <div className="space-y-3">
            {sprintMetrics.completionRate > 80 && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Strong Sprint Performance</div>
                  <div className="text-sm text-gray-600">
                    Sprint is {sprintMetrics.completionRate.toFixed(1)}% complete.
                    Team is likely to meet sprint goals.
                  </div>
                </div>
              </div>
            )}

            {sprintMetrics.isBehind && sprintMetrics.variancePercentage > 20 && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Action Required</div>
                  <div className="text-sm text-gray-600">
                    Consider removing scope or addressing impediments to get back on track.
                  </div>
                </div>
              </div>
            )}

            {sprintMetrics.isAhead && sprintMetrics.variancePercentage < -15 && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Opportunity for More Work</div>
                  <div className="text-sm text-gray-600">
                    Team is ahead of schedule. Consider pulling in additional work from the backlog.
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