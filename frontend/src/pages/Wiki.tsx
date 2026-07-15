import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { WikiService } from '../services/api/wiki.service'
import { Markdown } from '../components/Markdown/Markdown'
import type { WikiPage, WikiPageSummary } from '../types/domain.types'

export const Wiki = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const pid = Number(projectId)

  const [pages, setPages] = useState<WikiPageSummary[]>([])
  const [active, setActive] = useState<WikiPage | null>(null)
  const [mode, setMode] = useState<'view' | 'edit' | 'new'>('view')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadPages = useCallback(async () => {
    if (!pid) return
    try {
      const list = await WikiService.list(pid)
      setPages(list)
      return list
    } finally {
      setLoading(false)
    }
  }, [pid])

  useEffect(() => {
    loadPages().then((list) => {
      if (list && list.length && !active) openPage(list[0].id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid])

  const openPage = async (id: number) => {
    const page = await WikiService.getPage(pid, id)
    setActive(page)
    setMode('view')
  }

  const startNew = () => {
    setActive(null)
    setDraftTitle('')
    setDraftContent('')
    setMode('new')
  }

  const startEdit = () => {
    if (!active) return
    setDraftTitle(active.title)
    setDraftContent(active.content)
    setMode('edit')
  }

  const save = async () => {
    if (!draftTitle.trim()) return
    setSaving(true)
    try {
      if (mode === 'new') {
        const created = await WikiService.create(pid, { title: draftTitle.trim(), content: draftContent })
        await loadPages()
        setActive(created)
      } else if (active) {
        const updated = await WikiService.update(pid, active.id, {
          title: draftTitle.trim(),
          content: draftContent,
        })
        await loadPages()
        setActive(updated)
      }
      setMode('view')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!active) return
    if (!window.confirm(`Delete "${active.title}"?`)) return
    await WikiService.remove(pid, active.id)
    const list = await loadPages()
    setActive(null)
    if (list && list.length) openPage(list[0].id)
    else setMode('view')
  }

  return (
    <div className="flex h-full" data-testid="wiki-page">
      {/* Page list */}
      <aside className="w-64 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Wiki</h2>
          <button
            onClick={startNew}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
            data-testid="wiki-new"
          >
            + New
          </button>
        </div>
        {loading ? (
          <div className="px-4 py-6 text-sm text-gray-400">Loading…</div>
        ) : pages.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-400">No pages yet.</div>
        ) : (
          <ul className="py-1">
            {pages.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => openPage(p.id)}
                  className={`w-full text-left px-4 py-2 text-sm truncate hover:bg-gray-50 ${
                    active?.id === p.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  {p.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {mode === 'view' && active && (
          <div className="max-w-3xl mx-auto px-8 py-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{active.title}</h1>
                <p className="text-xs text-gray-400 mt-1">
                  Updated {new Date(active.updatedAt).toLocaleString()} · /{active.slug}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={startEdit} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">Edit</button>
                <button onClick={remove} className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50">Delete</button>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              {active.content.trim()
                ? <Markdown>{active.content}</Markdown>
                : <p className="text-sm text-gray-400 italic">This page is empty. Click Edit to add content.</p>}
            </div>
          </div>
        )}

        {(mode === 'edit' || mode === 'new') && (
          <div className="max-w-3xl mx-auto px-8 py-8">
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Page title"
              className="w-full text-2xl font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 focus:outline-none focus:border-blue-500"
              data-testid="wiki-title-input"
            />
            <textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              placeholder="Write in Markdown…  # Heading, **bold**, - lists, `code`, tables…"
              className="w-full h-[60vh] font-mono text-sm text-gray-800 bg-white border border-gray-200 rounded-lg p-4 focus:outline-none focus:border-blue-500 resize-none"
              data-testid="wiki-content-input"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={save}
                disabled={saving || !draftTitle.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                data-testid="wiki-save"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => (active ? setMode('view') : setMode('view'))}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {mode === 'view' && !active && !loading && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-400 mb-3">No page selected.</p>
              <button onClick={startNew} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700">Create the first page</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
