/**
 * Reports Overview Component
 *
 * Main overview page showing 6 report cards in a grid layout,
 * matching the Jira Reports Overview design.
 */

import React from 'react'
import { Link } from 'react-router-dom'
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
  mockChart: React.ReactNode
}

// Mock chart components (we'll replace these with real charts later)
const BurnupMockChart = () => (
  <div className="relative h-24 bg-gray-50 rounded">
    <div className="absolute inset-0 flex items-end p-2">
      <div className="w-full flex items-end space-x-1">
        <div className="h-8 w-4 bg-orange-400 rounded-sm"></div>
        <div className="h-12 w-4 bg-orange-400 rounded-sm"></div>
        <div className="h-16 w-4 bg-orange-400 rounded-sm"></div>
        <div className="h-10 w-4 bg-green-400 rounded-sm"></div>
        <div className="h-14 w-4 bg-green-400 rounded-sm"></div>
        <div className="h-18 w-4 bg-green-400 rounded-sm"></div>
      </div>
    </div>
    <svg className="absolute inset-0 w-full h-full">
      <path d="M 10 20 Q 20 15 30 18 T 50 12" stroke="#f59e0b" strokeWidth="2" fill="none" />
      <path d="M 10 22 Q 20 18 30 20 T 50 16" stroke="#10b981" strokeWidth="2" fill="none" />
    </svg>
  </div>
)

const BurndownMockChart = () => (
  <div className="relative h-24 bg-gray-50 rounded">
    <div className="absolute inset-0 flex items-end p-2">
      <div className="w-full flex items-end space-x-1">
        <div className="h-16 w-4 bg-red-400 rounded-sm"></div>
        <div className="h-14 w-4 bg-red-400 rounded-sm"></div>
        <div className="h-10 w-4 bg-orange-400 rounded-sm"></div>
        <div className="h-8 w-4 bg-orange-400 rounded-sm"></div>
        <div className="h-4 w-4 bg-green-400 rounded-sm"></div>
        <div className="h-2 w-4 bg-green-400 rounded-sm"></div>
      </div>
    </div>
    <svg className="absolute inset-0 w-full h-full">
      <path d="M 5 10 L 15 15 L 25 18 L 35 20 L 45 22 L 55 23" stroke="#f59e0b" strokeWidth="2" fill="none" />
    </svg>
  </div>
)

const VelocityMockChart = () => (
  <div className="h-24 bg-gray-50 rounded flex items-end p-2 space-x-1">
    <div className="h-8 w-4 bg-purple-400 rounded-sm"></div>
    <div className="h-12 w-4 bg-purple-400 rounded-sm"></div>
    <div className="h-16 w-4 bg-purple-400 rounded-sm"></div>
    <div className="h-6 w-4 bg-purple-400 rounded-sm"></div>
    <div className="h-14 w-4 bg-purple-400 rounded-sm"></div>
    <div className="h-18 w-4 bg-purple-400 rounded-sm"></div>
    <div className="h-10 w-4 bg-purple-400 rounded-sm"></div>
  </div>
)

const CumulativeFlowMockChart = () => (
  <div className="h-24 bg-gray-50 rounded relative overflow-hidden">
    <svg className="w-full h-full">
      <path d="M 0 24 Q 10 20 20 18 T 40 15 L 60 24 Z" fill="#a78bfa" />
      <path d="M 0 24 Q 10 22 20 20 T 40 18 L 60 24 Z" fill="#fbbf24" />
      <path d="M 0 24 Q 10 23 20 22 T 40 21 L 60 24 Z" fill="#34d399" />
    </svg>
  </div>
)

const CycleTimeMockChart = () => (
  <div className="h-24 bg-gray-50 rounded flex flex-col p-2 space-y-1">
    <div className="flex items-center space-x-2">
      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
      <div className="h-1 w-16 bg-gray-300 rounded"></div>
      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
    </div>
    <div className="flex items-center space-x-2">
      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
      <div className="h-1 w-12 bg-gray-300 rounded"></div>
      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
    </div>
    <div className="flex items-center space-x-2">
      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
      <div className="h-1 w-20 bg-gray-300 rounded"></div>
      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
    </div>
    <div className="flex items-end space-x-1 mt-2">
      <div className="h-4 w-2 bg-gray-400 rounded-sm"></div>
      <div className="h-6 w-2 bg-gray-400 rounded-sm"></div>
      <div className="h-3 w-2 bg-gray-400 rounded-sm"></div>
      <div className="h-8 w-2 bg-gray-400 rounded-sm"></div>
    </div>
  </div>
)

const DeploymentMockChart = () => (
  <div className="h-24 bg-gray-50 rounded flex flex-col p-2">
    <div className="flex items-end space-x-1 flex-1">
      <div className="h-6 w-3 bg-gray-400 rounded-sm"></div>
      <div className="h-8 w-3 bg-gray-400 rounded-sm"></div>
      <div className="h-4 w-3 bg-gray-400 rounded-sm"></div>
      <div className="h-10 w-3 bg-gray-400 rounded-sm"></div>
      <div className="h-12 w-3 bg-green-400 rounded-sm"></div>
    </div>
    <svg className="w-full h-8">
      <path d="M 2 6 Q 8 4 14 5 T 26 3 L 32 6" stroke="#3b82f6" strokeWidth="2" fill="none" />
      <circle cx="6" cy="5" r="2" fill="#3b82f6" />
    </svg>
  </div>
)

export const ReportsOverview: React.FC<ReportsOverviewProps> = ({ projectId }) => {
  const reports: ReportCard[] = [
    {
      id: 'burnup',
      title: 'Burnup report',
      description: "Visualise a sprint's completed work and compare it with its total scope. Use these insights to track progress toward sprint completion.",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
      path: `/projects/${projectId}/reports/burnup`,
      mockChart: <BurnupMockChart />
    },
    {
      id: 'burndown',
      title: 'Sprint burndown chart',
      description: 'Track and manage the total work remaining within a sprint. After the sprint, summarise both team and individual performance.',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      path: `/projects/${projectId}/reports/burndown`,
      mockChart: <BurndownMockChart />
    },
    {
      id: 'velocity',
      title: 'Velocity report',
      description: 'Predict the amount of work your team can commit to in future sprints by seeing and reviewing the amount of value delivered in previous ones.',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      path: `/projects/${projectId}/reports/velocity`,
      mockChart: <VelocityMockChart />
    },
    {
      id: 'cumulative-flow',
      title: 'Cumulative flow diagram',
      description: "Shows the statuses of your project's issues over time. See which columns accumulate more issues, and identify bottlenecks in your workflow.",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
      path: `/projects/${projectId}/reports/cumulative-flow`,
      mockChart: <CumulativeFlowMockChart />
    },
    {
      id: 'cycle-time',
      title: 'Cycle time report',
      description: 'Understand how much time it takes to ship issues through your deployment pipeline and how to deal with outliers.',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      path: `/projects/${projectId}/reports/cycle-time`,
      mockChart: <CycleTimeMockChart />
    },
    {
      id: 'deployment-frequency',
      title: 'Deployment frequency report',
      description: 'Understand your deployment frequency to understand risk and how often you are shipping value to your customers.',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>,
      path: `/projects/${projectId}/reports/deployment-frequency`,
      mockChart: <DeploymentMockChart />
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
            className="group bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all hover:shadow-md"
          >
            <div className="p-6">
              {/* Chart/Visual */}
              <div className="mb-4">
                {report.mockChart}
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