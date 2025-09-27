import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProjectsList } from './pages/ProjectsList'
import { ProjectBoard } from './pages/ProjectBoard'
import { Backlog } from './pages/Backlog'
import { CreateProject } from './pages/CreateProject'
import { CreateIssue } from './pages/CreateIssue'
import { IssueDetail } from './pages/IssueDetail'
import { IssueEdit } from './pages/IssueEdit'
import { IssuesList } from './pages/IssuesList'
import { SearchResults } from './pages/SearchResults'
import { Search } from './pages/Search'
import { ProjectSettings } from './pages/ProjectSettings'
import { Reports } from './pages/Reports'
import { SprintHistory } from './pages/SprintHistory'
import { Components } from './pages/Components/Components'
import { Releases } from './pages/Releases/Releases'
// import { XStateDemo } from './components/XStateDemo/XStateDemo'
import { SimpleXStateDemo } from './components/SimpleXStateDemo/SimpleXStateDemo'
import { useProjects } from './hooks/useProjects'
import { initializeInspector } from './lib/xstate-inspector'

// Initialize XState inspector in development
// initializeInspector() // Temporarily disabled

export const App = () => {
  const { loading } = useProjects()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/projects" replace />}
        />
        <Route
          path="/projects"
          element={
            <Layout>
              <ProjectsList />
            </Layout>
          }
        />
        <Route
          path="/search"
          element={
            <Layout>
              <Search />
            </Layout>
          }
        />
        <Route
          path="/projects/create"
          element={<CreateProject />}
        />
        <Route
          path="/projects/:projectId"
          element={
            <Layout>
              <ProjectBoard />
            </Layout>
          }
        />
        <Route
          path="/projects/:projectId/backlog"
          element={
            <Layout>
              <Backlog />
            </Layout>
          }
        />
        <Route
          path="/projects/:projectId/issues"
          element={
            <Layout>
              <IssuesList />
            </Layout>
          }
        />
        <Route
          path="/projects/:projectId/issues/:issueId"
          element={
            <Layout>
              <IssueDetail />
            </Layout>
          }
        />
        <Route
          path="/projects/:projectId/issues/:issueId/edit"
          element={
            <Layout>
              <IssueEdit />
            </Layout>
          }
        />
        <Route
          path="/projects/:projectId/issues/create"
          element={
            <Layout>
              <CreateIssue />
            </Layout>
          }
        />
        <Route
          path="/projects/:projectId/search"
          element={
            <Layout>
              <SearchResults />
            </Layout>
          }
        />
        <Route
          path="/projects/:projectId/reports"
          element={
            <Layout>
              <Reports />
            </Layout>
          }
        />
        <Route
          path="/projects/:projectId/history"
          element={
            <Layout>
              <SprintHistory />
            </Layout>
          }
        />
        <Route
          path="/projects/:projectId/settings"
          element={<ProjectSettings />}
        />
        <Route
          path="/projects/:projectId/components"
          element={
            <Layout>
              <Components />
            </Layout>
          }
        />
        <Route
          path="/projects/:projectId/releases"
          element={
            <Layout>
              <Releases />
            </Layout>
          }
        />
        {/* <Route
          path="/xstate-demo"
          element={
            <Layout>
              <XStateDemo />
            </Layout>
          }
        /> */}
        <Route
          path="/simple-xstate-demo"
          element={
            <Layout>
              <SimpleXStateDemo />
            </Layout>
          }
        />
        {/* Redirect to projects list for any unmatched routes */}
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </Router>
  )
}
