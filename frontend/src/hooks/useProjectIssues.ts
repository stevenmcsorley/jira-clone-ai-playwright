import { useCallback, useEffect, useState } from 'react'
import { IssuesService } from '../services/api/issues.service'
import type { Issue } from '../types/domain.types'

/**
 * Plain fetch hook for a project's issues (used by the Kanban board).
 */
export const useProjectIssues = (projectId: number) => {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await IssuesService.getByProject(projectId)
      setIssues(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { issues, loading, error, refetch }
}
