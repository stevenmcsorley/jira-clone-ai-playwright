import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Check, Search } from 'lucide-react'
import { useProjects } from '../../hooks/useProjects'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { useAuth } from '../../contexts/AuthContext'
import { ActiveTimerDisplay } from '../ActiveTimerDisplay'
import { QuickActions } from '../QuickActions'
import { Breadcrumb } from '../Breadcrumb'
import { GlobalSearch } from '../Search/GlobalSearch'
import { NotificationBell } from '../Notifications'
import { ThemeToggle } from '../ThemeToggle'
import { WorkspaceIcon } from '../../lib/workspaceIcons'
import { Mark } from './Mark'
import { projectSubTabs, projectTabs, workspaceTabs } from './navigation'
import type { NavTab } from './navigation'
import styles from './Layout.module.css'

interface LayoutProps {
  children: React.ReactNode
}

const tabClass = (active: boolean) =>
  `relative inline-flex min-h-11 items-center whitespace-nowrap border-b-2 px-3 text-sm font-medium focus-visible:outline-offset-[-2px] md:min-h-10 ${
    active ? 'border-blue-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900'
  }`

const Tabs = ({ tabs, pathname, label }: { tabs: NavTab[]; pathname: string; label: string }) => (
  <nav aria-label={label} className="-mb-px flex gap-1 overflow-x-auto overflow-y-hidden max-sm:[mask-image:linear-gradient(to_right,black_88%,transparent)]">
    {tabs.map(tab => {
      const active = tab.match(pathname)
      return (
        <Link key={tab.to} to={tab.to} aria-current={active ? 'page' : undefined} className={tabClass(active)} data-testid={`nav-${tab.label.toLowerCase().replace(/\s+/g, '-')}`}>
          {tab.label}
        </Link>
      )
    })}
  </nav>
)

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  const { projectId } = useParams<{ projectId: string }>()
  const { projects } = useProjects()
  const { user, logout, workspaces, currentWorkspace, switchWorkspace } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchTrigger = useRef<HTMLButtonElement>(null)
  const searchDialog = useRef<HTMLDivElement>(null)

  const currentProject = projects.find(p => p.id === Number(projectId))
  const inProject = location.pathname.includes('/projects/') && !!projectId
  const workspaceName = currentWorkspace?.name || 'Ossicone'
  // Breadcrumbs only where the tabs cannot say where you are: inside one issue or a create or edit page.
  const showCrumbs = /\/issues\/[^/]+|\/projects\/create|\/issues\/create/.test(location.pathname)
  const subTabs = inProject ? projectSubTabs(projectId!, location.pathname) : null

  const closeSearch = useCallback(() => setSearchOpen(false), [])
  useEscapeKey(searchOpen, closeSearch)
  useBodyScrollLock(searchOpen)
  useFocusTrap(searchDialog, searchOpen, searchTrigger, 'input')

  useEffect(() => {
    if (!searchOpen) return
    const wide = window.matchMedia('(min-width: 40rem)')
    const close = () => { if (wide.matches) closeSearch() }
    close()
    wide.addEventListener('change', close)
    return () => wide.removeEventListener('change', close)
  }, [searchOpen, closeSearch])

  const initials = (user?.name || '?').split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50">
      <div inert={searchOpen}>
        <ActiveTimerDisplay />

        {/* Workspace bar */}
        <header className="border-b border-gray-200 bg-white" data-testid="app-header">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-3 sm:px-6">
            <Link to="/today" className="flex min-h-11 items-center gap-2 text-base font-semibold tracking-tight text-gray-900" aria-label="Ossicone, go to Today">
              <Mark className="size-6" />
              <span className="hidden sm:inline">Ossicone</span>
            </Link>

            <div className="order-last w-full sm:order-none sm:w-auto">
              <Tabs tabs={workspaceTabs} pathname={location.pathname} label="Workspace" />
            </div>

            <div className="ml-auto hidden max-w-md flex-1 sm:block">
              <GlobalSearch onNavigate={(path) => { window.location.href = path }} className="w-full" />
            </div>

            <div className={`ml-auto flex items-center gap-1 sm:ml-0 md:gap-2 ${styles.actions}`}>
              <button
                ref={searchTrigger}
                type="button"
                onClick={() => { setUserMenuOpen(false); setSearchOpen(true) }}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 sm:hidden"
                aria-label="Search"
                aria-haspopup="dialog"
                aria-expanded={searchOpen}
                data-testid="mobile-search-toggle"
              >
                <Search className="size-5" strokeWidth={1.5} aria-hidden="true" />
              </button>
              <QuickActions />
              <NotificationBell />
              <ThemeToggle />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(open => !open)}
                  className="flex size-8 items-center justify-center rounded-full border border-gray-300 bg-gray-100 text-xs font-semibold text-gray-700 hover:border-gray-400"
                  title={user?.name}
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                >
                  {initials}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-60 rounded-lg border border-gray-300 bg-white py-1">
                    <div className="border-b border-gray-200 px-4 py-2">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    {workspaces.length > 0 && (
                      <div className="mb-1 border-b border-gray-200 pb-1">
                        <p className="px-4 pb-1 pt-2 text-xs font-medium text-gray-500">Workspaces</p>
                        {workspaces.map(workspace => {
                          const isCurrent = workspace.id === currentWorkspace?.id
                          return (
                            <button
                              key={workspace.id}
                              onClick={() => { if (!isCurrent) switchWorkspace(workspace.id); setUserMenuOpen(false) }}
                              className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <WorkspaceIcon name={workspace.name} icon={workspace.icon} iconImage={workspace.iconImage} className="size-5" textClassName="text-[10px]" />
                                <span className="truncate">{workspace.name}</span>
                              </span>
                              {isCurrent && <Check className="ml-2 size-4 shrink-0 text-blue-600" strokeWidth={1.5} aria-hidden="true" />}
                            </button>
                          )
                        })}
                        <Link to="/workspace" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          Workspace settings
                        </Link>
                      </div>
                    )}
                    <Link to="/account" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Account settings</Link>
                    <Link to="/users" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">People</Link>
                    <button onClick={logout} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50">Sign out</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Project strip: only inside a project */}
        {inProject && (
          <div className="border-b border-gray-200 bg-white" data-testid="project-strip">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-3 sm:px-6">
              <Link to={`/projects/${projectId}`} className="flex min-h-11 items-center gap-2 text-sm text-gray-900 md:min-h-10">
                <span className="rounded border border-gray-300 px-1.5 py-0.5 font-mono text-xs text-gray-600">{currentProject?.key ?? '…'}</span>
                <span className="max-w-[16rem] truncate font-medium">{currentProject?.name ?? 'Project'}</span>
              </Link>
              <Tabs tabs={projectTabs(projectId!)} pathname={location.pathname} label={`${currentProject?.name ?? 'Project'} sections`} />
            </div>
            {subTabs && (
              <div className="border-t border-gray-200 px-3 sm:px-6" data-testid="project-subtabs">
                <Tabs tabs={subTabs} pathname={location.pathname} label="Sub-sections" />
              </div>
            )}
          </div>
        )}

        {showCrumbs && <Breadcrumb />}

        <div className="sr-only" aria-live="polite">{workspaceName}</div>

        {children}
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-70 sm:hidden">
          <div className="absolute inset-0 bg-black/50" aria-hidden="true" onClick={closeSearch} />
          <div ref={searchDialog} role="dialog" aria-modal="true" aria-label="Search" tabIndex={-1} className="relative w-full bg-white p-3" data-testid="mobile-search-dialog">
            <button type="button" onClick={closeSearch} className="mb-2 ml-auto block min-h-11 rounded-md px-3 text-sm text-gray-700 hover:bg-gray-100">Close</button>
            <GlobalSearch onNavigate={(path) => { closeSearch(); window.location.href = path }} className="w-full" />
          </div>
        </div>
      )}
    </div>
  )
}
