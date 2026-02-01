/**
 * 数据同步类型定义
 * @description 本地/云端数据同步相关类型
 */

// ============================================================================
// 同步配置
// ============================================================================

/**
 * 冲突解决策略
 */
export type ConflictResolutionStrategy = 'local' | 'cloud' | 'latest' | 'manual';

/**
 * 同步配置
 */
export interface SyncConfig {
  /** 自动同步间隔 (毫秒) */
  interval: number;
  /** 冲突解决策略 */
  conflictResolution: ConflictResolutionStrategy;
  /** 排除的数据类型 */
  excludePatterns: string[];
  /** 同步前加密 */
  encryptBeforeSync: boolean;
  /** 最大重试次数 */
  maxRetries: number;
  /** 批量大小 */
  batchSize: number;
  /** 是否启用自动同步 */
  autoSync: boolean;
  /** 云端 API 地址 */
  cloudApiUrl?: string;
}

/**
 * 默认同步配置
 */
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  interval: 60000, // 1分钟
  conflictResolution: 'latest',
  excludePatterns: ['api_keys', 'secrets', 'tokens'],
  encryptBeforeSync: true,
  maxRetries: 3,
  batchSize: 50,
  autoSync: true,
};

// ============================================================================
// 变更记录
// ============================================================================

/**
 * 实体类型
 */
export type EntityType = 'workflow' | 'execution' | 'settings' | 'agent' | 'template';

/**
 * 操作类型
 */
export type OperationType = 'create' | 'update' | 'delete';

/**
 * 同步状态
 */
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';

/**
 * 变更记录
 */
export interface ChangeRecord<T = unknown> {
  /** 变更 ID */
  id: string;
  /** 实体类型 */
  entityType: EntityType;
  /** 实体 ID */
  entityId: string;
  /** 操作类型 */
  operation: OperationType;
  /** 变更数据 */
  data: T;
  /** 时间戳 */
  timestamp: Date;
  /** 同步状态 */
  syncStatus: SyncStatus;
  /** 版本号 */
  version: number;
  /** 校验和 */
  checksum?: string;
  /** 设备 ID */
  deviceId?: string;
}

// ============================================================================
// 冲突处理
// ============================================================================

/**
 * 冲突信息
 */
export interface Conflict<T = unknown> {
  /** 本地变更 */
  local: ChangeRecord<T>;
  /** 云端变更 */
  cloud: ChangeRecord<T>;
}

/**
 * 已解决的冲突
 */
export interface ResolvedConflict<T = unknown> extends Conflict<T> {
  /** 解决方案 */
  resolution: 'local' | 'cloud';
  /** 解决时间 */
  resolvedAt: Date;
}

/**
 * 冲突检测结果
 */
export interface ConflictDetectionResult<T = unknown> {
  /** 冲突列表 */
  conflicts: Conflict<T>[];
  /** 仅本地有的变更 */
  localOnly: ChangeRecord<T>[];
  /** 仅云端有的变更 */
  cloudOnly: ChangeRecord<T>[];
}

// ============================================================================
// 同步结果
// ============================================================================

/**
 * 同步错误
 */
export interface SyncError {
  /** 变更 ID 列表 */
  changeIds: string[];
  /** 错误信息 */
  error: string;
  /** 错误代码 */
  code?: string;
}

/**
 * 上传结果
 */
export interface UploadResult {
  /** 成功的变更 ID */
  successful: string[];
  /** 失败的变更 */
  failed: SyncError[];
}

/**
 * 下载结果
 */
export interface DownloadResult {
  /** 成功的变更 ID */
  successful: string[];
  /** 失败的变更 */
  failed: SyncError[];
}

/**
 * 同步结果状态
 */
export type SyncResultStatus = 'success' | 'partial' | 'failed' | 'skipped';

/**
 * 同步结果
 */
export interface SyncResult {
  /** 状态 */
  status: SyncResultStatus;
  /** 上传数量 */
  uploaded?: number;
  /** 下载数量 */
  downloaded?: number;
  /** 冲突数量 */
  conflicts?: number;
  /** 错误列表 */
  errors?: SyncError[];
  /** 跳过原因 */
  reason?: string;
  /** 错误信息 */
  error?: string;
  /** 同步时间 */
  syncedAt?: Date;
  /** 耗时 (ms) */
  duration?: number;
}

// ============================================================================
// 同步状态
// ============================================================================

/**
 * 同步引擎状态
 */
export interface SyncEngineState {
  /** 是否正在同步 */
  isSyncing: boolean;
  /** 是否已启用 */
  isEnabled: boolean;
  /** 是否在线 */
  isOnline: boolean;
  /** 待同步数量 */
  pendingCount: number;
  /** 冲突数量 */
  conflictCount: number;
  /** 上次同步时间 */
  lastSyncAt?: Date;
  /** 上次同步结果 */
  lastSyncResult?: SyncResult;
  /** 下次同步时间 */
  nextSyncAt?: Date;
}

// ============================================================================
// 事件类型
// ============================================================================

/**
 * 同步事件类型
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
 * 同步事件
 */
export interface SyncEvent<T = unknown> {
  type: SyncEventType;
  timestamp: Date;
  data?: T;
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 生成变更 ID
 */
export function generateChangeId(): string {
  return `change_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 生成设备 ID
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
 * 计算数据校验和
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
 * 比较时间戳，返回较新的
 */
export function compareTimestamps(a: Date, b: Date): 'a' | 'b' | 'equal' {
  const timeA = new Date(a).getTime();
  const timeB = new Date(b).getTime();
  
  if (timeA > timeB) return 'a';
  if (timeB > timeA) return 'b';
  return 'equal';
}

/**
 * 检查变更是否应该排除
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
