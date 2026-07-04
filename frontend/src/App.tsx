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
import { BurnupReport } from './components/Reports/BurnupReport/BurnupReport'
import { BurndownChart } from './components/Reports/BurndownChart/BurndownChart'
import { VelocityReport } from './components/Reports/VelocityReport/VelocityReport'
import { CumulativeFlowDiagram } from './components/Reports/CumulativeFlowDiagram/CumulativeFlowDiagram'
import { SprintHistory } from './pages/SprintHistory'
import { Components } from './pages/Components/Components'
import { Releases } from './pages/Releases/Releases'
// import { XStateDemo } from './components/XStateDemo/XStateDemo'
import { SimpleXStateDemo } from './components/SimpleXStateDemo/SimpleXStateDemo'
import { Login } from './pages/Login'
import { Users } from './pages/Users'
import { AuthProvider } from './contexts/AuthContext'
import { RequireAuth } from './components/Auth/RequireAuth'

export const App = () => {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

const AppRoutes = () => {
  return (
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />
        <Route element={<RequireAuth />}>
        <Route
          path="/"
          element={<Navigate to="/projects" replace />}
        />
        <Route
          path="/users"
          element={
            <Layout>
              <Users />
            </Layout>
          }
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
          path="/projects/:projectId/reports/burnup"
          element={
            <Layout>
              <BurnupReport />
            </Layout>
          }
        />
        <Route
          path="/projects/:projectId/reports/burndown"
          element={
            <Layout>
              <BurndownChart />
            </Layout>
          }
        />
        <Route
          path="/projects/:projectId/reports/velocity"
          element={
            <Layout>
              <VelocityReport />
            </Layout>
          }
        />
        <Route
          path="/projects/:projectId/reports/cumulative-flow"
          element={
            <Layout>
              <CumulativeFlowDiagram />
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
        </Route>
      </Routes>
  )
}
