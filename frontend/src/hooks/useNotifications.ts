import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export interface NotificationActor {
  id: number
  name: string
}

export interface NotificationIssueRef {
  id: number
  title: string
  projectId: number
}

export interface AppNotification {
  id: number
  type: 'assigned' | 'commented'
  message: string
  read: boolean
  createdAt: string
  actor: NotificationActor
  issue: NotificationIssueRef
  /** Recipient user id — present on socket payloads so clients can filter. */
  userId?: number
}

interface NotificationsResponse {
  notifications: AppNotification[]
  unreadCount: number
}

const POLL_INTERVAL_MS = 60_000

/**
 * Notifications state: fetched on mount, refreshed every 60s, and updated in
 * real time via the 'ossicone-notification' window event (dispatched by
 * useWebSocket when the workspace socket receives 'notification:new').
 */
export const useNotifications = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications')
      if (!response.ok) return // Endpoint may not exist yet — keep fallback state
      const data: NotificationsResponse = await response.json()
      setNotifications(Array.isArray(data.notifications) ? data.notifications : [])
      setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0)
    } catch {
      // Network failure — keep current state
    }
  }, [])

  // Initial fetch + 60s polling
  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [refresh])

  // Real-time: prepend notifications addressed to the current user
  useEffect(() => {
    const handleIncoming = (event: Event) => {
      const detail = (event as CustomEvent).detail as AppNotification | undefined
      if (!detail || !user || detail.userId !== user.id) return

      setNotifications(prev => {
        if (prev.some(n => n.id === detail.id)) return prev
        return [detail, ...prev]
      })
      if (!detail.read) {
        setUnreadCount(prev => prev + 1)
      }
    }

    window.addEventListener('ossicone-notification', handleIncoming)
    return () => window.removeEventListener('ossicone-notification', handleIncoming)
  }, [user])

  const markRead = useCallback(async (id: number) => {
    let wasUnread = false
    setNotifications(prev =>
      prev.map(n => {
        if (n.id === id && !n.read) {
          wasUnread = true
          return { ...n, read: true }
        }
        return n
      })
    )
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }

    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    } catch {
      // Optimistic update stands; next refresh reconciles
    }
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => (n.read ? n : { ...n, read: true })))
    setUnreadCount(0)

    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
    } catch {
      // Optimistic update stands; next refresh reconciles
    }
  }, [])

  return { notifications, unreadCount, markRead, markAllRead, refresh }
}
