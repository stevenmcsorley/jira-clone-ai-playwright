/**
 * Board filter bar — assignee and label chips with multi-select toggling.
 * Selection semantics: OR within a dimension, AND across dimensions.
 * Purely presentational; the selected filters are applied at render time
 * inside XStateKanban so machine state (and drag-drop positions) stay intact.
 *
 * When a dimension has many chips only the first MAX_VISIBLE_CHIPS are shown,
 * followed by a "+N" pill that expands/collapses the rest (per dimension).
 */
import { useMemo, useState } from 'react'
import type { Issue } from '../../types/domain.types'

export type AssigneeFilterValue = number | 'unassigned'

export interface BoardFilters {
  assignees: AssigneeFilterValue[]
  labels: string[]
  /** Quick filter: only issues updated within the last RECENTLY_UPDATED_DAYS days. */
  recentlyUpdated: boolean
}

export const EMPTY_BOARD_FILTERS: BoardFilters = {
  assignees: [],
  labels: [],
  recentlyUpdated: false,
}

/** Window used by the "Recently Updated" quick filter. */
export const RECENTLY_UPDATED_DAYS = 7

/** Max chips shown per dimension before collapsing behind a "+N" pill. */
const MAX_VISIBLE_CHIPS = 6

/** True when an issue passes the active filters (used by the board at render time). */
export const issueMatchesFilters = (issue: Issue, filters: BoardFilters): boolean => {
  if (filters.assignees.length > 0) {
    const assigneeKey: AssigneeFilterValue = issue.assigneeId ?? 'unassigned'
    if (!filters.assignees.includes(assigneeKey)) return false
  }
  if (filters.labels.length > 0) {
    const labels = issue.labels ?? []
    if (!labels.some(label => filters.labels.includes(label))) return false
  }
  if (filters.recentlyUpdated) {
    const cutoff = Date.now() - RECENTLY_UPDATED_DAYS * 24 * 60 * 60 * 1000
    if (new Date(issue.updatedAt).getTime() < cutoff) return false
  }
  return true
}

export const hasActiveFilters = (filters: BoardFilters): boolean =>
  filters.assignees.length > 0 || filters.labels.length > 0 || filters.recentlyUpdated

const initialsOf = (name: string): string =>
  name
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

/** "+N" / "Show less" toggle pill shared by both chip dimensions. */
const OverflowTogglePill = ({
  hiddenCount,
  expanded,
  onToggle,
  testId,
}: {
  hiddenCount: number
  expanded: boolean
  onToggle: () => void
  testId: string
}) => (
  <button
    onClick={onToggle}
    className="h-8 px-3 rounded-full flex items-center justify-center text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
    data-testid={testId}
    aria-expanded={expanded}
  >
    {expanded ? 'Show less' : `+${hiddenCount}`}
  </button>
)

interface BoardFilterBarProps {
  issues: Issue[]
  filters: BoardFilters
  onChange: (filters: BoardFilters) => void
}

