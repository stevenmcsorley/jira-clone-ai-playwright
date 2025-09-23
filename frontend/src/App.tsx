import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProjectsList } from './pages/ProjectsList'
import { ProjectBoard } from './pages/ProjectBoard'
import { CreateProject } from './pages/CreateProject'
import { CreateIssue } from './pages/CreateIssue'
import { IssueDetail } from './pages/IssueDetail'
import { IssueEdit } from './pages/IssueEdit'
import { SearchResults } from './pages/SearchResults'
import { ProjectSettings } from './pages/ProjectSettings'
import { useProjects } from './hooks/useProjects'

export const App = () => {
  const { projects, loading } = useProjects()

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
          path="/projects/:projectId/settings"
          element={<ProjectSettings />}
        />
        {/* Redirect to projects list for any unmatched routes */}
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </Router>
  )
}
