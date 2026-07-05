import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Button } from '../ui/Button'
import { useProjects } from '../../hooks/useProjects'
import { useAuth } from '../../contexts/AuthContext'
import { ActiveTimerDisplay } from '../ActiveTimerDisplay'
import { QuickActions } from '../QuickActions'
import { Breadcrumb } from '../Breadcrumb'
import { GlobalSearch } from '../Search/GlobalSearch'
import { NotificationBell } from '../Notifications'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  const { projectId } = useParams<{ projectId: string }>()
  const { projects } = useProjects()
  const { user, logout, workspaces, currentWorkspace, switchWorkspace } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const currentProject = projects.find(p => p.id === Number(projectId))
  const isProjectBoard = location.pathname.includes('/projects/') && projectId

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
          data-testid="sidebar-backdrop"
        />
      )}

      {/* Left Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ease-in-out md:static md:z-auto md:translate-x-0 md:transition-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        data-testid="app-sidebar"
      >
        {/* Project Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {currentProject?.key || 'OSS'}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {currentProject?.name || 'Ossicone'}
              </h3>
              <p className="text-xs text-gray-500">Software project</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4">
          <div className="space-y-1">
                        <Link
              to="/projects"
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/projects'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              Projects
            </Link>

            <Link
              to="/search"
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/search'
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Advanced Search
            </Link>

            <Link
              to={isProjectBoard ? `/projects/${projectId}/backlog` : '#'}
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname.includes('/backlog')
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Backlog
            </Link>

            <Link
              to={isProjectBoard ? `/projects/${projectId}` : '#'}
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                isProjectBoard && !location.pathname.includes('/backlog') && !location.pathname.includes('/issues')
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              Board
            </Link>

            <Link
              to={isProjectBoard ? `/projects/${projectId}/reports` : '#'}
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname.includes('/reports')
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2.707 4.293a1 1 0 00-1.414 1.414L7.586 13a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L9 10.172 6.707 9.707z" clipRule="evenodd" />
              </svg>
              Reports
            </Link>

            <Link
              to={isProjectBoard ? `/projects/${projectId}/history` : '#'}
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname.includes('/history')
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Sprint History
            </Link>

            <Link
              to={isProjectBoard ? `/projects/${projectId}/issues` : '#'}
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname.includes('/issues') && !location.pathname.includes('/board')
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Issues
            </Link>

            <Link
              to="/mcp"
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/mcp'
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              AI Agent
            </Link>

            <Link
              to={isProjectBoard ? `/projects/${projectId}/settings` : '#'}
              onClick={closeSidebar}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Settings
            </Link>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Active Timer Display */}
        <ActiveTimerDisplay />

        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Mobile menu toggle */}
              <button
                onClick={() => setSidebarOpen(open => !open)}
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                aria-label="Toggle navigation menu"
                data-testid="sidebar-toggle"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link to="/projects" className="flex items-center gap-2 text-xl font-bold text-blue-600">
                <img src="/logo.png" alt="" className="w-7 h-7 rounded-md" />
                Ossicone
              </Link>
            </div>

            {/* Global Search */}
            <div className="hidden sm:block flex-1 max-w-md mx-4 md:mx-8">
              <GlobalSearch
                onNavigate={(path) => window.location.href = path}
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-3">
              {location.pathname === '/projects' && (
                <Link to="/projects/create">
                  <Button
                    variant="secondary"
                    data-testid="create-project-button"
                  >
                    <span className="hidden sm:inline">Create Project</span>
                    <span className="sm:hidden">Create</span>
                  </Button>
                </Link>
              )}
              {/* Quick Actions in Header */}
              <QuickActions />
              <NotificationBell />
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(open => !open)}
                  className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover:ring-2 hover:ring-blue-300"
                  title={user?.name}
                >
                  <span className="text-sm font-medium text-blue-700">
                    {(user?.name || '?')
                      .split(' ')
                      .map(part => part[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    {workspaces.length > 0 && (
                      <div className="border-b border-gray-100 pb-1 mb-1">
                        <p className="px-4 pt-2 pb-1 text-xs font-medium text-gray-400 uppercase">
                          Workspaces
                        </p>
                        {workspaces.map(workspace => {
                          const isCurrent = workspace.id === currentWorkspace?.id
                          return (
                            <button
                              key={workspace.id}
                              onClick={() => {
                                if (!isCurrent) {
                                  switchWorkspace(workspace.id)
                                }
                                setUserMenuOpen(false)
                              }}
                              className="flex w-full items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                            >
                              <span className="truncate">{workspace.name}</span>
                              {isCurrent && (
                                <svg className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          )
                        })}
                        <Link
                          to="/workspace"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Workspace settings
                        </Link>
                      </div>
                    )}
                    <Link
                      to="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Account settings
                    </Link>
                    <Link
                      to="/users"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      People
                    </Link>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumb Navigation */}
        <Breadcrumb />

        {/* Page Content */}
        {children}
      </div>
    </div>
  )
}