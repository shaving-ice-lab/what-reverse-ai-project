/**
 * Sync Status Hook
 * @description React hook for managing data sync status
 */

'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { getApiBaseUrl } from '@/lib/env'
import { getStoredTokens } from '@/lib/api/shared'
import type {
  SyncConfig,
  SyncResult,
  SyncEngineState,
  Conflict,
  ChangeRecord,
  EntityType,
  OperationType,
} from '@/lib/sync'

/**
 * Hook return type
 */
export interface UseSyncStatusReturn {
  /** Sync engine state */
  state: SyncEngineState
  /** Whether syncing is in progress */
  isSyncing: boolean
  /** Whether sync is enabled */
  isEnabled: boolean
  /** Whether online */
  isOnline: boolean
  /** Pending sync count */
  pendingCount: number
  /** Conflict list */
  conflicts: Conflict[]
  /** Last sync result */
  lastSyncResult: SyncResult | null
  /** Last sync time */
  lastSyncAt: Date | null
  /** Trigger sync */
  sync: () => Promise<SyncResult>
  /** Start auto sync */
  startAutoSync: () => void
  /** Stop auto sync */
  stopAutoSync: () => void
  /** Record a change */
  recordChange: <T>(
    entityType: EntityType,
    entityId: string,
    operation: OperationType,
    data: T
  ) => Promise<void>
  /** Resolve a conflict */
  resolveConflict: (index: number, resolution: 'local' | 'cloud') => Promise<void>
  /** Update configuration */
  updateConfig: (config: Partial<SyncConfig>) => void
}

/**
 * Hook configuration options
 */
interface UseSyncStatusOptions {
  /** Whether to auto-start sync */
  autoStart?: boolean
  /** Initial configuration */
  config?: Partial<SyncConfig>
  /** Sync complete callback */
  onSyncComplete?: (result: SyncResult) => void
  /** Conflict callback */
  onConflict?: (conflicts: Conflict[]) => void
  /** Error callback */
  onError?: (error: Error) => void
}

/**
 * Local storage implementation (uses localStorage as simple implementation, can be upgraded to IndexedDB)
 * TODO: Upgrade to IndexedDB to support large data and better offline support
 */
function createLocalStorage() {
  const STORAGE_KEY = 'agentflow_sync_changes'
  const LAST_SYNC_KEY = 'agentflow_last_sync'

  // Get change list from localStorage
  const getStoredChanges = (): ChangeRecord[] => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  // Save change list to localStorage
  const saveStoredChanges = (changes: ChangeRecord[]) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(changes))
    } catch (err) {
      console.error('Failed to save sync changes:', err)
    }
  }

  return {
    async getChanges() {
      return getStoredChanges()
    },
    async getPendingChanges() {
      return getStoredChanges().filter((c) => c.syncStatus === 'pending')
    },
    async saveChange(change: ChangeRecord) {
      const changes = getStoredChanges()
      changes.push(change)
      saveStoredChanges(changes)
    },
    async updateChangeStatus(id: string, status: ChangeRecord['syncStatus']) {
      const changes = getStoredChanges()
      const change = changes.find((c) => c.id === id)
      if (change) {
        change.syncStatus = status
        saveStoredChanges(changes)
      }
    },
    async deleteChange(id: string) {
      const changes = getStoredChanges()
      const index = changes.findIndex((c) => c.id === id)
      if (index !== -1) {
        changes.splice(index, 1)
        saveStoredChanges(changes)
      }
    },
    async getLastSyncTime(): Promise<Date | null> {
      if (typeof window === 'undefined') return null
      try {
        const stored = localStorage.getItem(LAST_SYNC_KEY)
        return stored ? new Date(stored) : null
      } catch {
        return null
      }
    },
    async setLastSyncTime(time: Date) {
      if (typeof window === 'undefined') return
      try {
        localStorage.setItem(LAST_SYNC_KEY, time.toISOString())
      } catch (err) {
        console.error('Failed to save sync time:', err)
      }
    },
    async applyChange(_change: ChangeRecord) {
      // Changes are applied via the normal API calls, no additional action needed here
    },
    async clearAll() {
      if (typeof window === 'undefined') return
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(LAST_SYNC_KEY)
    },
  }
}

