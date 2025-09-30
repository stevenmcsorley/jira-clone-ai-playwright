import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:4000'

// Custom event system for notifying components of real-time updates
export const emitRefreshEvent = (type: string) => {
  window.dispatchEvent(new CustomEvent('jira-refresh', { detail: { type } }))
}

export const useWebSocket = () => {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Create socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected')
    })

    // Issue events
    socket.on('issue:created', (issue: any) => {
      console.log('📢 Issue created:', issue)
      emitRefreshEvent('issues')
      emitRefreshEvent('projects')
    })

    socket.on('issue:updated', (issue: any) => {
      console.log('📢 Issue updated:', issue)
      emitRefreshEvent('issues')
      emitRefreshEvent('projects')
    })

    socket.on('issue:deleted', (data: { id: number }) => {
      console.log('📢 Issue deleted:', data.id)
      emitRefreshEvent('issues')
      emitRefreshEvent('projects')
    })

    // Sprint events
    socket.on('sprint:created', (sprint: any) => {
      console.log('📢 Sprint created:', sprint)
      emitRefreshEvent('sprints')
    })

    socket.on('sprint:updated', (sprint: any) => {
      console.log('📢 Sprint updated:', sprint)
      emitRefreshEvent('sprints')
      emitRefreshEvent('issues')
    })

    socket.on('sprint:started', (sprint: any) => {
      console.log('📢 Sprint started:', sprint)
      emitRefreshEvent('sprints')
      emitRefreshEvent('issues')
    })

    socket.on('sprint:completed', (sprint: any) => {
      console.log('📢 Sprint completed:', sprint)
      emitRefreshEvent('sprints')
      emitRefreshEvent('issues')
    })

    socket.on('sprint:deleted', (data: { id: number }) => {
      console.log('📢 Sprint deleted:', data.id)
      emitRefreshEvent('sprints')
    })

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting WebSocket')
      socket.disconnect()
    }
  }, [])

  return socketRef.current
}