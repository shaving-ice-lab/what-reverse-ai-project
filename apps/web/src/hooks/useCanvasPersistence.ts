/**
 * Canvas State Persistence Hook
 *
 * Features:
 * 1. Auto-save canvas state to localStorage
 * 2. Restore canvas state on page load
 * 3. Support viewport and zoom level
 * 4. Support node/edge data
 * 5. Debounced save to avoid frequent writes
 */

import { useCallback, useEffect, useRef } from 'react'
import { useReactFlow, type Viewport } from '@xyflow/react'
import type { Node, Edge } from '@xyflow/react'

// ===== TypeDefinition =====
interface CanvasState {
  viewport: Viewport
  nodes: Node[]
  edges: Edge[]
  timestamp: number
  version: string
}

interface CanvasPersistenceOptions {
  /** Workflow ID */
  workflowId: string
  /** Auto-save interval (ms), default 5000 */
  autoSaveInterval?: number
  /** Debounce delay (ms), default 1000 */
  debounceDelay?: number
  /** Whether to enable auto-save, default true */
  enableAutoSave?: boolean
  /** Save callback */
  onSave?: (state: CanvasState) => void
  /** Restore callback */
  onRestore?: (state: CanvasState) => void
  /** Error callback */
  onError?: (error: Error) => void
}

// Storage key prefix
const STORAGE_PREFIX = 'agentflow_canvas_'
// Current version
const CURRENT_VERSION = '1.0'
// Maximum saved state count
const MAX_HISTORY = 5

// Get storage key
function getStorageKey(workflowId: string): string {
  return `${STORAGE_PREFIX}${workflowId}`
}

// Get history record key
function getHistoryKey(workflowId: string): string {
  return `${STORAGE_PREFIX}${workflowId}_history`
}

// ===== Main Hook =====
export function useCanvasPersistence(options: CanvasPersistenceOptions) {
  const {
    workflowId,
    autoSaveInterval = 5000,
    debounceDelay = 1000,
    enableAutoSave = true,
    onSave,
    onRestore,
    onError,
  } = options

  const { getNodes, getEdges, getViewport, setViewport, setNodes, setEdges } = useReactFlow()

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveRef = useRef<number>(0)

  // Save canvas state
  const saveState = useCallback(() => {
    try {
      const state: CanvasState = {
        viewport: getViewport(),
        nodes: getNodes(),
        edges: getEdges(),
        timestamp: Date.now(),
        version: CURRENT_VERSION,
      }

      // Save to localStorage
      localStorage.setItem(getStorageKey(workflowId), JSON.stringify(state))
      lastSaveRef.current = state.timestamp

      // SavetoHistoryRecord
      saveToHistory(workflowId, state)

      onSave?.(state)
      return true
    } catch (error) {
      onError?.(error as Error)
      console.error('[CanvasPersistence] Save failed:', error)
      return false
    }
  }, [workflowId, getViewport, getNodes, getEdges, onSave, onError])

  // Debounced save
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveState()
    }, debounceDelay)
  }, [saveState, debounceDelay])

  // Restore canvas state
  const restoreState = useCallback((): CanvasState | null => {
    try {
      const saved = localStorage.getItem(getStorageKey(workflowId))
      if (!saved) return null

      const state: CanvasState = JSON.parse(saved)

      // Version check
      if (state.version !== CURRENT_VERSION) {
        console.warn('[CanvasPersistence] Version mismatch, migration may be needed')
      }

      // Restore viewport
      if (state.viewport) {
        setViewport(state.viewport, { duration: 0 })
      }

      // Restore nodes and edges
      if (state.nodes && state.nodes.length > 0) {
        setNodes(state.nodes)
      }
      if (state.edges && state.edges.length > 0) {
        setEdges(state.edges)
      }

      onRestore?.(state)
      return state
    } catch (error) {
      onError?.(error as Error)
      console.error('[CanvasPersistence] Restore failed:', error)
      return null
    }
  }, [workflowId, setViewport, setNodes, setEdges, onRestore, onError])

  // Clear saved state
  const clearState = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey(workflowId))
      localStorage.removeItem(getHistoryKey(workflowId))
      return true
    } catch (error) {
      onError?.(error as Error)
      return false
    }
  }, [workflowId, onError])

  // Get saved state (without restoring)
  const getSavedState = useCallback((): CanvasState | null => {
    try {
      const saved = localStorage.getItem(getStorageKey(workflowId))
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  }, [workflowId])

  // Check if there is a saved state
  const hasSavedState = useCallback((): boolean => {
    return !!localStorage.getItem(getStorageKey(workflowId))
  }, [workflowId])

  // Get history records
  const getHistory = useCallback((): CanvasState[] => {
    try {
      const history = localStorage.getItem(getHistoryKey(workflowId))
      return history ? JSON.parse(history) : []
    } catch {
      return []
    }
  }, [workflowId])

  // Restore from history record
  const restoreFromHistory = useCallback(
    (index: number): boolean => {
      try {
        const history = getHistory()
        if (index < 0 || index >= history.length) return false

        const state = history[index]
        if (state.viewport) {
          setViewport(state.viewport, { duration: 300 })
        }
        if (state.nodes) {
          setNodes(state.nodes)
        }
        if (state.edges) {
          setEdges(state.edges)
        }

        onRestore?.(state)
        return true
      } catch (error) {
        onError?.(error as Error)
        return false
      }
    },
    [getHistory, setViewport, setNodes, setEdges, onRestore, onError]
  )

  // Save viewport only
  const saveViewportOnly = useCallback(() => {
    try {
      const saved = localStorage.getItem(getStorageKey(workflowId))
      const state: CanvasState = saved
        ? JSON.parse(saved)
        : { nodes: [], edges: [], timestamp: 0, version: CURRENT_VERSION }

      state.viewport = getViewport()
      state.timestamp = Date.now()

      localStorage.setItem(getStorageKey(workflowId), JSON.stringify(state))
      return true
    } catch (error) {
      onError?.(error as Error)
      return false
    }
  }, [workflowId, getViewport, onError])

  // Set up auto-save
  useEffect(() => {
    if (!enableAutoSave) return

    autoSaveIntervalRef.current = setInterval(() => {
      saveState()
    }, autoSaveInterval)

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
      }
    }
  }, [enableAutoSave, autoSaveInterval, saveState])

  // Save before page close
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveState()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [saveState])

  // Clean up timers
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
      }
    }
  }, [])

  return {
    saveState,
    debouncedSave,
    restoreState,
    clearState,
    getSavedState,
    hasSavedState,
    getHistory,
    restoreFromHistory,
    saveViewportOnly,
    lastSaveTime: lastSaveRef.current,
  }
}