/**
 * Cloud API implementation
 * Syncs via existing workflowApi and other interfaces
 */
function createCloudApi() {
  const API_BASE_URL = getApiBaseUrl()

  return {
    async getChangesSince(_since: Date | null): Promise<ChangeRecord[]> {
      // Get cloud changes
      // Current implementation: returns empty array, as main data is fetched via dedicated APIs
      // TODO: Implement sync endpoint
      return []
    },
    async pushChanges(changes: ChangeRecord[]) {
      const token = getStoredTokens()?.accessToken
      if (!token) {
        return {
          successful: [],
          failed: changes.map((c) => c.id),
        }
      }

      const successful: string[] = []
      const failed: string[] = []

      for (const change of changes) {
        try {
          // Call the appropriate API based on entity type and operation type
          const endpoint = getEndpointForChange(change)
          const method = getMethodForOperation(change.operation)

          if (!endpoint) {
            successful.push(change.id) // Changes that don't need syncing are treated as successful
            continue
          }

          const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: method !== 'DELETE' ? JSON.stringify(change.data) : undefined,
          })

          if (response.ok) {
            successful.push(change.id)
          } else {
            failed.push(change.id)
          }
        } catch {
          failed.push(change.id)
        }
      }

      return { successful, failed }
    },
    async isOnline() {
      return typeof navigator !== 'undefined' ? navigator.onLine : true
    },
  }
}

/**
 * Get API endpoint based on change
 */
function getEndpointForChange(change: ChangeRecord): string | null {
  switch (change.entityType) {
    case 'workflow':
      if (change.operation === 'create') return '/workflows'
      return `/workflows/${change.entityId}`
    case 'folder':
      if (change.operation === 'create') return '/folders'
      return `/folders/${change.entityId}`
    case 'execution':
      // Execution records don't need to be pushed to a custom endpoint
      return null
    default:
      return null
  }
}

/**
 * Get HTTP method based on operation type
 */
function getMethodForOperation(operation: OperationType): string {
  switch (operation) {
    case 'create':
      return 'POST'
    case 'update':
      return 'PUT'
    case 'delete':
      return 'DELETE'
    default:
      return 'POST'
  }
}

/**
 * Sync Status Hook
 */
