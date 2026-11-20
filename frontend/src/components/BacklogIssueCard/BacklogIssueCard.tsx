import { Link } from 'react-router-dom'
import type { BacklogIssueCardProps } from './BacklogIssueCard.types'
import { getPriorityColor, getPriorityIcon } from './issuePriority'

export const BacklogIssueCard = ({
  issue,
  projectKey,
  projectId = String(issue.projectId),
  showUpdated = false,
  onDragStart,
  actions,
  className,
}: BacklogIssueCardProps) => (
  <article
    draggable={Boolean(onDragStart)}
    onDragStart={onDragStart}
    data-testid={`backlog-issue-card-${issue.id}`}
    className={[
      'min-w-0 space-y-2 rounded-lg border border-gray-200 bg-white p-3',
      onDragStart && 'cursor-move',
      className,
    ].filter(Boolean).join(' ')}
  >
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize ${
        issue.type === 'story' ? 'bg-green-100 text-green-800' :
        issue.type === 'task' ? 'bg-blue-100 text-blue-800' :
        issue.type === 'bug' ? 'bg-red-100 text-red-800' :
        'bg-purple-100 text-purple-800'
      }`}>
        {issue.type}
      </span>
      <span className="min-w-0 wrap-anywhere text-sm font-medium text-gray-500">{projectKey}-{issue.id}</span>
      <span className={`text-sm font-bold ${getPriorityColor(issue.priority)}`}>
        {getPriorityIcon(issue.priority)}
      </span>
      {showUpdated && issue.updatedAt && (
        <time className="ml-auto text-right text-xs text-gray-500">
          {new Date(issue.updatedAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </time>
      )}
    </div>

    <Link
      to={`/projects/${projectId}/issues/${issue.id}`}
      className="line-clamp-2 wrap-anywhere text-sm font-medium text-gray-900 hover:text-blue-600"
    >
      {issue.title}
    </Link>

    <div className="flex items-center gap-2">
      <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded ${
        issue.status === 'todo' ? 'bg-gray-100 text-gray-800' :
        issue.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
        issue.status === 'code_review' ? 'bg-purple-100 text-purple-800' :
        'bg-green-100 text-green-800'
      }`}>
        {issue.status === 'todo' ? 'To Do' :
         issue.status === 'in_progress' ? 'In Progress' :
         issue.status === 'code_review' ? 'Code Review' :
         'Done'}
      </span>
      {(issue.storyPoints !== null && issue.storyPoints !== undefined && issue.storyPoints !== '' && issue.storyPoints !== 0) && (
        <span className="shrink-0 inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
          {issue.storyPoints}
        </span>
      )}
      {issue.assignee ? (
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-500">
            <span className="text-xs font-bold text-white">{issue.assignee.name.charAt(0)}</span>
          </div>
          <span className="truncate text-sm text-gray-700">{issue.assignee.name}</span>
        </div>
      ) : (
        <span className="min-w-0 truncate text-sm text-gray-400">Unassigned</span>
      )}
      {actions && <div className="ml-auto shrink-0">{actions}</div>}
    </div>
  </article>
)
