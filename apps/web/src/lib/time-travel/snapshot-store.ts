/**
 * Snapshot Storage Service
 *
 * Provides persistent storage features for execution snapshots. Supports multiple storage backends:
 * - IndexedDB (Web Default)
 * - LocalStorage (Fallback)
 * - Tauri SQLite (Desktop)
 * - Memory (Testing)
 */

import type {
  ExecutionSnapshot,
  NodeSnapshot,
  SnapshotStorageOptions,
  SnapshotQueryParams,
  SnapshotListItem,
  ExecutionSummary,
  SnapshotMetadata,
} from '@/types/time-travel'
import type { ExecutionStatus } from '@/types/execution'
import type {
  ISnapshotStore,
  SnapshotStoreConfig,
  SnapshotStoreEvent,
  SnapshotStoreEventListener,
  StorageBackend,
} from './types'
import { DEFAULT_STORE_CONFIG, DB_VERSION } from './types'
import { compressSnapshot, decompressSnapshot } from './snapshot-utils'

/**
 * Snapshot storage service
 */
export class SnapshotStore implements ISnapshotStore {
  private config: SnapshotStoreConfig
  private db: IDBDatabase | null = null
  private listeners: Set<SnapshotStoreEventListener> = new Set()
  private memoryStore: Map<string, ExecutionSnapshot> = new Map()
  private initialized = false

  constructor(config: Partial<SnapshotStoreConfig> = {}) {
    this.config = { ...DEFAULT_STORE_CONFIG, ...config }
  }

  /**
   * Initialize storage
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    const backend = this.detectBackend()
    this.config.backend = backend

    if (backend === 'indexeddb') {
      await this.initIndexedDB()
    }

    this.initialized = true
    this.log('SnapshotStore initialized with backend:', backend)
  }

  /**
   * Detect available storage backend
   */
  private detectBackend(): StorageBackend {
    // Check if running in Tauri environment
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      return 'tauri'
    }

    // Check IndexedDB Support
    if (typeof indexedDB !== 'undefined') {
      return 'indexeddb'
    }

    // Check LocalStorage Support
    if (typeof localStorage !== 'undefined') {
      return 'localstorage'
    }

