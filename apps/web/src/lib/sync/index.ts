/**
 * 数据同步模块导出
 */

// 类型导出
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
} from './types';

// 常量和工具函数导出
export {
  DEFAULT_SYNC_CONFIG,
  generateChangeId,
  generateDeviceId,
  calculateChecksum,
  compareTimestamps,
  shouldExclude,
} from './types';

// 同步引擎导出
export type { LocalStorage, CloudApi } from './sync-engine';
export { SyncEngine, createSyncEngine } from './sync-engine';

// 加密模块导出
export type { EncryptedData, EncryptionConfig } from './encryption';
export {
  E2EEncryption,
  createEncryption,
  getDefaultEncryption,
  simpleHash,
} from './encryption';