// ===== Helper Functions =====

// Save to history record
function saveToHistory(workflowId: string, state: CanvasState): void {
  try {
    const historyKey = getHistoryKey(workflowId)
    const history: CanvasState[] = JSON.parse(localStorage.getItem(historyKey) || '[]')

    // Add to beginning
    history.unshift(state)

    // Limit history record count
    if (history.length > MAX_HISTORY) {
      history.pop()
    }

    localStorage.setItem(historyKey, JSON.stringify(history))
  } catch (error) {
    console.error('[CanvasPersistence] Save history failed:', error)
  }
}

// ===== Utility Functions =====

// Fetch all saved workflow IDs
export function getSavedWorkflowIds(): string[] {
  const ids: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(STORAGE_PREFIX) && !key.endsWith('_history')) {
      ids.push(key.replace(STORAGE_PREFIX, ''))
    }
  }
  return ids
}

// Clear all canvas states
export function clearAllCanvasStates(): void {
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key))
}

// Export canvas state
export function exportCanvasState(workflowId: string): string | null {
  const state = localStorage.getItem(getStorageKey(workflowId))
  return state
}

// Import canvas state
export function importCanvasState(workflowId: string, stateJson: string): boolean {
  try {
    const state: CanvasState = JSON.parse(stateJson)
    // Validate structure
    if (!state.version || !state.timestamp) {
      throw new Error('Invalid canvas state format')
    }
    localStorage.setItem(getStorageKey(workflowId), stateJson)
    return true
  } catch {
    return false
  }
}

// Get canvas state storage size (bytes)
export function getCanvasStateSize(workflowId: string): number {
  const state = localStorage.getItem(getStorageKey(workflowId))
  const history = localStorage.getItem(getHistoryKey(workflowId))
  return (state?.length || 0) + (history?.length || 0)
}

// Compress canvas state (remove unnecessary data)
export function compressCanvasState(state: CanvasState): CanvasState {
  return {
    ...state,
    nodes: state.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      // Remove runtime state
      selected: undefined,
      dragging: undefined,
    })) as Node[],
    edges: state.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: edge.type,
      data: edge.data,
      // Remove runtime state
      selected: undefined,
    })) as Edge[],
  }
}
