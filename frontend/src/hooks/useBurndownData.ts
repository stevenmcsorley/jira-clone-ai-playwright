import { useCallback, useEffect, useState } from 'react'

/**
 * Plain fetch hook for sprint burndown data (used by the Burndown report).
 * Generic because each report types the API rows locally.
 */
export const useBurndownData = <T = unknown>(sprintId?: number) => {
  const [burndownData, setBurndownData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    if (sprintId === undefined) {
      setBurndownData([])
      return
    }
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/analytics/burndown/${sprintId}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setBurndownData(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [sprintId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { burndownData, loading, error, refetch }
}
