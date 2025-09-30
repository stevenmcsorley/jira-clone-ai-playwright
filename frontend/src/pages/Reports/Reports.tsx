/**
 * Reports Overview Page
 *
 * Advanced analytics dashboard with sprint velocity tracking, burndown charts,
 * and comprehensive project metrics using XState and Effect.ts.
 * Based on Jira's Reports Overview design.
 */

import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ReportsNavigation } from '../../components/Reports/ReportsNavigation'
import { ReportsOverview } from '../../components/Reports/ReportsOverview'
import { useProjects } from '../../hooks/useProjects'
// Testing Reports page access after fixes

export const Reports = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { projects } = useProjects()

  const currentProject = projects.find(p => p.id === Number(projectId))

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Reports Overview</h1>
        <p className="text-sm text-gray-600 mt-1">
          Track project progress with comprehensive analytics and reports
        </p>
      </div>

      <div className="flex">
        {/* Left Sidebar Navigation */}
        <ReportsNavigation projectId={projectId || ''} />

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          <ReportsOverview projectId={parseInt(projectId || '0')} />
        </div>
      </div>
    </div>
  )
}