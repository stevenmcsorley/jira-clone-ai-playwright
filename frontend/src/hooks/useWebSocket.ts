import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { getToken, getWorkspaceId } from '../lib/auth'

// Dev: VITE_WS_URL points at the exposed backend port.
// Prod: same origin — nginx proxies /socket.io to the backend.
const SOCKET_URL = import.meta.env.VITE_WS_URL || window.location.origin

// Custom event system for notifying components of real-time updates
export const emitRefreshEvent = (type: string) => {
  window.dispatchEvent(new CustomEvent('ossicone-refresh', { detail: { type } }))
}

/**
 * Module-level singleton: one socket for the whole app, surviving component
 * remounts, route changes and backend restarts (infinite reconnection —
 * a redeploy must not permanently kill realtime updates).
 */
let socket: Socket | null = null

const joinWorkspaceRoom = () => {
  const workspaceId = getWorkspaceId()
  if (socket?.connected && workspaceId) {
    socket.emit('join', { token: getToken(), workspaceId: Number(workspaceId) })
  }
}

const getSocket = (): Socket => {
  if (socket) return socket

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: Infinity,
  })

  socket.on('connect', () => {
    console.log('✅ WebSocket connected:', socket!.id)
    // (Re)join on every connect; on first login the workspace id may not be
    // resolved yet — the 'ossicone-workspace-changed' listener covers that.
    joinWorkspaceRoom()
  })

  window.addEventListener('ossicone-workspace-changed', joinWorkspaceRoom)

  socket.on('disconnect', () => {
    console.log('❌ WebSocket disconnected')
  })

  // Issue events
  socket.on('issue:created', () => {
    emitRefreshEvent('issues')
    emitRefreshEvent('projects')
  })

  socket.on('issue:updated', () => {
    emitRefreshEvent('issues')
    emitRefreshEvent('projects')
  })

  socket.on('issue:deleted', () => {
    emitRefreshEvent('issues')
    emitRefreshEvent('projects')
  })

  // Sprint events
  socket.on('sprint:created', () => emitRefreshEvent('sprints'))
  socket.on('sprint:updated', () => {
    emitRefreshEvent('sprints')
    emitRefreshEvent('issues')
  })
  socket.on('sprint:started', () => {
    emitRefreshEvent('sprints')
    emitRefreshEvent('issues')
  })
  socket.on('sprint:completed', () => {
    emitRefreshEvent('sprints')
    emitRefreshEvent('issues')
  })
  socket.on('sprint:deleted', () => emitRefreshEvent('sprints'))

  // Notifications → window event; useNotifications filters by recipient
  socket.on('notification:new', (notification: unknown) => {
    window.dispatchEvent(new CustomEvent('ossicone-notification', { detail: notification }))
  })

  return socket
}

export const useWebSocket = () => {
  useEffect(() => {
    // Ensure the singleton exists; never disconnect on unmount — the socket
    // outlives any one component (StrictMode double-mounts included).
    getSocket()
  }, [])

  return socket
}