export function useSyncStatus(options: UseSyncStatusOptions = {}): UseSyncStatusReturn {
  const { autoStart = false, config: initialConfig, onSyncComplete, onConflict, onError } = options

  // State
  const [state, setState] = useState<SyncEngineState>({
    isSyncing: false,
    isEnabled: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    conflictCount: 0,
  })

  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)

  // Configuration
  const [config, setConfig] = useState<Partial<SyncConfig>>(initialConfig || {})

  // Sync engine ref (lazy initialization)
  const engineRef = useRef<{
    localStorage: ReturnType<typeof createLocalStorage>
    cloudApi: ReturnType<typeof createCloudApi>
    autoSyncInterval: ReturnType<typeof setInterval> | null
  } | null>(null)

  // Initialize
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = {
        localStorage: createLocalStorage(),
        cloudApi: createCloudApi(),
        autoSyncInterval: null,
      }
    }

    // Listen for online status changes
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }))
    }

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }))
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
      // Clean up auto sync
      if (engineRef.current?.autoSyncInterval) {
        clearInterval(engineRef.current.autoSyncInterval)
      }
    }
  }, [])

  // Auto start
  useEffect(() => {
    if (autoStart && engineRef.current) {
      startAutoSync()
    }
  }, [autoStart])

  /**
   * Execute sync
   */
  const sync = useCallback(async (): Promise<SyncResult> => {
    if (!engineRef.current) {
      return { status: 'failed', error: 'Engine not initialized' }
    }

    if (state.isSyncing) {
      return { status: 'skipped', reason: 'Sync in progress' }
    }

    if (!state.isOnline) {
      return { status: 'skipped', reason: 'Offline' }
    }

    setState((prev) => ({ ...prev, isSyncing: true }))

    try {
      const startTime = Date.now()
      const { localStorage, cloudApi } = engineRef.current

      // Get pending sync changes
      const pendingChanges = await localStorage.getPendingChanges()

      // Push changes
      const result = await cloudApi.pushChanges(pendingChanges)

      // Update status
      for (const id of result.successful) {
        await localStorage.updateChangeStatus(id, 'synced')
      }

      const syncResult: SyncResult = {
        status: result.failed.length > 0 ? 'partial' : 'success',
        uploaded: result.successful.length,
        downloaded: 0,
        conflicts: 0,
        errors: result.failed,
        syncedAt: new Date(),
        duration: Date.now() - startTime,
      }

      setLastSyncResult(syncResult)
      setLastSyncAt(new Date())
      await localStorage.setLastSyncTime(new Date())

      // Update pending sync count
      const newPendingChanges = await localStorage.getPendingChanges()
      setState((prev) => ({
        ...prev,
        pendingCount: newPendingChanges.length,
        lastSyncAt: new Date(),
      }))

      onSyncComplete?.(syncResult)
      return syncResult
    } catch (error) {
      const syncResult: SyncResult = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
      setLastSyncResult(syncResult)
      onError?.(error instanceof Error ? error : new Error('Failed to sync'))
      return syncResult
    } finally {
      setState((prev) => ({ ...prev, isSyncing: false }))
    }
  }, [state.isSyncing, state.isOnline, onSyncComplete, onError])

  /**
   * Start auto sync
   */
  const startAutoSync = useCallback(() => {
    if (!engineRef.current) return
    if (engineRef.current.autoSyncInterval) return

    const interval = config.interval || 60000
    engineRef.current.autoSyncInterval = setInterval(() => {
      sync()
    }, interval)

    setState((prev) => ({ ...prev, isEnabled: true }))

    // Execute immediately
    sync()
  }, [config.interval, sync])

  /**
   * Stop auto sync
   */
  const stopAutoSync = useCallback(() => {
    if (!engineRef.current) return
    if (engineRef.current.autoSyncInterval) {
      clearInterval(engineRef.current.autoSyncInterval)
      engineRef.current.autoSyncInterval = null
    }
    setState((prev) => ({ ...prev, isEnabled: false }))
  }, [])

  /**
   * Record a change
   */
  const recordChange = useCallback(
    async <T>(
      entityType: EntityType,
      entityId: string,
      operation: OperationType,
      data: T
    ): Promise<void> => {
      if (!engineRef.current) return

      const { localStorage } = engineRef.current

      const change: ChangeRecord<T> = {
        id: `change_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        entityType,
        entityId,
        operation,
        data,
        timestamp: new Date(),
        syncStatus: 'pending',
        version: 1,
      }

      await localStorage.saveChange(change)

      // Update pending sync count
      const pendingChanges = await localStorage.getPendingChanges()
      setState((prev) => ({ ...prev, pendingCount: pendingChanges.length }))
    },
    []
  )

  /**
   * Resolve a conflict
   */
  const resolveConflict = useCallback(
    async (index: number, resolution: 'local' | 'cloud'): Promise<void> => {
      if (!engineRef.current) return

      const conflict = conflicts[index]
      if (!conflict) return

      const { localStorage } = engineRef.current
      const chosen = resolution === 'local' ? conflict.local : conflict.cloud
      await localStorage.applyChange(chosen)

      setConflicts((prev) => {
        const next = [...prev]
        next.splice(index, 1)
        return next
      })

      setState((prev) => ({ ...prev, conflictCount: prev.conflictCount - 1 }))
    },
    [conflicts]
  )

  /**
   * Update configuration
   */
  const updateConfig = useCallback(
    (newConfig: Partial<SyncConfig>) => {
      setConfig((prev) => ({ ...prev, ...newConfig }))

      // If currently auto syncing and interval changed, restart
      if (engineRef.current?.autoSyncInterval && newConfig.interval) {
        stopAutoSync()
        startAutoSync()
      }
    },
    [stopAutoSync, startAutoSync]
  )

  return {
    state,
    isSyncing: state.isSyncing,
    isEnabled: state.isEnabled,
    isOnline: state.isOnline,
    pendingCount: state.pendingCount,
    conflicts,
    lastSyncResult,
    lastSyncAt,
    sync,
    startAutoSync,
    stopAutoSync,
    recordChange,
    resolveConflict,
    updateConfig,
  }
}

export default useSyncStatus