export const BoardFilterBar = ({ issues, filters, onChange }: BoardFilterBarProps) => {
  const [showAllAssignees, setShowAllAssignees] = useState(false)
  const [showAllLabels, setShowAllLabels] = useState(false)

  const assignees = useMemo(() => {
    const byId = new Map<number, { id: number; name: string }>()
    let hasUnassigned = false
    for (const issue of issues) {
      if (issue.assignee) {
        byId.set(issue.assignee.id, { id: issue.assignee.id, name: issue.assignee.name })
      } else {
        hasUnassigned = true
      }
    }
    return {
      users: Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name)),
      hasUnassigned,
    }
  }, [issues])

  const labels = useMemo(() => {
    const distinct = new Set<string>()
    for (const issue of issues) {
      for (const label of issue.labels ?? []) {
        distinct.add(label)
      }
    }
    return Array.from(distinct).sort((a, b) => a.localeCompare(b))
  }, [issues])

  const toggleAssignee = (value: AssigneeFilterValue) => {
    const next = filters.assignees.includes(value)
      ? filters.assignees.filter(v => v !== value)
      : [...filters.assignees, value]
    onChange({ ...filters, assignees: next })
  }

  const toggleLabel = (label: string) => {
    const next = filters.labels.includes(label)
      ? filters.labels.filter(l => l !== label)
      : [...filters.labels, label]
    onChange({ ...filters, labels: next })
  }

  if (
    assignees.users.length === 0 &&
    !assignees.hasUnassigned &&
    labels.length === 0 &&
    !hasActiveFilters(filters)
  ) {
    return null
  }

  const hiddenAssigneeCount = assignees.users.length - MAX_VISIBLE_CHIPS
  const visibleUsers =
    showAllAssignees || hiddenAssigneeCount <= 0
      ? assignees.users
      : assignees.users.slice(0, MAX_VISIBLE_CHIPS)

  const hiddenLabelCount = labels.length - MAX_VISIBLE_CHIPS
  const visibleLabels =
    showAllLabels || hiddenLabelCount <= 0 ? labels : labels.slice(0, MAX_VISIBLE_CHIPS)

  return (
    <div
      className="flex flex-wrap items-center gap-3 mb-4"
      data-testid="board-filter-bar"
    >
      {/* Assignee chips */}
      <div className="flex flex-wrap items-center gap-1.5" data-testid="assignee-filters">
        {visibleUsers.map(user => {
          const active = filters.assignees.includes(user.id)
          return (
            <button
              key={user.id}
              onClick={() => toggleAssignee(user.id)}
              title={user.name}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                active
                  ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1'
                  : 'bg-blue-500 text-white hover:ring-2 hover:ring-blue-200'
              }`}
              data-testid={`assignee-filter-${user.id}`}
              aria-pressed={active}
            >
              {initialsOf(user.name)}
            </button>
          )
        })}
        {hiddenAssigneeCount > 0 && (
          <OverflowTogglePill
            hiddenCount={hiddenAssigneeCount}
            expanded={showAllAssignees}
            onToggle={() => setShowAllAssignees(prev => !prev)}
            testId="assignee-overflow-toggle"
          />
        )}
        {assignees.hasUnassigned && (
          <button
            onClick={() => toggleAssignee('unassigned')}
            title="Unassigned"
            className={`h-8 px-3 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
              filters.assignees.includes('unassigned')
                ? 'bg-gray-600 text-white ring-2 ring-gray-300 ring-offset-1'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
            data-testid="assignee-filter-unassigned"
            aria-pressed={filters.assignees.includes('unassigned')}
          >
            Unassigned
          </button>
        )}
      </div>

      {/* Label chips */}
      {labels.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" data-testid="label-filters">
          {visibleLabels.map(label => {
            const active = filters.labels.includes(label)
            return (
              <button
                key={label}
                onClick={() => toggleLabel(label)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                  active
                    ? 'bg-orange-500 text-white ring-2 ring-orange-200 ring-offset-1'
                    : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                }`}
                data-testid={`label-filter-${label}`}
                aria-pressed={active}
              >
                {label}
              </button>
            )
          })}
          {hiddenLabelCount > 0 && (
            <OverflowTogglePill
              hiddenCount={hiddenLabelCount}
              expanded={showAllLabels}
              onToggle={() => setShowAllLabels(prev => !prev)}
              testId="label-overflow-toggle"
            />
          )}
        </div>
      )}

      {/* Recently-updated quick filter (toggled from the board's Quick Filters menu) */}
      {filters.recentlyUpdated && (
        <button
          onClick={() => onChange({ ...filters, recentlyUpdated: false })}
          title={`Only issues updated in the last ${RECENTLY_UPDATED_DAYS} days — click to remove`}
          className="text-xs px-3 py-1.5 rounded-full font-medium bg-blue-600 text-white ring-2 ring-blue-200 ring-offset-1 transition-all"
          data-testid="recently-updated-filter-pill"
          aria-pressed
        >
          Updated &lt;{RECENTLY_UPDATED_DAYS}d
        </button>
      )}

      {/* Clear */}
      {hasActiveFilters(filters) && (
        <button
          onClick={() => onChange(EMPTY_BOARD_FILTERS)}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          data-testid="clear-filters"
        >
          Clear
        </button>
      )}
    </div>
  )
}
