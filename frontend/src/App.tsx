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
import { Repository } from './pages/Repository'
import { Reports } from './pages/Reports'
import { BurnupReport } from './components/Reports/BurnupReport/BurnupReport'
import { BurndownChart } from './components/Reports/BurndownChart/BurndownChart'
import { VelocityReport } from './components/Reports/VelocityReport/VelocityReport'
import { CumulativeFlowDiagram } from './components/Reports/CumulativeFlowDiagram/CumulativeFlowDiagram'
import { CycleTimeReport } from './components/Reports/CycleTimeReport'
import { SprintHistory } from './pages/SprintHistory'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { InviteAccept } from './pages/InviteAccept'
import { WorkspaceSettings } from './pages/WorkspaceSettings'
import { Users } from './pages/Users'
import { Account } from './pages/Account'
import { McpSetup } from './pages/McpSetup'
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
        <Route
          path="/register"
          element={<Register />}
        />
        <Route
          path="/invite/:token"
          element={<InviteAccept />}
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
          path="/account"
          element={
            <Layout>
              <Account />
            </Layout>
          }
        />
        <Route
          path="/workspace"
          element={
            <Layout>
              <WorkspaceSettings />
            </Layout>
          }
        />
        <Route
          path="/mcp"
          element={
            <Layout>
              <McpSetup />
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
          path="/projects/:projectId/reports/cycle-time"
          element={
            <Layout>
              <CycleTimeReport />
            </Layout>
          }
        />
        <Route
          path="/projects/:projectId/repository"
          element={
            <Layout>
              <Repository />
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
        {/* Redirect to projects list for any unmatched routes */}
        <Route path="*" element={<Navigate to="/projects" replace />} />
        </Route>
      </Routes>
  )
}
