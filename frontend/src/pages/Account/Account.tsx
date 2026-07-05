import { useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export const Account = () => {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [nameSaved, setNameSaved] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleNameSave = async (e: FormEvent) => {
    e.preventDefault()
    setNameError(null)
    setNameSaved(false)
    const response = await fetch(`/api/users/${user!.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    if (!response.ok) {
      setNameError('Could not update your name')
      return
    }
    setNameSaved(true)
    setTimeout(() => window.location.reload(), 600)
  }

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault()
    setPwError(null)
    setPwSaved(false)
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match')
      return
    }
    setSaving(true)
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(Array.isArray(body?.message) ? body.message.join(', ') : body?.message || 'Password change failed')
      }
      setPwSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Password change failed')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="p-6 max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account</h1>
        <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
      </div>

      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your details</h2>
        <form onSubmit={handleNameSave} className="space-y-4">
          {nameError && <p className="text-sm text-red-600">{nameError}</p>}
          {nameSaved && <p className="text-sm text-green-600">Name updated ✓</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required minLength={2} className={inputClass} />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md px-4 py-2 text-sm">
            Save
          </button>
        </form>
      </section>

      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Change password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {pwError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">{pwError}</div>
          )}
          {pwSaved && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-md px-3 py-2">
              Password changed ✓
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} className={inputClass} />
          </div>
          <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-md px-4 py-2 text-sm">
            {saving ? 'Changing…' : 'Change password'}
          </button>
        </form>
      </section>
    </div>
  )
}
