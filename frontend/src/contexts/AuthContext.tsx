import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Workspace } from '../types/domain.types'
import { getToken, setToken, clearToken, getWorkspaceId, setWorkspaceId, clearWorkspaceId } from '../lib/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  login: (email: string, password: string) => Promise<void>
  registerUser: (name: string, email: string, password: string, workspaceName?: string) => Promise<void>
  logout: () => void
  switchWorkspace: (id: number) => void
  refreshWorkspaces: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)

  const loadWorkspaces = async (): Promise<void> => {
    try {
      const response = await fetch('/api/workspaces')
      if (!response.ok) return
      const list: Workspace[] = await response.json()
      const storedId = getWorkspaceId()
      const current = list.find(w => String(w.id) === storedId) ?? list[0] ?? null
      if (current) {
        setWorkspaceId(current.id)
      } else {
        clearWorkspaceId()
      }
      setWorkspaces(list)
      setCurrentWorkspace(current)
    } catch {
      // Leave workspace state untouched on network failure.
    }
  }

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    fetch('/api/auth/me')
      .then(res => (res.ok ? res.json() : null))
      .then(async me => {
        setUser(me)
        if (me) await loadWorkspaces()
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.message || 'Invalid email or password')
    }
    const { token, user: loggedInUser } = await response.json()
    setToken(token)
    setUser(loggedInUser)
    await loadWorkspaces()
  }

  const registerUser = async (name: string, email: string, password: string, workspaceName?: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, workspaceName }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message
      throw new Error(message || 'Registration failed')
    }
    const { token, user: newUser } = await response.json()
    setToken(token)
    setUser(newUser)
    await loadWorkspaces()
  }

  const logout = () => {
    clearToken()
    setUser(null)
    window.location.href = '/login'
  }

  const switchWorkspace = (id: number) => {
    setWorkspaceId(id)
    // Full reload is the simple correct way to refetch everything for the new workspace.
    window.location.assign('/projects')
  }

  const refreshWorkspaces = async () => {
    await loadWorkspaces()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        workspaces,
        currentWorkspace,
        login,
        registerUser,
        logout,
        switchWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
