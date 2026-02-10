/**
 * TimerowDebug - InternalTypeDefinition
 */

import type {
  ExecutionSnapshot,
  NodeSnapshot,
  SnapshotStorageOptions,
  SnapshotQueryParams,
  SnapshotListItem,
} from '@/types/time-travel'

/**
 * SnapshotStorageInterface
 */
export interface ISnapshotStore {
  /**
   * SaveExecuteSnapshot
   */
  saveSnapshot(snapshot: ExecutionSnapshot): Promise<void>

  /**
   * FetchExecuteSnapshot
   */
  getSnapshot(executionId: string): Promise<ExecutionSnapshot | null>

  /**
   * DeleteExecuteSnapshot
   */
  deleteSnapshot(executionId: string): Promise<void>

  /**
   * QuerySnapshotList
   */
  querySnapshots(params?: SnapshotQueryParams): Promise<SnapshotListItem[]>

  /**
   * FetchSnapshotCount
   */
  getSnapshotCount(workflowId?: string): Promise<number>

  /**
   * Clean upExpiredSnapshot
   */
  cleanupSnapshots(options?: SnapshotStorageOptions): Promise<number>

  /**
   * UpdateNodeSnapshot
   */
  updateNodeSnapshot(executionId: string, nodeId: string, nodeSnapshot: NodeSnapshot): Promise<void>

  /**
   * ExportSnapshotas JSON
   */
  exportSnapshot(executionId: string): Promise<string>

  /**
   * ImportSnapshot
   */
  importSnapshot(jsonData: string): Promise<ExecutionSnapshot>
}

/**
 * Storage Backend Type
 */
export type StorageBackend = 'indexeddb' | 'localstorage' | 'tauri' | 'memory'

/**
 * SnapshotStorageConfig
 */
export interface SnapshotStoreConfig {
  /** Storage backend */
  backend: StorageBackend
  /** DatabaseName (IndexedDB) */
  dbName?: string
  /** Name */
  storeName?: string
  /** Default storage option */
  defaultOptions?: SnapshotStorageOptions
  /** Whether to enable debug logs */
  debug?: boolean
}

/**
 * DefaultConfig
 */
export const DEFAULT_STORE_CONFIG: SnapshotStoreConfig = {
  backend: 'indexeddb',
  dbName: 'agentflow-time-travel',
  storeName: 'snapshots',
  defaultOptions: {
    compress: true,
    compressionLevel: 6,
    maxSnapshots: 100,
    maxAgeDays: 30,
    excludeSensitiveData: false,
  },
  debug: false,
}

/**
 * IndexedDB DatabaseVersion
 */
export const DB_VERSION = 1

/**
 * SnapshotStorageEvent
 */
export type SnapshotStoreEvent =
  | { type: 'snapshot:saved'; executionId: string }
  | { type: 'snapshot:deleted'; executionId: string }
  | { type: 'snapshot:updated'; executionId: string; nodeId: string }
  | { type: 'snapshots:cleaned'; count: number }
  | { type: 'error'; error: Error }

/**
 * SnapshotStorageEventListen
 */
export type SnapshotStoreEventListener = (event: SnapshotStoreEvent) => void
