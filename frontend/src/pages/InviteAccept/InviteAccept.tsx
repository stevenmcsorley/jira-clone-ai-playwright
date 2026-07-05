import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { setToken, clearWorkspaceId } from '../../lib/auth'

interface InviteInfo {
  workspaceName: string
  email: string
  role: string
  accountExists: boolean
}

export const InviteAccept = () => {
  const { token } = useParams<{ token: string }>()
  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setLoadError('This invite link is invalid.')
      setLoading(false)
      return
    }
    fetch(`/api/invites/${token}`)
      .then(async res => {
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(body?.message || 'This invite is invalid, expired or already used.')
        }
        return res.json()
      })
      .then((info: InviteInfo) => setInvite(info))
      .catch(err =>
        setLoadError(err instanceof Error ? err.message : 'This invite is invalid, expired or already used.')
      )
      .finally(() => setLoading(false))
  }, [token])

  const accept = async (body: Record<string, string>) => {
    setError(null)
    setSubmitting(true)
    try {
      const response = await fetch(`/api/invites/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const resBody = await response.json().catch(() => null)
        const message = Array.isArray(resBody?.message) ? resBody.message.join(', ') : resBody?.message
        throw new Error(message || 'This invite is invalid, expired or already used.')
      }
      const { token: sessionToken } = await response.json()
      setToken(sessionToken)
      // Let AuthContext resolve the current workspace on the fresh load.
      clearWorkspaceId()
      window.location.assign('/projects')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite')
      setSubmitting(false)
    }
  }

  const handleNewAccountSubmit = (e: FormEvent) => {
    e.preventDefault()
    void accept({ name, password })
  }

  return (
    <div className="min-h-screen bg-[url('/app-bg.jpg')] bg-cover bg-center flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Ossicone</h1>
          <p className="text-gray-500 mt-2">Workspace invitation</p>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow p-6 text-center text-sm text-gray-500">
            Loading invite…
          </div>
        )}

        {!loading && loadError && (
          <div className="bg-white rounded-lg shadow p-6 text-center space-y-3">
            <p className="text-sm font-medium text-red-600">{loadError}</p>
            <p className="text-sm text-gray-500">
              Ask a workspace admin to send you a new invite.
            </p>
            <Link to="/login" className="inline-block text-sm text-blue-600 hover:text-blue-800">
              Back to sign in
            </Link>
          </div>
        )}

        {!loading && invite && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <p className="text-sm text-gray-700">
              You&apos;ve been invited to{' '}
              <span className="font-semibold text-gray-900">{invite.workspaceName}</span> as{' '}
              <span className="font-semibold text-gray-900">{invite.role}</span>
            </p>
            <p className="text-xs text-gray-500">Invitation for {invite.email}</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
                {error}
              </div>
            )}

            {invite.accountExists ? (
              <button
                onClick={() => void accept({})}
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-md px-4 py-2 text-sm"
              >
                {submitting ? 'Joining…' : 'Join workspace'}
              </button>
            ) : (
              <form onSubmit={handleNewAccountSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-md px-4 py-2 text-sm"
                >
                  {submitting ? 'Joining…' : 'Create account & join'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