    // Fall back to in-memory storage
    return 'memory'
  }

  /**
   * Initialize IndexedDB
   */
  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName!, DB_VERSION)

      request.onerror = () => {
        this.log('IndexedDB error:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create snapshot object store
        if (!db.objectStoreNames.contains(this.config.storeName!)) {
          const store = db.createObjectStore(this.config.storeName!, {
            keyPath: 'executionId',
          })

          // Create indexes
          store.createIndex('workflowId', 'workflowId', { unique: false })
          store.createIndex('status', 'status', { unique: false })
          store.createIndex('startedAt', 'startedAt', { unique: false })
          store.createIndex('workflowId_status', ['workflowId', 'status'], {
            unique: false,
          })
        }
      }
    })
  }

  /**
   * Save execution snapshot
   */
  async saveSnapshot(snapshot: ExecutionSnapshot): Promise<void> {
    await this.ensureInitialized()

    const options = this.config.defaultOptions
    let dataToStore = snapshot

    // Apply compression if enabled
    if (options?.compress) {
      dataToStore = await compressSnapshot(snapshot, options.compressionLevel)
    }

    switch (this.config.backend) {
      case 'indexeddb':
        await this.saveToIndexedDB(dataToStore)
        break
      case 'localstorage':
        this.saveToLocalStorage(dataToStore)
        break
      case 'tauri':
        await this.saveToTauri(dataToStore)
        break
      case 'memory':
        this.memoryStore.set(snapshot.executionId, dataToStore)
        break
    }

    this.emit({ type: 'snapshot:saved', executionId: snapshot.executionId })
    this.log('Snapshot saved:', snapshot.executionId)
  }

  /**
   * Get execution snapshot
   */
  async getSnapshot(executionId: string): Promise<ExecutionSnapshot | null> {
    await this.ensureInitialized()

    let snapshot: ExecutionSnapshot | null = null

    switch (this.config.backend) {
      case 'indexeddb':
        snapshot = await this.getFromIndexedDB(executionId)
        break
      case 'localstorage':
        snapshot = this.getFromLocalStorage(executionId)
        break
      case 'tauri':
        snapshot = await this.getFromTauri(executionId)
        break
      case 'memory':
        snapshot = this.memoryStore.get(executionId) || null
        break
    }

    // Decompress if needed
    if (snapshot && snapshot.metadata?.compressed) {
      snapshot = await decompressSnapshot(snapshot)
    }

    return snapshot
  }

  /**
   * Delete execution snapshot
   */
  async deleteSnapshot(executionId: string): Promise<void> {
    await this.ensureInitialized()

    switch (this.config.backend) {
      case 'indexeddb':
        await this.deleteFromIndexedDB(executionId)
        break
      case 'localstorage':
        this.deleteFromLocalStorage(executionId)
        break
      case 'tauri':
        await this.deleteFromTauri(executionId)
        break
      case 'memory':
        this.memoryStore.delete(executionId)
        break
    }

    this.emit({ type: 'snapshot:deleted', executionId })
    this.log('Snapshot deleted:', executionId)
  }

  /**
   * Query snapshot list
   */
  async querySnapshots(params: SnapshotQueryParams = {}): Promise<SnapshotListItem[]> {
    await this.ensureInitialized()

    let results: SnapshotListItem[] = []

    switch (this.config.backend) {
      case 'indexeddb':
        results = await this.queryFromIndexedDB(params)
        break
      case 'localstorage':
        results = this.queryFromLocalStorage(params)
        break
      case 'tauri':
        results = await this.queryFromTauri(params)
        break
      case 'memory':
        results = this.queryFromMemory(params)
        break
    }

    return results
  }

  /**
   * Get snapshot count
   */
  async getSnapshotCount(workflowId?: string): Promise<number> {
    await this.ensureInitialized()

    switch (this.config.backend) {
      case 'indexeddb':
        return this.countFromIndexedDB(workflowId)
      case 'localstorage':
        return this.countFromLocalStorage(workflowId)
      case 'tauri':
        return this.countFromTauri(workflowId)
      case 'memory':
        return this.countFromMemory(workflowId)
      default:
        return 0
    }
  }

  /**
   * Clean up expired snapshots
   */
  async cleanupSnapshots(options?: SnapshotStorageOptions): Promise<number> {
    await this.ensureInitialized()

    const opts = { ...this.config.defaultOptions, ...options }
    let deletedCount = 0

    const snapshots = await this.querySnapshots({
      sortBy: 'startedAt',
      sortOrder: 'asc',
    })

    const now = new Date()
    const maxAge = opts.maxAgeDays ? opts.maxAgeDays * 24 * 60 * 60 * 1000 : 0
    const maxCount = opts.maxSnapshots || Infinity

    // Clean up by age
    if (maxAge > 0) {
      for (const snapshot of snapshots) {
        const snapshotDate = new Date(snapshot.startedAt)
        if (now.getTime() - snapshotDate.getTime() > maxAge) {
          await this.deleteSnapshot(snapshot.executionId)
          deletedCount++
        }
      }
    }

    // Clean up by count
    const currentCount = await this.getSnapshotCount()
    if (currentCount > maxCount) {
      const toDelete = snapshots.slice(0, currentCount - maxCount)
      for (const snapshot of toDelete) {
        await this.deleteSnapshot(snapshot.executionId)
        deletedCount++
      }
    }

    this.emit({ type: 'snapshots:cleaned', count: deletedCount })
    this.log('Cleaned up snapshots:', deletedCount)

    return deletedCount
  }

  /**
   * Update node snapshot
   */
  async updateNodeSnapshot(
    executionId: string,
    nodeId: string,
    nodeSnapshot: NodeSnapshot
  ): Promise<void> {
    await this.ensureInitialized()

    const snapshot = await this.getSnapshot(executionId)
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${executionId}`)
    }

    snapshot.nodeSnapshots[nodeId] = nodeSnapshot

    // Update summary
    this.updateSummary(snapshot)

    await this.saveSnapshot(snapshot)

    this.emit({
      type: 'snapshot:updated',
      executionId,
      nodeId,
    })
  }

  /**
   * Export snapshot as JSON
   */
  async exportSnapshot(executionId: string): Promise<string> {
    const snapshot = await this.getSnapshot(executionId)
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${executionId}`)
    }

    return JSON.stringify(snapshot, null, 2)
  }

  /**
   * Import snapshot
   */
  async importSnapshot(jsonData: string): Promise<ExecutionSnapshot> {
    const snapshot = JSON.parse(jsonData) as ExecutionSnapshot

    // Validate snapshot structure
    this.validateSnapshot(snapshot)

    await this.saveSnapshot(snapshot)
    return snapshot
  }

  // ===== IndexedDB Implementation =====

  private async saveToIndexedDB(snapshot: ExecutionSnapshot): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'))
        return
      }

      const transaction = this.db.transaction(this.config.storeName!, 'readwrite')
      const store = transaction.objectStore(this.config.storeName!)
      const request = store.put(snapshot)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  private async getFromIndexedDB(executionId: string): Promise<ExecutionSnapshot | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'))
        return
      }

      const transaction = this.db.transaction(this.config.storeName!, 'readonly')
      const store = transaction.objectStore(this.config.storeName!)
      const request = store.get(executionId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  private async deleteFromIndexedDB(executionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'))
        return
      }

      const transaction = this.db.transaction(this.config.storeName!, 'readwrite')
      const store = transaction.objectStore(this.config.storeName!)
      const request = store.delete(executionId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  private async queryFromIndexedDB(params: SnapshotQueryParams): Promise<SnapshotListItem[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'))
        return
      }

      const transaction = this.db.transaction(this.config.storeName!, 'readonly')
      const store = transaction.objectStore(this.config.storeName!)

      let request: IDBRequest

      if (params.workflowId) {
        const index = store.index('workflowId')
        request = index.getAll(params.workflowId)
      } else {
        request = store.getAll()
      }

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        let results = (request.result as ExecutionSnapshot[]).map(this.snapshotToListItem)

        // Filter
        if (params.status) {
          results = results.filter((r) => r.status === params.status)
        }
        if (params.startDate) {
          results = results.filter((r) => new Date(r.startedAt) >= new Date(params.startDate!))
        }
        if (params.endDate) {
          results = results.filter((r) => new Date(r.startedAt) <= new Date(params.endDate!))
        }

        // Sort
        const sortBy = params.sortBy || 'startedAt'
        const sortOrder = params.sortOrder || 'desc'
        results.sort((a, b) => {
          let aVal: string | number | undefined
          let bVal: string | number | undefined

          if (sortBy === 'startedAt') {
            aVal = a.startedAt
            bVal = b.startedAt
          } else if (sortBy === 'durationMs') {
            aVal = a.durationMs
            bVal = b.durationMs
          } else if (sortBy === 'status') {
            aVal = a.status
            bVal = b.status
          }

          if (aVal === undefined) return 1
          if (bVal === undefined) return -1

          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
          return sortOrder === 'asc' ? comparison : -comparison
        })

        // Pagination
        const page = params.page || 1
        const pageSize = params.pageSize || 20
        const start = (page - 1) * pageSize
        results = results.slice(start, start + pageSize)

        resolve(results)
      }
    })
  }

  private async countFromIndexedDB(workflowId?: string): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'))
        return
      }

      const transaction = this.db.transaction(this.config.storeName!, 'readonly')
      const store = transaction.objectStore(this.config.storeName!)

      let request: IDBRequest<number>

      if (workflowId) {
        const index = store.index('workflowId')
        request = index.count(workflowId)
      } else {
        request = store.count()
      }

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  // ===== LocalStorage Implementation =====

  private getLocalStorageKey(executionId: string): string {
    return `${this.config.dbName}:${executionId}`
  }

  private getLocalStorageIndexKey(): string {
    return `${this.config.dbName}:index`
  }

  private saveToLocalStorage(snapshot: ExecutionSnapshot): void {
    const key = this.getLocalStorageKey(snapshot.executionId)
    localStorage.setItem(key, JSON.stringify(snapshot))

    // Update index
    const indexKey = this.getLocalStorageIndexKey()
    const index = JSON.parse(localStorage.getItem(indexKey) || '[]') as string[]
    if (!index.includes(snapshot.executionId)) {
      index.push(snapshot.executionId)
      localStorage.setItem(indexKey, JSON.stringify(index))
    }
  }

  private getFromLocalStorage(executionId: string): ExecutionSnapshot | null {
    const key = this.getLocalStorageKey(executionId)
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  }

  private deleteFromLocalStorage(executionId: string): void {
    const key = this.getLocalStorageKey(executionId)
    localStorage.removeItem(key)

    // Update index
    const indexKey = this.getLocalStorageIndexKey()
    const index = JSON.parse(localStorage.getItem(indexKey) || '[]') as string[]
    const newIndex = index.filter((id) => id !== executionId)
    localStorage.setItem(indexKey, JSON.stringify(newIndex))
  }

  private queryFromLocalStorage(params: SnapshotQueryParams): SnapshotListItem[] {
    const indexKey = this.getLocalStorageIndexKey()
    const index = JSON.parse(localStorage.getItem(indexKey) || '[]') as string[]

    const results: SnapshotListItem[] = []
    for (const id of index) {
      const snapshot = this.getFromLocalStorage(id)
      if (snapshot) {
        results.push(this.snapshotToListItem(snapshot))
      }
    }

    // Apply filter and sort (simplified implementation)
    return results.slice(0, params.pageSize || 20)
  }

  private countFromLocalStorage(workflowId?: string): number {
    const indexKey = this.getLocalStorageIndexKey()
    const index = JSON.parse(localStorage.getItem(indexKey) || '[]') as string[]

    if (!workflowId) {
      return index.length
    }

    let count = 0
    for (const id of index) {
      const snapshot = this.getFromLocalStorage(id)
      if (snapshot && snapshot.workflowId === workflowId) {
        count++
      }
    }
    return count
  }

  // ===== Tauri Implementation =====

  private async saveToTauri(snapshot: ExecutionSnapshot): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('save_snapshot', { snapshot })
  }

  private async getFromTauri(executionId: string): Promise<ExecutionSnapshot | null> {
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke('get_snapshot', { executionId })
  }

  private async deleteFromTauri(executionId: string): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('delete_snapshot', { executionId })
  }

  private async queryFromTauri(params: SnapshotQueryParams): Promise<SnapshotListItem[]> {
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke('query_snapshots', { params })
  }

  private async countFromTauri(workflowId?: string): Promise<number> {
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke('count_snapshots', { workflowId })
  }

  // ===== Memory Implementation =====

  private queryFromMemory(params: SnapshotQueryParams): SnapshotListItem[] {
    let results = Array.from(this.memoryStore.values()).map(this.snapshotToListItem)

    if (params.workflowId) {
      results = results.filter((r) => r.workflowId === params.workflowId)
    }

    return results.slice(0, params.pageSize || 20)
  }

  private countFromMemory(workflowId?: string): number {
    if (!workflowId) {
      return this.memoryStore.size
    }

    let count = 0
    for (const snapshot of this.memoryStore.values()) {
      if (snapshot.workflowId === workflowId) {
        count++
      }
    }
    return count
  }

  // ===== Helper Methods =====

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }
  }

  private snapshotToListItem(snapshot: ExecutionSnapshot): SnapshotListItem {
    return {
      executionId: snapshot.executionId,
      workflowId: snapshot.workflowId,
      workflowName: snapshot.workflowName,
      status: snapshot.status,
      startedAt: snapshot.startedAt,
      completedAt: snapshot.completedAt,
      durationMs: snapshot.durationMs,
      summary: snapshot.summary,
    }
  }

  private updateSummary(snapshot: ExecutionSnapshot): void {
    const nodeSnapshots = Object.values(snapshot.nodeSnapshots)

    snapshot.summary = {
      totalNodes: nodeSnapshots.length,
      completedNodes: nodeSnapshots.filter((n) => n.status === 'completed').length,
      failedNodes: nodeSnapshots.filter((n) => n.status === 'failed').length,
      skippedNodes: nodeSnapshots.filter((n) => n.status === 'skipped').length,
      totalTokensUsed: nodeSnapshots.reduce((sum, n) => sum + (n.metadata?.tokensUsed || 0), 0),
    }
  }

  private validateSnapshot(snapshot: ExecutionSnapshot): void {
    if (!snapshot.executionId) {
      throw new Error('Invalid snapshot: missing executionId')
    }
    if (!snapshot.workflowId) {
      throw new Error('Invalid snapshot: missing workflowId')
    }
    if (!snapshot.nodeSnapshots) {
      throw new Error('Invalid snapshot: missing nodeSnapshots')
    }
  }

  private emit(event: SnapshotStoreEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch (err) {
        console.error('SnapshotStore event listener error:', err)
      }
    }
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[SnapshotStore]', ...args)
    }
  }

  /**
   * Add event listener
   */
  addEventListener(listener: SnapshotStoreEventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Destroy storage instance
   */
  destroy(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
    this.memoryStore.clear()
    this.listeners.clear()
    this.initialized = false
  }
}

// ===== Singleton Instance =====

let snapshotStoreInstance: SnapshotStore | null = null

/**
 * Get snapshot store instance
 */
export function getSnapshotStore(config?: Partial<SnapshotStoreConfig>): SnapshotStore {
  if (!snapshotStoreInstance) {
    snapshotStoreInstance = new SnapshotStore(config)
  }
  return snapshotStoreInstance
}

/**
 * Reset snapshot store (used for testing)
 */
export function resetSnapshotStore(): void {
  if (snapshotStoreInstance) {
    snapshotStoreInstance.destroy()
    snapshotStoreInstance = null
  }
}
