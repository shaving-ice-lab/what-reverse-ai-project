/**
 * 离线模块导出
 */

// 类型导出
export type {
  NetworkStatus,
  NetworkQuality,
  ConnectionInfo,
  OfflineOperationType,
  OfflineOperationStatus,
  OfflineOperation,
  OfflineQueueConfig,
  OfflineQueueState,
  OfflineStorageItem,
  CacheStrategy,
  CacheConfig,
  OfflineCapabilities,
  OfflineEventType,
  OfflineEvent,
} from './types';

// 常量和工具函数导出
export {
  DEFAULT_OFFLINE_CAPABILITIES,
  generateOfflineId,
  isOperationExpired,
  sortOperations,
} from './types';

// 离线队列导出
export {
  OfflineQueue,
  createOfflineQueue,
  getDefaultOfflineQueue,
} from './offline-queue';
