/**
 * Data Sync Type Definition
 * @description Local/Cloud Data Sync Related Types
 */

// ============================================================================
// SyncConfig
// ============================================================================

/**
 * Conflict Resolution Policy
 */
export type ConflictResolutionStrategy = 'local' | 'cloud' | 'latest' | 'manual';

/**
 * Sync Configuration
 */
export interface SyncConfig {
 /** Auto Sync Interval (seconds) */
 interval: number;
 /** Conflict Resolution Policy */
 conflictResolution: ConflictResolutionStrategy;
 /** Excluded Data Types */
 excludePatterns: string[];
 /** Encrypt Before Sync */
 encryptBeforeSync: boolean;
 /** Maximum Retry Count */
 maxRetries: number;
 /** Batch Size */
 batchSize: number;
  /** Whether to enable auto sync */
  autoSync: boolean;
  /** Cloud API Address */
  cloudApiUrl?: string;
}

/**
 * Default Sync Config
 */
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
 interval: 60000, // 1min
 conflictResolution: 'latest',
 excludePatterns: ['api_keys', 'secrets', 'tokens'],
 encryptBeforeSync: true,
 maxRetries: 3,
 batchSize: 50,
 autoSync: true,
};

// ============================================================================
// Changelog
// ============================================================================

/**
 * Entity Type
 */
export type EntityType = 'workflow' | 'execution' | 'settings' | 'agent' | 'template';

/**
 * Action Type
 */
export type OperationType = 'create' | 'update' | 'delete';

/**
 * Sync Status
 */
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';

/**
 * Changelog
 */
export interface ChangeRecord<T = unknown> {
  /** Change ID */
  id: string;
  /** Entity Type */
  entityType: EntityType;
  /** Entity ID */
  entityId: string;
  /** Action Type */
  operation: OperationType;
  /** Change Data */
  data: T;
  /** Timestamp */
  timestamp: Date;
  /** Sync Status */
  syncStatus: SyncStatus;
  /** Version Number */
  version: number;
  /** Validation Checksum */
  checksum?: string;
  /** Device ID */
  deviceId?: string;
}

// ============================================================================
// Conflict Processing
// ============================================================================

/**
 * Conflict Information
 */
export interface Conflict<T = unknown> {
  /** Local change */
  local: ChangeRecord<T>;
  /** Cloud change */
  cloud: ChangeRecord<T>;
}

/**
 * Resolved Conflict
 */
export interface ResolvedConflict<T = unknown> extends Conflict<T> {
  /** Resolution strategy */
  resolution: 'local' | 'cloud';
  /** Resolution time */
  resolvedAt: Date;
}

/**
 * Conflict Detection Result
 */
export interface ConflictDetectionResult<T = unknown> {
  /** Conflict list */
  conflicts: Conflict<T>[];
  /** Changes only in local */
  localOnly: ChangeRecord<T>[];
  /** Changes only in cloud */
  cloudOnly: ChangeRecord<T>[];
}

// ============================================================================
// SyncResult
// ============================================================================

/**
 * Sync Error
 */
export interface SyncError {
  /** Change ID list */
  changeIds: string[];
  /** Error information */
  error: string;
  /** Error code */
  code?: string;
}

/**
 * Upload Result
 */
export interface UploadResult {
  /** Successful change IDs */
  successful: string[];
  /** Failed changes */
  failed: SyncError[];
}

/**
 * Download Result
 */
export interface DownloadResult {
  /** Successful change IDs */
  successful: string[];
  /** Failed changes */
  failed: SyncError[];
}

/**
 * Sync Result Status
 */
export type SyncResultStatus = 'success' | 'partial' | 'failed' | 'skipped';

/**
 * Sync Result
 */
export interface SyncResult {
  /** Status */
  status: SyncResultStatus;
  /** Upload count */
  uploaded?: number;
  /** Download count */
  downloaded?: number;
  /** Conflict count */
  conflicts?: number;
  /** Error list */
  errors?: SyncError[];
  /** Skip reason */
  reason?: string;
  /** Error information */
  error?: string;
  /** Sync time */
  syncedAt?: Date;
  /** Duration (ms) */
  duration?: number;
}

// ============================================================================
// SyncStatus
// ============================================================================

/**
 * Sync Engine Status
 */
export interface SyncEngineState {
  /** Whether syncing */
  isSyncing: boolean;
  /** Whether enabled */
  isEnabled: boolean;
  /** Whether online */
  isOnline: boolean;
  /** Pending sync count */
  pendingCount: number;
  /** Conflict count */
  conflictCount: number;
  /** Last sync time */
  lastSyncAt?: Date;
  /** Last sync result */
  lastSyncResult?: SyncResult;
  /** Next sync time */
  nextSyncAt?: Date;
}

// ============================================================================
// EventType
// ============================================================================

/**
 * Sync Event Type
 */
export type SyncEventType =
  | 'sync:start'
  | 'sync:progress'
  | 'sync:complete'
  | 'sync:error'
  | 'sync:conflict'
  | 'change:created'
  | 'change:synced'
  | 'change:failed';

/**
 * Sync Event
 */
export interface SyncEvent<T = unknown> {
  type: SyncEventType;
  timestamp: Date;
 data?: T;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate Change ID
 */
export function generateChangeId(): string {
  return `change_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Generate Device ID
 */
export function generateDeviceId(): string {
 const stored = typeof localStorage !== 'undefined' 
 ? localStorage.getItem('agentflow_device_id') 
 : null;
 
 if (stored) return stored;
 
 const deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
 
 if (typeof localStorage !== 'undefined') {
 localStorage.setItem('agentflow_device_id', deviceId);
 }
 
 return deviceId;
}

/**
 * Calculate Data Checksum
 */
export async function calculateChecksum(data: unknown): Promise<string> {
 const text = JSON.stringify(data);
 const encoder = new TextEncoder();
 const dataBuffer = encoder.encode(text);
 
 const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
 const hashArray = Array.from(new Uint8Array(hashBuffer));
 
 return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compare Timestamps, Return the Newer One
 */
export function compareTimestamps(a: Date, b: Date): 'a' | 'b' | 'equal' {
 const timeA = new Date(a).getTime();
 const timeB = new Date(b).getTime();
 
 if (timeA > timeB) return 'a';
 if (timeB > timeA) return 'b';
 return 'equal';
}

/**
 * Check if Change Should be Excluded
 */
export function shouldExclude(entityType: string, excludePatterns: string[]): boolean {
 return excludePatterns.some(pattern => {
 if (pattern.includes('*')) {
 const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
 return regex.test(entityType);
 }
 return entityType === pattern;
 });
}
