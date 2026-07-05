import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications, type AppNotification } from '../../hooks/useNotifications'
import { formatRelativeTime } from '../../utils/relativeTime'

/**
 * Bell icon with unread badge and a notification dropdown.
 * Designed to sit in the top header next to QuickActions / the avatar menu.
 * NOTE: intentionally not wired into Layout — mounted by the layout integration task.
 */
export const NotificationBell = () => {
  const navigate = useNavigate()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.read) {
      markRead(notification.id)
    }
    setOpen(false)
    navigate(`/projects/${notification.issue.projectId}/issues/${notification.issue.id}`)
  }

  return (
    <div className="relative" ref={containerRef} data-testid="notification-bell">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        data-testid="notification-bell-button"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            data-testid="notification-unread-badge"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
          data-testid="notification-dropdown"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                data-testid="notification-mark-all-read"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500 text-center">
                No notifications
              </p>
            ) : (
              notifications.map(notification => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex w-full items-start gap-2 px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0 ${
                    notification.read ? '' : 'bg-blue-50/50'
                  }`}
                  data-testid={`notification-item-${notification.id}`}
                >
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      notification.read ? 'bg-transparent' : 'bg-blue-500'
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-gray-700">
                      <span className="font-medium text-gray-900">
                        {notification.actor.name}
                      </span>{' '}
                      {notification.message}
                    </span>
                    <span className="block text-xs text-gray-400 mt-0.5">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
