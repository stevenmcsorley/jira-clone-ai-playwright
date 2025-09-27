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
    <div className="min-h-screen bg-gray-50">
      {/* Header Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <nav className="flex items-center text-sm text-gray-500">
          <Link to="/projects" className="hover:text-gray-700">Projects</Link>
          <span className="mx-2">/</span>
          <Link to={`/projects/${projectId}`} className="hover:text-gray-700">
            {currentProject?.name || 'Project'}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Reports</span>
        </nav>
        <h1 className="text-2xl font-semibold text-gray-900 mt-2">Overview</h1>
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