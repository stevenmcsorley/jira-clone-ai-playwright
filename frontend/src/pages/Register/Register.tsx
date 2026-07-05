import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export const Register = () => {
  const { user, registerUser } = useAuth()
  const navigate = useNavigate()
  const [openSignup, setOpenSignup] = useState<boolean | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/auth/config')
      .then(res => (res.ok ? res.json() : { openSignup: false }))
      .then(config => setOpenSignup(Boolean(config?.openSignup)))
      .catch(() => setOpenSignup(false))
  }, [])

  if (user) {
    return <Navigate to="/projects" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await registerUser(name, email, password)
      navigate('/projects', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Ossicone</h1>
          <p className="text-gray-500 mt-2">Create your account</p>
        </div>

        {openSignup === null && (
          <div className="bg-white rounded-lg shadow p-6 text-center text-sm text-gray-500">
            Loading…
          </div>
        )}

        {openSignup === false && (
          <div className="bg-white rounded-lg shadow p-6 text-center space-y-3">
            <p className="text-sm font-medium text-gray-900">Sign-up is invite-only</p>
            <p className="text-sm text-gray-500">
              Ask a workspace admin to send you an invite link.
            </p>
            <Link to="/login" className="inline-block text-sm text-blue-600 hover:text-blue-800">
              Back to sign in
            </Link>
          </div>
        )}

        {openSignup === true && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
                {error}
              </div>
            )}

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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
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
              {submitting ? 'Creating account…' : 'Create account'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
