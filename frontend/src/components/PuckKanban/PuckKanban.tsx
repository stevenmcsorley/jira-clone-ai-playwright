import { Puck, type Data } from '@measured/puck'
import type { Issue, IssueStatus } from '../../types/domain.types'

interface PuckInstance {
  renderDropZone: (zoneName: string) => React.ReactNode;
}

interface IssueComponentProps {
  issue: Issue
}

interface ColumnComponentProps {
  title: string
  status: IssueStatus
  children?: React.ReactNode
}

const IssueComponent = ({ issue }: IssueComponentProps) => {
  const priorityColors = {
    low: 'border-l-green-400',
    medium: 'border-l-yellow-400',
    high: 'border-l-orange-400',
    urgent: 'border-l-red-400',
  }

  const typeIcons = {
    story: '📖',
    task: '✅',
    bug: '🐛',
    epic: '🎯',
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${priorityColors[issue.priority]} p-4 mb-3 cursor-move hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{typeIcons[issue.type]}</span>
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {issue.project?.key}-{issue.id}
          </span>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-medium">
          {issue.priority}
        </span>
      </div>

      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
        {issue.title}
      </h3>

      {issue.description && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {issue.description}
        </p>
      )}

      {issue.assignee && (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {issue.assignee.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm text-gray-700">
            {issue.assignee.name.split(' ')[0]}
          </span>
        </div>
      )}
    </div>
  )
}

const ColumnComponent = ({ title, status, children }: ColumnComponentProps) => {
  const statusConfig = {
    todo: {
      color: 'bg-gray-50 border-gray-200',
      headerColor: 'text-gray-700',
      icon: '📋',
    },
    in_progress: {
      color: 'bg-blue-50 border-blue-200',
      headerColor: 'text-blue-700',
      icon: '🚧',
    },
    code_review: {
      color: 'bg-purple-50 border-purple-200',
      headerColor: 'text-purple-700',
      icon: '👀',
    },
    done: {
      color: 'bg-green-50 border-green-200',
      headerColor: 'text-green-700',
      icon: '✅',
    },
  }

  const config = statusConfig[status]

  return (
    <div className={`rounded-lg border-2 border-dashed p-4 min-h-[500px] ${config.color}`}>
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
        <span className="text-xl">{config.icon}</span>
        <h2 className={`font-bold text-lg ${config.headerColor}`}>
          {title}
        </h2>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

const config = {
  components: {
    Issue: {
      fields: {
        issue: {
          type: 'custom' as const,
        },
      },
      render: ({ issue }: IssueComponentProps) => <IssueComponent issue={issue} />,
    },
    Column: {
      fields: {
        title: {
          type: 'text' as const,
        },
        status: {
          type: 'select' as const,
          options: [
            { label: 'To Do', value: 'todo' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Done', value: 'done' },
          ],
        },
      },
      render: ({ title, status, puck }: ColumnComponentProps & { puck: PuckInstance }) => (
        <ColumnComponent title={title} status={status}>
          {puck.renderDropZone('items')}
        </ColumnComponent>
      ),
    },
  },
}

interface PuckKanbanProps {
  issues: Issue[]
  onIssueUpdate?: (issueId: number, updates: Partial<Issue>) => void
}

export const PuckKanban = ({ issues, onIssueUpdate: _onIssueUpdate }: PuckKanbanProps) => {
  // Convert issues to Puck data format
  const todoIssues = issues.filter(issue => issue.status === 'todo')
  const inProgressIssues = issues.filter(issue => issue.status === 'in_progress')
  const doneIssues = issues.filter(issue => issue.status === 'done')

  const initialData: Data = {
    content: [
      {
        type: 'Column',
        props: {
          title: 'To Do',
          status: 'todo',
        },
        content: {
          items: todoIssues.map(issue => ({
            type: 'Issue',
            props: { issue },
          })),
        },
      },
      {
        type: 'Column',
        props: {
          title: 'In Progress',
          status: 'in_progress',
        },
        content: {
          items: inProgressIssues.map(issue => ({
            type: 'Issue',
            props: { issue },
          })),
        },
      },
      {
        type: 'Column',
        props: {
          title: 'Done',
          status: 'done',
        },
        content: {
          items: doneIssues.map(issue => ({
            type: 'Issue',
            props: { issue },
          })),
        },
      },
    ],
    root: {},
  }

  const handleDataChange = (newData: Data) => {
    // Handle issue movements between columns
    console.log('Data changed:', newData)
    // Extract moved issues and call onIssueUpdate
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <Puck
        config={config}
        data={initialData}
        onChange={handleDataChange}
        renderRootFields={() => null}
        renderComponentList={() => null}
      />
    </div>
  )
}