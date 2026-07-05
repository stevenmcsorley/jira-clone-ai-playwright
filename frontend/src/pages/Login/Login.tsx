import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export const Login = () => {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [openSignup, setOpenSignup] = useState(false)

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
      await login(email, password)
      navigate('/projects', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[url('/app-bg.jpg')] bg-cover bg-center flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Ossicone" className="w-16 h-16 mx-auto mb-3 rounded-2xl shadow-md" />
          <h1 className="text-3xl font-bold text-blue-600">Ossicone</h1>
          <p className="text-gray-600 mt-2">Sign in to your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur rounded-lg shadow-xl p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
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
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          {openSignup && (
            <p className="text-center text-sm text-gray-500">
              New here?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-800">
                Create an account
              </Link>
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
