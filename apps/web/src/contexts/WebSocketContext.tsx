'use client'

/**
 * WebSocket Context
 * Provides real-time execution status and notifications
 */

import React, { createContext, useContext, useEffect, useCallback, useState, useRef } from 'react'
import { getWsBaseUrl } from '@/lib/env'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { useAuthStore } from '@/stores/useAuthStore'
import { useExecutionStore } from '@/stores/useExecutionStore'
import type {
  WSMessage,
  ConnectionState,
  ExecutionPayload,
  LogPayload,
  LatencyMetrics,
} from '@/hooks/useWebSocket'

// Latency threshold (500ms)
const LATENCY_THRESHOLD_MS = 500

// Notification Type
export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  timestamp: Date
  read: boolean
  executionId?: string
  workflowId?: string
}

// WebSocket ContextType
interface WebSocketContextType {
  connectionState: ConnectionState
  isConnected: boolean
  lastMessage: WSMessage | null
  notifications: Notification[]
  unreadCount: number
  connect: () => void
  disconnect: () => void
  subscribe: (executionId: string) => void
  unsubscribe: (executionId: string) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  // Latency Monitor
  latencyMetrics: LatencyMetrics
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

// Custom Hook
export function useWebSocketContext() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider')
  }
  return context
}

// WebSocket Provider Component
export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { tokens, isAuthenticated } = useAuthStore()
  const { handleWSMessage } = useExecutionStore()

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [latencyMetrics, setLatencyMetrics] = useState<LatencyMetrics>({
    totalMessages: 0,
    avgLatencyMs: 0,
    maxLatencyMs: 0,
    lastLatencyMs: 0,
    overThreshold: 0,
  })

  // Cumulative latency for statistics
  const totalLatencyRef = useRef(0)

  const maxReconnectAttempts = 5
  const reconnectInterval = 3000

  // UpdateLatencyMetrics
  const updateLatencyMetrics = useCallback((sentAt?: number) => {
    if (!sentAt) return

    const now = Date.now()
    const latencyMs = now - sentAt

    setLatencyMetrics((prev) => {
      const newTotal = prev.totalMessages + 1
      totalLatencyRef.current += latencyMs

      const newMetrics: LatencyMetrics = {
        totalMessages: newTotal,
        avgLatencyMs: Math.round(totalLatencyRef.current / newTotal),
        maxLatencyMs: Math.max(prev.maxLatencyMs, latencyMs),
        lastLatencyMs: latencyMs,
        overThreshold:
          latencyMs > LATENCY_THRESHOLD_MS ? prev.overThreshold + 1 : prev.overThreshold,
      }

      // Log warning if latency exceeds threshold
      if (latencyMs > LATENCY_THRESHOLD_MS) {
        console.warn(
          `[WebSocket] Message latency exceeded ${LATENCY_THRESHOLD_MS}ms threshold: ${latencyMs}ms`
        )
      }

      return newMetrics
    })
  }, [])

  // Add notification
  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const newNotification: Notification = {
        ...notification,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: new Date(),
        read: false,
      }

      setNotifications((prev) => [newNotification, ...prev].slice(0, 50)) // Keep last 50
    },
    []
  )

  // Process WebSocket Message
  const handleMessage = useCallback(
    (message: WSMessage) => {
      setLastMessage(message)

      // UpdateLatencyMetrics
      updateLatencyMetrics(message.sentAt)

      // to Execution Store Process
      handleWSMessage(message)

      // Generate notifications
      switch (message.type) {
        case 'execution.started': {
          const payload = message.payload as ExecutionPayload
          addNotification({
            type: 'info',
            title: 'Execution Started',
            message: `Workflow execution has started`,
            executionId: payload.executionId,
            workflowId: payload.workflowId,
          })
          break
        }

        case 'execution.completed': {
          const payload = message.payload as ExecutionPayload
          addNotification({
            type: 'success',
            title: 'Execution Completed',
            message: `Workflow executed successfully, duration: ${payload.durationMs}ms`,
            executionId: payload.executionId,
            workflowId: payload.workflowId,
          })
          break
        }

        case 'execution.failed': {
          const payload = message.payload as ExecutionPayload
          addNotification({
            type: 'error',
            title: 'Failed to Execute',
            message: payload.error || 'Failed to execute workflow',
            executionId: payload.executionId,
            workflowId: payload.workflowId,
          })
          break
        }

        case 'execution.cancelled': {
          const payload = message.payload as ExecutionPayload
          addNotification({
            type: 'warning',
            title: 'Execution Cancelled',
            message: 'Workflow execution was cancelled',
            executionId: payload.executionId,
            workflowId: payload.workflowId,
          })
          break
        }
      }
    },
    [handleWSMessage, addNotification, updateLatencyMetrics]
  )

  // Fetch WebSocket URL
  const getWsUrl = useCallback(() => {
    const baseUrl =
      getWsBaseUrl() ||
      (typeof window !== 'undefined'
        ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
        : 'ws://localhost:8080/ws')
    const token = tokens?.accessToken
    return token ? `${baseUrl}?token=${token}` : baseUrl
  }, [tokens?.accessToken])

  // Connect WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    if (!tokens?.accessToken) {
      console.warn('[WebSocket] No access token available, skipping connection')
      return
    }

    // Check if local mode is enabled (backend service may not be required)
    const isLocalMode = isFeatureEnabled('local_mode')
    if (isLocalMode && process.env.NODE_ENV === 'development') {
      console.info('[WebSocket] Local mode enabled, WebSocket connection is optional')
    }

    try {
      setConnectionState('connecting')
      const wsUrl = getWsUrl()
      if (process.env.NODE_ENV === 'development') {
        console.info(`[WebSocket] Connecting: ${wsUrl.replace(/token=.*/, 'token=***')}`)
      }
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.info('[WebSocket] Connected successfully')
        setConnectionState('connected')
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage
          handleMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onerror = () => {
        // WebSocket error events don't contain specific error info
        // Connection failure is common in development when the backend is not running
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '[WebSocket] Connection failed - Please ensure the backend service is running (localhost:8080)'
          )
        } else {
          console.error('[WebSocket] Connection error')
        }
        setConnectionState('error')
      }

      ws.onclose = (event) => {
        // Normal close (1000) or server-initiated close (1005) don't need reconnection
        const normalClose = event.code === 1000 || event.code === 1005

        if (normalClose) {
          console.info('[WebSocket] Connection closed normally')
        } else {
          console.warn(`[WebSocket] Connection closed (code: ${event.code})`)
        }
        setConnectionState('disconnected')

        // Auto reconnect (except for normal close)
        if (!normalClose && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current) // exponential backoff
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            console.info(
              `[WebSocket] Reconnecting... (attempt ${reconnectAttemptsRef.current}, delay ${Math.round(delay / 1000)}s)`
            )
            connect()
          }, delay)
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.warn('[WebSocket] Maximum reconnection attempts reached, stopping')
        }
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionState('error')
    }
  }, [getWsUrl, tokens?.accessToken, handleMessage])

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    reconnectAttemptsRef.current = maxReconnectAttempts
    wsRef.current?.close()
    wsRef.current = null
    setConnectionState('disconnected')
  }, [])

  // Send message
  const sendMessage = useCallback((type: string, payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }))
    }
  }, [])

  // Subscribe to execution
  const subscribe = useCallback(
    (executionId: string) => {
      sendMessage('subscribe', { executionId })
    },
    [sendMessage]
  )

  // Unsubscribe
  const unsubscribe = useCallback(
    (executionId: string) => {
      sendMessage('unsubscribe', { executionId })
    },
    [sendMessage]
  )

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    )
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Auto connect
  useEffect(() => {
    if (isAuthenticated && tokens?.accessToken) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [isAuthenticated, tokens?.accessToken, connect, disconnect])

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length

  const value: WebSocketContextType = {
    connectionState,
    isConnected: connectionState === 'connected',
    lastMessage,
    notifications,
    unreadCount,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    latencyMetrics,
  }

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}

export default WebSocketProvider
