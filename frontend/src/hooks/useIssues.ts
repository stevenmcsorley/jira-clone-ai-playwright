import { useState, useEffect, useCallback } from 'react'
import { IssuesService } from '../services/api/issues.service'
import type { Issue, CreateIssueRequest, UpdateIssueRequest } from '../types/domain.types'

export const useIssues = (projectId?: number) => {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      // Clear issues immediately when switching projects
      setIssues([])

      const data = projectId
        ? await IssuesService.getByProject(projectId)
        : await IssuesService.getAll()
      setIssues(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch issues')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const updateIssue = async (issueId: number, updates: UpdateIssueRequest) => {
    try {
      const updatedIssue = await IssuesService.update(issueId, updates)
      setIssues(prev =>
        prev.map(issue =>
          issue.id === issueId ? updatedIssue : issue
        )
      )
      return updatedIssue
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update issue')
      throw err
    }
  }

  const createIssue = async (issueData: CreateIssueRequest) => {
    try {
      const newIssue = await IssuesService.create(issueData)
      setIssues(prev => [...prev, newIssue])
      return newIssue
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create issue')
      throw err
    }
  }

  useEffect(() => {
    // Clear previous issues immediately when projectId changes
    setIssues([])
    setLoading(true)

    // Only fetch if we have a projectId, or if we want all issues
    if (projectId !== undefined) {
      fetchIssues()
    } else {
      setLoading(false)
    }
  }, [projectId, fetchIssues])

  return {
    issues,
    loading,
    error,
    refetch: fetchIssues,
    updateIssue,
    createIssue,
  }
}