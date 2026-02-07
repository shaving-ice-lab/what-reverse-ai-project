/**
 * OfflineTypeDefinition
 * @description OfflineSupportRelated'sTypeDefinition
 */

// ============================================================================
// NetworkStatus
// ============================================================================

/**
 * NetworkStatusType
 */
export type NetworkStatus = 'online' | 'offline' | 'slow';

/**
 * Network
 */
export interface NetworkQuality {
 /** ConnectType */
 effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
 /** Time (ms) */
 rtt: number;
 /** downrowBandwidth (Mbps) */
 downlink: number;
 /** isnoEnableDataSave */
 saveData: boolean;
}

/**
 * ConnectStatusInfo
 */
export interface ConnectionInfo {
 /** isnoOnline */
 isOnline: boolean;
 /** NetworkStatus */
 status: NetworkStatus;
 /** Network */
 quality?: NetworkQuality;
 /** ontimesOnlineTime */
 lastOnlineAt?: Date;
 /** ontimesOfflineTime */
 lastOfflineAt?: Date;
}

// ============================================================================
// OfflineQueue
// ============================================================================

/**
 * OfflineActionType
 */
export type OfflineOperationType =
 | 'workflow:create'
 | 'workflow:update'
 | 'workflow:delete'
 | 'execution:create'
 | 'settings:update'
 | 'api:request';

/**
 * OfflineActionStatus
 */
export type OfflineOperationStatus =
 | 'pending'
 | 'processing'
 | 'completed'
 | 'failed'
 | 'cancelled';

/**
 * OfflineAction
 */
export interface OfflineOperation<T = unknown> {
 /** Action ID */
 id: string;
 /** ActionType */
 type: OfflineOperationType;
 /** ActionData */
 data: T;
 /** Created At */
 createdAt: Date;
 /** Status */
 status: OfflineOperationStatus;
 /** Retrytimescount */
 retryCount: number;
 /** MaximumRetrytimescount */
 maxRetries: number;
 /** ErrorInfo */
 error?: string;
 /** Priority (smallPriority) */
 priority: number;
 /** Data */
 metadata?: Record<string, unknown>;
}

/**
 * OfflineQueueConfig
 */
export interface OfflineQueueConfig {
 /** MaximumQueueLength */
 maxSize: number;
 /** DefaultMaximumRetrytimescount */
 defaultMaxRetries: number;
 /** Retrybetween (ms) */
 retryInterval: number;
 /** isnoEnablePersistent */
 persistToStorage: boolean;
 /** Storagekey */
 storageKey: string;
}

/**
 * OfflineQueueStatus
 */
export interface OfflineQueueState {
 /** QueueLength */
 length: number;
 /** PendingCount */
 pendingCount: number;
 /** ProcessingCount */
 processingCount: number;
 /** FailedCount */
 failedCount: number;
 /** isnoSyncing */
 isSyncing: boolean;
}

// ============================================================================
// OfflineStorage
// ============================================================================

/**
 * OfflineStorage
 */
export interface OfflineStorageItem<T = unknown> {
 /** key */
 key: string;
 /** Data */
 value: T;
 /** ExpiredTime */
 expiresAt?: Date;
 /** Created At */
 createdAt: Date;
 /** Updated At */
 updatedAt: Date;
 /** Version */
 version: number;
}

/**
 * CachePolicy
 */
export type CacheStrategy =
 | 'cache-first'
 | 'network-first'
 | 'stale-while-revalidate'
 | 'network-only'
 | 'cache-only';

/**
 * CacheConfig
 */
export interface CacheConfig {
 /** CachePolicy */
 strategy: CacheStrategy;
 /** ExpiredTime (ms) */
 ttl: number;
 /** MaximumCacheitemcount */
 maxEntries: number;
}

// ============================================================================
// OfflineFeaturesConfig
// ============================================================================

/**
 * OfflineFeaturesMatrix
 */
export interface OfflineCapabilities {
 /** ViewWorkflow */
 viewWorkflows: boolean;
 /** EditWorkflow */
 editWorkflows: boolean;
 /** ExecuteWorkflow(onlyLocal LLM) */
 executeWorkflows: 'full' | 'local-only' | 'disabled';
 /** ViewExecuteRecord */
 viewExecutions: boolean;
 /** Browse Agent Store */
 browseStore: 'full' | 'cached' | 'disabled';
 /** UserSettings */
 userSettings: boolean;
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
};

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
 | 'sync:error';

/**
 * OfflineEvent
 */
export interface OfflineEvent {
 type: OfflineEventType;
 timestamp: Date;
 data?: unknown;
}

// ============================================================================
// Toolcount
// ============================================================================

/**
 * GenerateOfflineAction ID
 */
export function generateOfflineId(): string {
 return `offline_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * CheckActionisnoExpired
 */
export function isOperationExpired(
 operation: OfflineOperation,
 maxAge: number = 24 * 60 * 60 * 1000 // Default 24 h
): boolean {
 const age = Date.now() - new Date(operation.createdAt).getTime();
 return age > maxAge;
}

/**
 * byPriorityandTimeSortAction
 */
export function sortOperations(operations: OfflineOperation[]): OfflineOperation[] {
 return [...operations].sort((a, b) => {
 // firstbyPrioritySort
 if (a.priority !== b.priority) {
 return a.priority - b.priority;
 }
 // againbyCreated AtSort
 return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
 });
}
