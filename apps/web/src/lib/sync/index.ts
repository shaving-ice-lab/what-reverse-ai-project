/**
 * DataSyncModuleExport
 */

// TypeExport
export type {
  ConflictResolutionStrategy,
  SyncConfig,
  EntityType,
  OperationType,
  SyncStatus,
  ChangeRecord,
  Conflict,
  ResolvedConflict,
  ConflictDetectionResult,
  SyncError,
  UploadResult,
  DownloadResult,
  SyncResultStatus,
  SyncResult,
  SyncEngineState,
  SyncEventType,
  SyncEvent,
} from './types'

// ConstantandToolcountExport
export {
  DEFAULT_SYNC_CONFIG,
  generateChangeId,
  generateDeviceId,
  calculateChecksum,
  compareTimestamps,
  shouldExclude,
} from './types'

// SyncEngineExport
export type { LocalStorage, CloudApi } from './sync-engine'
export { SyncEngine, createSyncEngine } from './sync-engine'

// EncryptModuleExport
export type { EncryptedData, EncryptionConfig } from './encryption'
export { E2EEncryption, createEncryption, getDefaultEncryption, simpleHash } from './encryption'
