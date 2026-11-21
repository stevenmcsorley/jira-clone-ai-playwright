/**
 * Reports Overview Component
 *
 * Main overview page showing 6 report cards in a grid layout,
 * matching the Jira Reports Overview design.
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { ReportIllustration } from './ReportIllustrations'
// Using regular SVG icons instead of Heroicons
// Force refresh for component cache

interface ReportsOverviewProps {
  projectId: number
}

interface ReportCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  path: string
  illustration: React.ReactNode
}

export const ReportsOverview: React.FC<ReportsOverviewProps> = ({ projectId }) => {
  const reports: ReportCard[] = [
    {
      id: 'burnup',
      title: 'Burnup report',
      description: "Visualise a sprint's completed work and compare it with its total scope. Use these insights to track progress toward sprint completion.",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
      path: `/projects/${projectId}/reports/burnup`,
      illustration: <ReportIllustration kind="burnup" />
    },
    {
      id: 'burndown',
      title: 'Sprint burndown chart',
      description: 'Track and manage the total work remaining within a sprint. After the sprint, summarise both team and individual performance.',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      path: `/projects/${projectId}/reports/burndown`,
      illustration: <ReportIllustration kind="burndown" />
    },
    {
      id: 'velocity',
      title: 'Velocity report',
      description: 'Predict the amount of work your team can commit to in future sprints by seeing and reviewing the amount of value delivered in previous ones.',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      path: `/projects/${projectId}/reports/velocity`,
      illustration: <ReportIllustration kind="velocity" />
    },
    {
      id: 'cumulative-flow',
      title: 'Cumulative flow diagram',
      description: "Shows the statuses of your project's issues over time. See which columns accumulate more issues, and identify bottlenecks in your workflow.",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
      path: `/projects/${projectId}/reports/cumulative-flow`,
      illustration: <ReportIllustration kind="cumulative-flow" />
    },
    {
      id: 'cycle-time',
      title: 'Cycle time report',
      description: 'Understand how much time it takes to ship issues through your deployment pipeline and how to deal with outliers.',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      path: `/projects/${projectId}/reports/cycle-time`,
      illustration: <ReportIllustration kind="cycle-time" />
    }
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Grid of Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Link
            key={report.id}
            to={report.path}
            className="group bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all "
          >
            <div className="p-6">
              {/* Chart/Visual */}
              <div className="mb-4">
                {report.illustration}
              </div>

              {/* Title */}
              <h3 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-blue-600">
                {report.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 leading-relaxed">
                {report.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}