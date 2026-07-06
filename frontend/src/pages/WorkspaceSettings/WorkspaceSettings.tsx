import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { clearWorkspaceId } from '../../lib/auth'
import type { WorkspaceRole } from '../../types/domain.types'
import {
  WORKSPACE_ICONS,
  WorkspaceIcon,
  resizeImageToIcon,
  ICON_IMAGE_TARGET_PX,
} from '../../lib/workspaceIcons'

interface WorkspaceMember {
  id: number
  role: WorkspaceRole
  user: {
    id: number
    name: string
    email: string
    avatar?: string
  }
  joinedAt: string
}

interface WorkspaceInvite {
  id: number
  email: string
  role: 'admin' | 'member'
  token: string
  expiresAt: string
  accepted: boolean
  createdAt: string
}

export const WorkspaceSettings = () => {
  const { user, workspaces, currentWorkspace, refreshWorkspaces, switchWorkspace } = useAuth()
  const myRole = currentWorkspace?.role
  const ownsAWorkspace = workspaces.some(w => w.role === 'owner')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const canManage = myRole === 'owner' || myRole === 'admin'
  const isOwner = myRole === 'owner'

  // Rename + icon
  const [renameValue, setRenameValue] = useState('')
  const [iconValue, setIconValue] = useState('')
  const [iconImageValue, setIconImageValue] = useState('')
  const [iconError, setIconError] = useState<string | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)
  const iconFileRef = useRef<HTMLInputElement>(null)

  // Members
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [memberError, setMemberError] = useState<string | null>(null)

  // Invites
  const [invites, setInvites] = useState<WorkspaceInvite[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // New workspace
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    setRenameValue(currentWorkspace?.name ?? '')
    setIconValue(currentWorkspace?.icon ?? '')
    setIconImageValue(currentWorkspace?.iconImage ?? '')
  }, [currentWorkspace])

  const detailsDirty =
    renameValue.trim() !== (currentWorkspace?.name ?? '') ||
    (iconValue || '') !== (currentWorkspace?.icon ?? '') ||
    (iconImageValue || '') !== (currentWorkspace?.iconImage ?? '')

  const chooseIcon = (id: string) => {
    setIconError(null)
    setIconValue(id)
    setIconImageValue('')
  }

  const clearIcon = () => {
    setIconError(null)
    setIconValue('')
    setIconImageValue('')
  }

  const handleIconImage = async (file: File | undefined) => {
    if (!file) return
    setIconError(null)
    try {
      const dataUrl = await resizeImageToIcon(file)
      setIconImageValue(dataUrl)
      setIconValue('')
    } catch (err) {
      setIconError(err instanceof Error ? err.message : 'Could not use that image')
    } finally {
      if (iconFileRef.current) iconFileRef.current.value = ''
    }
  }

  const loadMembers = () => {
    fetch('/api/workspaces/current/members')
      .then(res => (res.ok ? res.json() : []))
      .then(setMembers)
      .catch(() => setMembers([]))
  }

  const loadInvites = () => {
    fetch('/api/workspaces/current/invites')
      .then(res => (res.ok ? res.json() : []))
      .then((list: WorkspaceInvite[]) => setInvites(list.filter(i => !i.accepted)))
      .catch(() => setInvites([]))
  }

  useEffect(() => {
    loadMembers()
  }, [])

  useEffect(() => {
    if (canManage) loadInvites()
  }, [canManage])

  const readError = async (response: Response, fallback: string): Promise<string> => {
    const body = await response.json().catch(() => null)
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message
    return message || fallback
  }

  const handleRename = async (e: FormEvent) => {
    e.preventDefault()
    setRenameError(null)
    setRenaming(true)
    try {
      const response = await fetch('/api/workspaces/current', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: renameValue.trim(),
          icon: iconValue,
          iconImage: iconImageValue,
        }),
      })
      if (!response.ok) throw new Error(await readError(response, 'Failed to save workspace'))
      await refreshWorkspaces()
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : 'Failed to rename workspace')
    } finally {
      setRenaming(false)
    }
  }

  const handleRoleChange = async (memberId: number, role: WorkspaceRole) => {
    setMemberError(null)
    try {
      const response = await fetch(`/api/workspaces/current/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!response.ok) throw new Error(await readError(response, 'Failed to update role'))
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      loadMembers()
    }
  }

  const handleRemoveMember = async (member: WorkspaceMember) => {
    if (!window.confirm(`Remove ${member.user.name} from this workspace?`)) return
    setMemberError(null)
    try {
      const response = await fetch(`/api/workspaces/current/members/${member.id}`, {
        method: 'DELETE',
      })
      if (!response.ok && response.status !== 204) {
        throw new Error(await readError(response, 'Failed to remove member'))
      }
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      loadMembers()
    }
  }

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault()
    setInviteError(null)
    setInviting(true)
    setInviteLink(null)
    try {
      const response = await fetch('/api/workspaces/current/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      if (!response.ok) throw new Error(await readError(response, 'Failed to create invite'))
      const invite: WorkspaceInvite = await response.json()
      setInviteLink(`${window.location.origin}/invite/${invite.token}`)
      setInviteEmail('')
      loadInvites()
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to create invite')
    } finally {
      setInviting(false)
    }
  }

  const handleRevokeInvite = async (inviteId: number) => {
    if (!window.confirm('Revoke this invite? The link will stop working.')) return
    await fetch(`/api/workspaces/current/invites/${inviteId}`, { method: 'DELETE' })
    loadInvites()
  }

  const copyInviteLink = async () => {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCreateWorkspace = async (e: FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    setCreating(true)
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkspaceName.trim() }),
      })
      if (!response.ok) throw new Error(await readError(response, 'Failed to create workspace'))
      const workspace = await response.json()
      switchWorkspace(workspace.id)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create workspace')
      setCreating(false)
    }
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header / rename */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {currentWorkspace?.name ?? 'Workspace'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Workspace settings{myRole ? ` — your role: ${myRole}` : ''}
        </p>

        {canManage && (
          <form onSubmit={handleRename} className="mt-4 space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Name</label>
              <input
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                required
                placeholder="Workspace name"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Icon</label>
              <div className="flex items-start gap-4">
                <WorkspaceIcon
                  name={renameValue}
                  icon={iconValue}
                  iconImage={iconImageValue}
                  className="w-14 h-14"
                  textClassName="text-lg"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1.5">
                    {WORKSPACE_ICONS.map(def => (
                      <button
                        key={def.id}
                        type="button"
                        onClick={() => chooseIcon(def.id)}
                        className={`w-9 h-9 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 ${
                          iconValue === def.id ? 'ring-2 ring-blue-500 bg-blue-50 text-blue-700' : 'border border-gray-200'
                        }`}
                        title={def.label}
                        aria-label={`Use the ${def.label} icon`}
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                          <path d={def.path} />
                        </svg>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <input
                      ref={iconFileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={e => handleIconImage(e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      onClick={() => iconFileRef.current?.click()}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Upload custom image
                    </button>
                    {(iconValue || iconImageValue) && (
                      <button
                        type="button"
                        onClick={clearIcon}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Monochrome icons, or a custom PNG/JPG/WebP up to 3MB — cropped square and
                    resized to {ICON_IMAGE_TARGET_PX}px. Falls back to initials when empty.
                  </p>
                  {iconError && <p className="mt-1 text-xs text-red-600">{iconError}</p>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={renaming || !detailsDirty || renameValue.trim().length < 2}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-md px-4 py-2 text-sm"
              >
                {renaming ? 'Saving…' : 'Save changes'}
              </button>
              {renameError && <span className="text-sm text-red-600">{renameError}</span>}
            </div>
          </form>
        )}
      </div>

      {/* Members */}
      <section className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Members</h2>
          {memberError && <p className="text-sm text-red-600 mt-1">{memberError}</p>}
        </div>
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              {canManage && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {members.map(member => {
              const isSelf = member.user.id === user?.id
              return (
                <tr key={member.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {member.user.name}
                    {isSelf && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{member.user.email}</td>
                  <td className="px-4 py-3 text-sm">
                    {canManage && !isSelf ? (
                      <select
                        value={member.role}
                        onChange={e => handleRoleChange(member.id, e.target.value as WorkspaceRole)}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="owner" disabled={!isOwner}>Owner</option>
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        member.role === 'owner'
                          ? 'bg-amber-100 text-amber-700'
                          : member.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {member.role}
                      </span>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      {!isSelf && member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </section>

      {/* Invites */}
      {canManage && (
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite people</h2>
          <form onSubmit={handleInvite} className="flex flex-wrap items-center gap-3">
            <input
              type="email"
              required
              placeholder="Email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as 'admin' | 'member')}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-md px-4 py-2 text-sm"
            >
              {inviting ? 'Inviting…' : 'Create invite'}
            </button>
          </form>

          {inviteError && <p className="text-sm text-red-600 mt-3">{inviteError}</p>}

          {inviteLink && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md p-4">
              <p className="text-sm font-medium text-amber-800 mb-2">
                Invite created — share this link:
              </p>
              <div className="flex items-center gap-2">
                <code className="bg-white border border-amber-200 rounded px-3 py-2 text-xs break-all flex-1">
                  {inviteLink}
                </code>
                <button
                  onClick={copyInviteLink}
                  className="text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap"
                >
                  {copied ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {invites.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Pending invites</h3>
              <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {invites.map(invite => (
                    <tr key={invite.id}>
                      <td className="py-2 pr-4 font-medium text-gray-900">{invite.email}</td>
                      <td className="py-2 pr-4 text-gray-500">{invite.role}</td>
                      <td className="py-2 pr-4 text-gray-500">
                        expires {new Date(invite.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => handleRevokeInvite(invite.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* New workspace — one per account, so only shown to people who don't own one yet */}
      {ownsAWorkspace ? (
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">New workspace</h2>
          <p className="text-sm text-gray-600">
            Each account can own one workspace. To run a separate workspace, sign up with a
            different email address, or ask its owner to invite you into theirs.
          </p>
        </section>
      ) : (
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">New workspace</h2>
          <p className="text-sm text-gray-600 mb-4">
            Create a workspace with its own projects and members. You&apos;ll be switched to it.
          </p>
          <form onSubmit={handleCreateWorkspace} className="flex items-center gap-3">
            <input
              required
              placeholder="Workspace name"
              value={newWorkspaceName}
              onChange={e => setNewWorkspaceName(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-md px-4 py-2 text-sm"
            >
              {creating ? 'Creating…' : 'Create workspace'}
            </button>
          </form>
          {createError && <p className="text-sm text-red-600 mt-3">{createError}</p>}
        </section>
      )}

      {/* Danger zone */}
      {isOwner && (
        <section className="bg-white rounded-lg shadow p-6 border border-red-200">
          <h2 className="text-lg font-semibold text-red-700 mb-1">Danger zone</h2>
          <p className="text-sm text-gray-600 mb-4">
            Deleting this workspace permanently removes all of its projects, issues, sprints and history.
            Type <span className="font-mono font-medium">{currentWorkspace?.name}</span> to confirm.
          </p>
          <div className="flex items-center gap-3">
            <input
              placeholder="Workspace name"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-64"
            />
            <button
              disabled={deleting || deleteConfirm !== currentWorkspace?.name}
              onClick={async () => {
                setDeleting(true)
                setDeleteError(null)
                try {
                  const response = await fetch('/api/workspaces/current', { method: 'DELETE' })
                  if (!response.ok) throw new Error('Delete failed')
                  clearWorkspaceId()
                  window.location.assign('/projects')
                } catch (err) {
                  setDeleteError(err instanceof Error ? err.message : 'Delete failed')
                  setDeleting(false)
                }
              }}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-medium rounded-md px-4 py-2 text-sm"
            >
              {deleting ? 'Deleting…' : 'Delete workspace'}
            </button>
          </div>
          {deleteError && <p className="text-sm text-red-600 mt-3">{deleteError}</p>}
        </section>
      )}
    </div>
  )
}
