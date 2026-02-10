/**
 * Offline Type Definitions
 * @description Offline Support Related Type Definitions
 */

// ============================================================================
// NetworkStatus
// ============================================================================

/**
 * Network Status Type
 */
export type NetworkStatus = 'online' | 'offline' | 'slow'

/**
 * Network Quality
 */
export interface NetworkQuality {
  /** Connection Type */
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown'
  /** Round Trip Time (ms) */
  rtt: number
  /** Download Bandwidth (Mbps) */
  downlink: number
  /** Whether to enable data saving */
  saveData: boolean
}

/**
 * Connection Status Information
 */
export interface ConnectionInfo {
  /** Whether online */
  isOnline: boolean
  /** Network Status */
  status: NetworkStatus
  /** Network Quality */
  quality?: NetworkQuality
  /** Last online time */
  lastOnlineAt?: Date
  /** Last offline time */
  lastOfflineAt?: Date
}

// ============================================================================
// OfflineQueue
// ============================================================================

/**
 * Offline Action Type
 */
export type OfflineOperationType =
  | 'workflow:create'
  | 'workflow:update'
  | 'workflow:delete'
  | 'execution:create'
  | 'settings:update'
  | 'api:request'

/**
 * Offline Action Status
 */
export type OfflineOperationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

/**
 * Offline Action
 */
export interface OfflineOperation<T = unknown> {
  /** Action ID */
  id: string
  /** Action Type */
  type: OfflineOperationType
  /** Action Data */
  data: T
  /** Created At */
  createdAt: Date
  /** Status */
  status: OfflineOperationStatus
  /** Retry count */
  retryCount: number
  /** Maximum retry count */
  maxRetries: number
  /** Error information */
  error?: string
  /** Priority (lower number = higher priority) */
  priority: number
  /** Metadata */
  metadata?: Record<string, unknown>
}

/**
 * Offline Queue Config
 */
export interface OfflineQueueConfig {
  /** Maximum queue length */
  maxSize: number
  /** Default maximum retry count */
  defaultMaxRetries: number
  /** Retry interval (ms) */
  retryInterval: number
  /** Whether to enable persistence */
  persistToStorage: boolean
  /** Storage key */
  storageKey: string
}

/**
 * Offline Queue Status
 */
export interface OfflineQueueState {
  /** Queue length */
  length: number
  /** Pending count */
  pendingCount: number
  /** Processing count */
  processingCount: number
  /** Failed count */
  failedCount: number
  /** Whether syncing */
  isSyncing: boolean
}

// ============================================================================
// OfflineStorage
// ============================================================================

/**
 * Offline Storage Item
 */
export interface OfflineStorageItem<T = unknown> {
  /** Key */
  key: string
  /** Data */
  value: T
  /** Expiration time */
  expiresAt?: Date
  /** Created At */
  createdAt: Date
  /** Updated At */
  updatedAt: Date
  /** Version */
  version: number
}

/**
 * Cache Policy
 */
export type CacheStrategy =
  | 'cache-first'
  | 'network-first'
  | 'stale-while-revalidate'
  | 'network-only'
  | 'cache-only'

/**
 * Cache Config
 */
export interface CacheConfig {
  /** Cache policy */
  strategy: CacheStrategy
  /** Time to live (ms) */
  ttl: number
  /** Maximum cache item count */
  maxEntries: number
}

// ============================================================================
// OfflineFeaturesConfig
// ============================================================================

/**
 * Offline Features Matrix
 */
export interface OfflineCapabilities {
  /** View workflows */
  viewWorkflows: boolean
  /** Edit workflows */
  editWorkflows: boolean
  /** Execute workflows (supports local LLM only) */
  executeWorkflows: 'full' | 'local-only' | 'disabled'
  /** View execution records */
  viewExecutions: boolean
  /** Browse agent store */
  browseStore: 'full' | 'cached' | 'disabled'
  /** User settings */
  userSettings: boolean
}

/**
 * DefaultOfflineFeaturesConfig
 */
export const DEFAULT_OFFLINE_CAPABILITIES: OfflineCapabilities = {
  viewWorkflows: true,
  editWorkflows: true,
  executeWorkflows: 'local-only',
  viewExecutions: true,
  browseStore: 'cached',
  userSettings: true,
}

// ============================================================================
// EventType
// ============================================================================

/**
 * OfflineEventType
 */
export type OfflineEventType =
  | 'online'
  | 'offline'
  | 'queue:add'
  | 'queue:process'
  | 'queue:complete'
  | 'queue:fail'
  | 'sync:start'
  | 'sync:complete'
  | 'sync:error'

/**
 * OfflineEvent
 */
export interface OfflineEvent {
  type: OfflineEventType
  timestamp: Date
  data?: unknown
}

// ============================================================================
// Toolcount
// ============================================================================

/**
 * Generate Offline Action ID
 */
export function generateOfflineId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Check if Action is Expired
 */
export function isOperationExpired(
  operation: OfflineOperation,
  maxAge: number = 24 * 60 * 60 * 1000 // Default 24 hours
): boolean {
  const age = Date.now() - new Date(operation.createdAt).getTime()
  return age > maxAge
}

/**
 * Sort Actions by Priority and Time
 */
export function sortOperations(operations: OfflineOperation[]): OfflineOperation[] {
  return [...operations].sort((a, b) => {
    // First sort by priority
    if (a.priority !== b.priority) {
      return a.priority - b.priority
    }
    // Then sort by creation time
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}
