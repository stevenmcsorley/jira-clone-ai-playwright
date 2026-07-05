import { useEffect, useState } from 'react'
import { formatRelativeTime } from '../../utils/relativeTime'

interface HistoryEntry {
  id: number
  field: string
  oldValue: string | null
  newValue: string | null
  createdAt: string
  actor: { id: number; name: string }
}

interface ActivitySectionProps {
  issueId: number
}

const FIELD_LABELS: Record<string, string> = {
  assigneeId: 'assignee',
  storyPoints: 'story points',
  epicId: 'epic',
  dueDate: 'due date',
}

const humaniseField = (field: string): string => FIELD_LABELS[field] ?? field

const humaniseValue = (value: string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '—'
  return value
}

/**
 * Issue change history ("Activity"), newest first, collapsible under a heading.
 * Data comes from GET /api/issues/:id/history.
 */
export const ActivitySection = ({ issueId }: ActivitySectionProps) => {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/issues/${issueId}/history`)
        if (!response.ok) return // Endpoint may not exist yet — keep empty state
        const data = await response.json()
        if (!cancelled && Array.isArray(data)) {
          setEntries(data)
        }
      } catch {
        // Network failure — keep empty state
      }
    }

    fetchHistory()
    return () => {
      cancelled = true
    }
  }, [issueId])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="activity-section">
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="flex w-full items-center justify-between text-left"
        data-testid="activity-toggle"
      >
        <h3 className="text-lg font-medium text-gray-900">
          Activity{entries.length > 0 ? ` (${entries.length})` : ''}
        </h3>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4">
          {entries.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No activity yet</p>
          ) : (
            <ul className="space-y-3">
              {entries.map(entry => (
                <li
                  key={entry.id}
                  className="flex items-start gap-3"
                  data-testid={`activity-entry-${entry.id}`}
                >
                  <div className="w-7 h-7 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">
                      {entry.actor.name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium text-gray-900">{entry.actor.name}</span>{' '}
                      changed <span className="font-medium">{humaniseField(entry.field)}</span>{' '}
                      from{' '}
                      <span className="font-medium text-gray-900">
                        {humaniseValue(entry.oldValue)}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium text-gray-900">
                        {humaniseValue(entry.newValue)}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatRelativeTime(entry.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
