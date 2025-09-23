import { useState, useEffect } from 'react'
import { TimeTrackingService, type TimeLog, type CreateTimeLogRequest, type TimeTrackingSummary } from '../../services/api/time-tracking.service'
import { Button } from '../ui/Button'

interface TimeTrackingProps {
  issueId: number
  originalEstimate?: number
}

export const TimeTracking = ({ issueId, originalEstimate }: TimeTrackingProps) => {
  const [summary, setSummary] = useState<TimeTrackingSummary | null>(null)
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showLogForm, setShowLogForm] = useState(false)
  const [newTimeLog, setNewTimeLog] = useState({
    timeStr: '',
    description: '',
    workDate: new Date().toISOString().split('T')[0],
  })
  const [submitting, setSubmitting] = useState(false)
  const [timeParseError, setTimeParseError] = useState('')

  useEffect(() => {
    fetchTimeTrackingSummary()
    fetchTimeLogs()
  }, [issueId])

  const fetchTimeTrackingSummary = async () => {
    try {
      const data = await TimeTrackingService.getTimeTrackingSummary(issueId)
      setSummary(data)
    } catch (error) {
      console.error('Error fetching time tracking summary:', error)
    }
  }

  const fetchTimeLogs = async () => {
    try {
      setLoading(true)
      const data = await TimeTrackingService.getTimeLogsByIssue(issueId)
      setTimeLogs(data)
    } catch (error) {
      console.error('Error fetching time logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTimeLog.timeStr.trim() || submitting) return

    try {
      setSubmitting(true)
      setTimeParseError('')

      // Parse the time input
      const timeSpent = TimeTrackingService.parseTimeInput_client(newTimeLog.timeStr)

      const timeLogData: CreateTimeLogRequest = {
        hours: timeSpent,
        description: newTimeLog.description || undefined,
        date: newTimeLog.workDate,
        issueId,
      }

      await TimeTrackingService.logTime(timeLogData)
      setNewTimeLog({
        timeStr: '',
        description: '',
        workDate: new Date().toISOString().split('T')[0],
      })
      setShowLogForm(false)
      await fetchTimeTrackingSummary()
      await fetchTimeLogs()
    } catch (error) {
      if (error instanceof Error) {
        setTimeParseError(error.message)
      } else {
        console.error('Error logging time:', error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTimeLog = async (timeLogId: number) => {
    if (!confirm('Are you sure you want to delete this time log?')) return

    try {
      await TimeTrackingService.deleteTimeLog(timeLogId)
      await fetchTimeTrackingSummary()
      await fetchTimeLogs()
    } catch (error) {
      console.error('Error deleting time log:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const getProgressPercentage = () => {
    if (!summary || !originalEstimate) return 0
    return Math.min(100, Math.round((summary.totalTimeSpent / originalEstimate) * 100))
  }

  const getProgressColor = () => {
    const percentage = getProgressPercentage()
    if (percentage <= 50) return 'bg-green-500'
    if (percentage <= 80) return 'bg-yellow-500'
    if (percentage <= 100) return 'bg-orange-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Time Tracking
        </h3>
        <Button
          onClick={() => setShowLogForm(true)}
          size="sm"
        >
          Log Work
        </Button>
      </div>

      {/* Time Summary */}
      {summary && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {TimeTrackingService.formatTime(summary.totalTimeSpent)}
              </div>
              <div className="text-sm text-gray-600">Time Spent</div>
            </div>
            {originalEstimate && (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {TimeTrackingService.formatTime(originalEstimate)}
                </div>
                <div className="text-sm text-gray-600">Original Estimate</div>
              </div>
            )}
            {summary.remainingEstimate !== undefined && (
              <div className="text-center">
                <div className={`text-2xl font-bold ${summary.remainingEstimate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {TimeTrackingService.formatTime(summary.remainingEstimate)}
                </div>
                <div className="text-sm text-gray-600">Remaining</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {summary.timeSpentByUser.length}
              </div>
              <div className="text-sm text-gray-600">Contributors</div>
            </div>
          </div>

          {/* Progress Bar */}
          {originalEstimate && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{getProgressPercentage()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                  style={{ width: `${Math.min(100, getProgressPercentage())}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Time by User */}
          {summary.timeSpentByUser.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Time by contributor:</h4>
              <div className="space-y-1">
                {summary.timeSpentByUser.map((userTime) => (
                  <div key={userTime.userId} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{userTime.userName}</span>
                    <span className="font-medium">{TimeTrackingService.formatTime(userTime.hours)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log Time Form */}
      {showLogForm && (
        <form onSubmit={handleLogTime} className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="timeStr" className="block text-sm font-medium text-gray-700 mb-1">
                Time Spent *
              </label>
              <input
                id="timeStr"
                type="text"
                value={newTimeLog.timeStr}
                onChange={(e) => {
                  setNewTimeLog({ ...newTimeLog, timeStr: e.target.value })
                  setTimeParseError('')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2h 30m, 1.5h, 90m"
                required
              />
              {timeParseError && (
                <p className="text-red-600 text-sm mt-1">{timeParseError}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Formats: "2h 30m", "1.5h", "90m", "2h", "30m"
              </p>
            </div>
            <div>
              <label htmlFor="workDate" className="block text-sm font-medium text-gray-700 mb-1">
                Work Date *
              </label>
              <input
                id="workDate"
                type="date"
                value={newTimeLog.workDate}
                onChange={(e) => setNewTimeLog({ ...newTimeLog, workDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Work Description
              </label>
              <textarea
                id="description"
                value={newTimeLog.description}
                onChange={(e) => setNewTimeLog({ ...newTimeLog, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="What did you work on?"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button
              type="submit"
              disabled={submitting || !newTimeLog.timeStr.trim()}
              size="sm"
            >
              Log Work
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowLogForm(false)
                setNewTimeLog({
                  timeStr: '',
                  description: '',
                  workDate: new Date().toISOString().split('T')[0],
                })
                setTimeParseError('')
              }}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Time Logs */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Work Log ({timeLogs.length})</h4>
        {timeLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No time logged yet</p>
        ) : (
          timeLogs.map((timeLog) => (
            <div
              key={timeLog.id}
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium text-blue-600">
                      {TimeTrackingService.formatTime(timeLog.hours)}
                    </span>
                    <span className="text-sm text-gray-500">
                      by {timeLog.user.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      on {formatDate(timeLog.date)}
                    </span>
                  </div>
                  {timeLog.description && (
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                      {timeLog.description}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => handleDeleteTimeLog(timeLog.id)}
                  variant="secondary"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}