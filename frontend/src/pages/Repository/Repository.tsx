import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { GitService, isRepoConnected } from '../../services/api/git.service'
import { formatRelativeTime } from '../../utils/relativeTime'
import type {
  RepoBranch,
  RepoCommit,
  RepoConfig,
  RepoPullRequest,
} from '../../types/domain.types'

type Tab = 'commits' | 'branches' | 'pulls'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'commits', label: 'Commits' },
  { id: 'branches', label: 'Branches' },
  { id: 'pulls', label: 'Pull requests' },
]

export const Repository = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const id = Number(projectId)

  const [config, setConfig] = useState<RepoConfig | null>(null)
  const [configLoading, setConfigLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('commits')

  const [commits, setCommits] = useState<RepoCommit[]>([])
  const [branches, setBranches] = useState<RepoBranch[]>([])
  const [pulls, setPulls] = useState<RepoPullRequest[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load connection status first.
  useEffect(() => {
    let active = true
    setConfigLoading(true)
    GitService.getConfig(id)
      .then(result => {
        if (!active) return
        setConfig(isRepoConnected(result) ? result : null)
      })
      .catch(() => active && setConfig(null))
      .finally(() => active && setConfigLoading(false))
    return () => {
      active = false
    }
  }, [id])

  const loadTab = useCallback(
    async (which: Tab) => {
      setLoading(true)
      setError(null)
      try {
        if (which === 'commits') setCommits(await GitService.getCommits(id))
        else if (which === 'branches') setBranches(await GitService.getBranches(id))
        else setPulls(await GitService.getPulls(id))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load repository data')
      } finally {
        setLoading(false)
      }
    },
    [id],
  )

  useEffect(() => {
    if (config) void loadTab(tab)
  }, [config, tab, loadTab])

  if (configLoading) {
    return (
      <div className="flex-1 bg-gray-50 px-6 py-6">
        <div className="animate-pulse text-gray-500">Loading repository…</div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex-1 bg-gray-50 px-6 py-6">
        <div className="max-w-lg mx-auto mt-12 bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-4xl mb-3">🔗</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            No repository connected
          </h2>
          <p className="text-sm text-gray-600 mb-5">
            Link a Git repository to this project to see commits, branches and pull
            requests here.
          </p>
          <Link
            to={`/projects/${projectId}/settings`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            Connect a repository
          </Link>
        </div>
      </div>
    )
  }

  const repoUrl = `https://github.com/${config.owner}/${config.repo}`

  return (
    <div className="flex-1 bg-gray-50 px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Repository</h1>
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            {config.owner}/{config.repo} ↗
          </a>
        </div>
        <Link
          to={`/projects/${projectId}/settings`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Repository settings
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex gap-6">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Body */}
      {loading && <div className="text-sm text-gray-500 py-8">Loading…</div>}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {tab === 'commits' && <CommitsList commits={commits} />}
          {tab === 'branches' && <BranchesList branches={branches} />}
          {tab === 'pulls' && <PullsList pulls={pulls} />}
        </div>
      )}
    </div>
  )
}

const EmptyRow = ({ label }: { label: string }) => (
  <div className="px-4 py-10 text-center text-sm text-gray-500">{label}</div>
)

const CommitsList = ({ commits }: { commits: RepoCommit[] }) => {
  if (commits.length === 0) return <EmptyRow label="No commits found" />
  return (
    <>
      {commits.map(c => (
        <div key={c.sha} className="flex items-center gap-3 px-4 py-3">
          {c.authorAvatar ? (
            <img
              src={c.authorAvatar}
              alt={c.author}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 flex-shrink-0">
              {c.author.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block"
            >
              {c.message}
            </a>
            <div className="text-xs text-gray-500">
              {c.author}
              {c.date && <> · {formatRelativeTime(c.date)}</>}
            </div>
          </div>
          <a
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-gray-500 hover:text-blue-600 flex-shrink-0"
          >
            {c.shortSha}
          </a>
        </div>
      ))}
    </>
  )
}

const BranchesList = ({ branches }: { branches: RepoBranch[] }) => {
  if (branches.length === 0) return <EmptyRow label="No branches found" />
  return (
    <>
      {branches.map(b => (
        <div key={b.name} className="flex items-center gap-2 px-4 py-3">
          <span className="text-gray-400" aria-hidden="true">
            ⑂
          </span>
          <span className="text-sm font-mono text-gray-900">{b.name}</span>
          {b.protected && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              protected
            </span>
          )}
        </div>
      ))}
    </>
  )
}

const stateBadge = (state: string): string => {
  switch (state.toLowerCase()) {
    case 'open':
      return 'bg-green-100 text-green-700'
    case 'closed':
      return 'bg-red-100 text-red-700'
    case 'merged':
      return 'bg-purple-100 text-purple-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const PullsList = ({ pulls }: { pulls: RepoPullRequest[] }) => {
  if (pulls.length === 0) return <EmptyRow label="No pull requests found" />
  return (
    <>
      {pulls.map(p => (
        <div key={p.number} className="flex items-center gap-3 px-4 py-3">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${stateBadge(
              p.state,
            )}`}
          >
            {p.state}
          </span>
          <div className="min-w-0 flex-1">
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block"
            >
              #{p.number} {p.title}
            </a>
            <div className="text-xs text-gray-500">
              {p.author}
              {p.branch && <> · {p.branch}</>}
              {p.createdAt && <> · {formatRelativeTime(p.createdAt)}</>}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
