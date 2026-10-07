import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const OAuthConsent = () => {
  const { user, loading, workspaces, currentWorkspace } = useAuth()
  const request = new URLSearchParams(window.location.search).get('request') || ''
  const [details, setDetails] = useState<{ clientName: string; redirectHost: string } | null>(null)
  const [workspaceId, setWorkspaceId] = useState<number | null>(null)
  const [access, setAccess] = useState('write')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!user) return
    fetch(`/api/oauth/request?request=${encodeURIComponent(request)}`)
      .then(async response => {
        if (!response.ok) throw new Error('This connection request expired or is invalid. Start again from your MCP client.')
        return response.json()
      }).then(setDetails).catch(err => setError(err.message))
  }, [user, request])
  const selectedWorkspace = workspaceId ?? currentWorkspace?.id ?? workspaces[0]?.id
  const decide = async (decision: 'allow' | 'deny') => {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/oauth/consent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request, decision, workspaceId: selectedWorkspace, access }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || result.error || 'Connection failed')
      window.location.assign(result.redirect)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
      setBusy(false)
    }
  }
  if (loading) return <p className="p-8">Loading your account…</p>
  if (!user) return <Navigate replace to={`/login?returnTo=${encodeURIComponent(`/oauth/consent?request=${request}`)}`} />
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <section className="bg-white rounded-lg shadow p-6 max-w-lg w-full space-y-5">
        <h1 className="text-2xl font-bold">Connect to Ossicone</h1>
        {details && <p>Allow <strong>{details.clientName}</strong> ({details.redirectHost}) to access Ossicone as {user.email}?</p>}
        <p className="text-sm text-gray-600">Choose the workspace this connection can use. Your account’s permissions apply. This grants no account administrator access.</p>
        <label className="block">Workspace
          <select className="block w-full border rounded p-2 mt-1" value={selectedWorkspace ?? ''} onChange={e => setWorkspaceId(Number(e.target.value))}>
            {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </label>
        <label className="block">Access
          <select className="block w-full border rounded p-2 mt-1" value={access} onChange={e => setAccess(e.target.value)}>
            <option value="write">Read and write — manage projects, issues, sprints and wiki pages</option>
            <option value="read">Read-only — view work without changing it</option>
          </select>
        </label>
        <p className="text-sm text-gray-600">The connection renews for up to 30 days. You can revoke it from AI Agent access.</p>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <div className="flex gap-3">
          <button disabled={busy || !details || !selectedWorkspace} onClick={() => decide('allow')} className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50">{busy ? 'Connecting…' : 'Allow access'}</button>
          <button disabled={busy || !details} onClick={() => decide('deny')} className="border rounded px-4 py-2">Cancel</button>
        </div>
      </section>
    </main>
  )
}
