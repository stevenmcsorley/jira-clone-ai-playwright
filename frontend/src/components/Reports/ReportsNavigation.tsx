/**
 * Reports Navigation Sidebar
 *
 * Left sidebar navigation for different report types,
 * matching Jira's Reports navigation design.
 */

import { Link, useLocation } from 'react-router-dom'
// Using regular SVG icons instead of Heroicons
// Force reload for Vite HMR

interface ReportsNavigationProps {
  projectId: string
}

interface ReportItem {
  id: string
  name: string
  path: string
}

export const ReportsNavigation = ({ projectId }: ReportsNavigationProps) => {
  const location = useLocation()

  const reports: ReportItem[] = [
    { id: 'overview', name: 'Overview', path: `/projects/${projectId}/reports` },
    { id: 'burnup', name: 'Burnup report', path: `/projects/${projectId}/reports/burnup` },
    { id: 'burndown', name: 'Sprint burndown', path: `/projects/${projectId}/reports/burndown` },
    { id: 'velocity', name: 'Velocity report', path: `/projects/${projectId}/reports/velocity` },
    { id: 'cumulative', name: 'Cumulative flow', path: `/projects/${projectId}/reports/cumulative-flow` },
    { id: 'cycle-time', name: 'Cycle time report', path: `/projects/${projectId}/reports/cycle-time` },
  ]

  const projectPath = `/projects/${projectId}`

  return (
    <>
      <nav
        aria-label="Reports"
        className="flex min-w-0 gap-2 overflow-x-auto bg-slate-900 px-4 py-2 text-white lg:hidden"
      >
        <Link
          to={projectPath}
          className="flex min-h-11 shrink-0 items-center whitespace-nowrap rounded px-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          Back to project
        </Link>
        {reports.map((report) => {
          const isActive = location.pathname === report.path

          return (
            <Link
              key={report.id}
              to={report.path}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-11 shrink-0 items-center whitespace-nowrap rounded px-3 text-sm ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {report.name}
            </Link>
          )
        })}
      </nav>

      <div className="hidden w-72 shrink-0 flex-col bg-slate-900 text-white lg:flex">
        {/* Project Info Header */}
        <div className="p-4 border-b border-slate-700">
          <Link
            to={projectPath}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Back to project</span>
          </Link>
        </div>

        {/* Reports Section */}
        <div className="flex-1">
          <div className="p-4">
            <h2 className="text-lg font-medium text-white mb-1">Reports</h2>
          </div>

          <nav aria-label="Reports" className="space-y-1 px-2">
            {reports.map((report) => {
              const isActive = location.pathname === report.path

              return (
                <Link
                  key={report.id}
                  to={report.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`block px-3 py-2 rounded text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {report.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 text-xs text-slate-400">
          <p>You're in a team-managed project</p>
          <button className="text-blue-400 hover:text-blue-300 mt-1">
            Learn more
          </button>
        </div>
      </div>
    </>
  )
}
