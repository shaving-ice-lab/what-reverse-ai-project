/**
 * DataSyncTypeDefinition
 * @description Local/CloudDataSyncRelatedType
 */

// ============================================================================
// SyncConfig
// ============================================================================

/**
 * ConflictResolvePolicy
 */
export type ConflictResolutionStrategy = 'local' | 'cloud' | 'latest' | 'manual';

/**
 * SyncConfig
 */
export interface SyncConfig {
 /** AutoSyncbetween (s) */
 interval: number;
 /** ConflictResolvePolicy */
 conflictResolution: ConflictResolutionStrategy;
 /** Exclude'sDataType */
 excludePatterns: string[];
 /** SyncbeforeEncrypt */
 encryptBeforeSync: boolean;
 /** MaximumRetrytimescount */
 maxRetries: number;
 /** BatchSize */
 batchSize: number;
 /** isnoEnableAutoSync */
 autoSync: boolean;
 /** Cloud API Address */
 cloudApiUrl?: string;
}

/**
 * DefaultSyncConfig
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
// Change Log
// ============================================================================

/**
 * EntityType
 */
export type EntityType = 'workflow' | 'execution' | 'settings' | 'agent' | 'template';

/**
 * ActionType
 */
export type OperationType = 'create' | 'update' | 'delete';

/**
 * SyncStatus
 */
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';

/**
 * Change Log
 */
export interface ChangeRecord<T = unknown> {
 /** Change ID */
 id: string;
 /** EntityType */
 entityType: EntityType;
 /** Entity ID */
 entityId: string;
 /** ActionType */
 operation: OperationType;
 /** ChangeData */
 data: T;
 /** Time */
 timestamp: Date;
 /** SyncStatus */
 syncStatus: SyncStatus;
 /** Version Number */
 version: number;
 /** Validateand */
 checksum?: string;
 /** Device ID */
 deviceId?: string;
}

// ============================================================================
// ConflictProcess
// ============================================================================

/**
 * ConflictInfo
 */
export interface Conflict<T = unknown> {
 /** LocalChange */
 local: ChangeRecord<T>;
 /** CloudChange */
 cloud: ChangeRecord<T>;
}

/**
 * alreadyResolve'sConflict
 */
export interface ResolvedConflict<T = unknown> extends Conflict<T> {
 /** ResolvePlan */
 resolution: 'local' | 'cloud';
 /** ResolveTime */
 resolvedAt: Date;
}

/**
 * ConflictDetectResult
 */
export interface ConflictDetectionResult<T = unknown> {
 /** ConflictList */
 conflicts: Conflict<T>[];
 /** onlyLocalhas'sChange */
 localOnly: ChangeRecord<T>[];
 /** onlyCloudhas'sChange */
 cloudOnly: ChangeRecord<T>[];
}

// ============================================================================
// SyncResult
// ============================================================================

/**
 * SyncError
 */
export interface SyncError {
 /** Change ID List */
 changeIds: string[];
 /** ErrorInfo */
 error: string;
 /** ErrorCode */
 code?: string;
}

/**
 * UploadResult
 */
export interface UploadResult {
 /** Success'sChange ID */
 successful: string[];
 /** Failed'sChange */
 failed: SyncError[];
}

/**
 * DownloadResult
 */
export interface DownloadResult {
 /** Success'sChange ID */
 successful: string[];
 /** Failed'sChange */
 failed: SyncError[];
}

/**
 * SyncResultStatus
 */
export type SyncResultStatus = 'success' | 'partial' | 'failed' | 'skipped';

/**
 * SyncResult
 */
export interface SyncResult {
 /** Status */
 status: SyncResultStatus;
 /** UploadCount */
 uploaded?: number;
 /** DownloadCount */
 downloaded?: number;
 /** ConflictCount */
 conflicts?: number;
 /** ErrorList */
 errors?: SyncError[];
 /** SkipReason */
 reason?: string;
 /** ErrorInfo */
 error?: string;
 /** SyncTime */
 syncedAt?: Date;
 /** Duration (ms) */
 duration?: number;
}

// ============================================================================
// SyncStatus
// ============================================================================

/**
 * SyncEngineStatus
 */
export interface SyncEngineState {
 /** isnoSyncing */
 isSyncing: boolean;
 /** isnoEnabled */
 isEnabled: boolean;
 /** isnoOnline */
 isOnline: boolean;
 /** pendingSyncCount */
 pendingCount: number;
 /** ConflictCount */
 conflictCount: number;
 /** ontimesSyncTime */
 lastSyncAt?: Date;
 /** ontimesSyncResult */
 lastSyncResult?: SyncResult;
 /** downtimesSyncTime */
 nextSyncAt?: Date;
}

// ============================================================================
// EventType
// ============================================================================

/**
 * SyncEventType
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
 * SyncEvent
 */
export interface SyncEvent<T = unknown> {
 type: SyncEventType;
 timestamp: Date;
 data?: T;
}

// ============================================================================
// Toolcount
// ============================================================================

/**
 * GenerateChange ID
 */
export function generateChangeId(): string {
 return `change_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * GenerateDevice ID
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
 * CalculateDataValidateand
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
 * CompareTime, Backnew's
 */
export function compareTimestamps(a: Date, b: Date): 'a' | 'b' | 'equal' {
 const timeA = new Date(a).getTime();
 const timeB = new Date(b).getTime();
 
 if (timeA > timeB) return 'a';
 if (timeB > timeA) return 'b';
 return 'equal';
}

/**
 * CheckChangeisnoShouldExclude
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
