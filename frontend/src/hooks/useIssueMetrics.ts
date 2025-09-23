import { useState, useEffect } from 'react'
import { SubtasksService, type SubtaskProgress } from '../services/api/subtasks.service'
import { CommentsService } from '../services/api/comments.service'
import { TimeTrackingService, type TimeTrackingSummary } from '../services/api/time-tracking.service'

interface IssueMetrics {
  subtaskProgress?: SubtaskProgress
  commentCount: number
  timeSpent: number
  loading: boolean
}

export const useIssueMetrics = (issueId: number) => {
  const [metrics, setMetrics] = useState<IssueMetrics>({
    commentCount: 0,
    timeSpent: 0,
    loading: true
  })

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setMetrics(prev => ({ ...prev, loading: true }))

        const [subtaskProgress, comments, timeTracking] = await Promise.allSettled([
          SubtasksService.getProgress(issueId),
          CommentsService.getByIssue(issueId),
          TimeTrackingService.getTimeTrackingSummary(issueId)
        ])

        setMetrics({
          subtaskProgress: subtaskProgress.status === 'fulfilled' ? subtaskProgress.value : undefined,
          commentCount: comments.status === 'fulfilled' ? comments.value.length : 0,
          timeSpent: timeTracking.status === 'fulfilled' ? timeTracking.value.totalTimeSpent : 0,
          loading: false
        })
      } catch (error) {
        console.error('Error fetching issue metrics:', error)
        setMetrics(prev => ({ ...prev, loading: false }))
      }
    }

    fetchMetrics()
  }, [issueId])

  return metrics
}