/**
 * 离线模式类型定义
 * @description 离线支持相关的类型定义
 */

// ============================================================================
// 网络状态
// ============================================================================

/**
 * 网络状态类型
 */
export type NetworkStatus = 'online' | 'offline' | 'slow';

/**
 * 网络质量
 */
export interface NetworkQuality {
  /** 连接类型 */
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  /** 往返时间 (ms) */
  rtt: number;
  /** 下行带宽 (Mbps) */
  downlink: number;
  /** 是否启用数据节省模式 */
  saveData: boolean;
}

/**
 * 连接状态信息
 */
export interface ConnectionInfo {
  /** 是否在线 */
  isOnline: boolean;
  /** 网络状态 */
  status: NetworkStatus;
  /** 网络质量 */
  quality?: NetworkQuality;
  /** 上次在线时间 */
  lastOnlineAt?: Date;
  /** 上次离线时间 */
  lastOfflineAt?: Date;
}

// ============================================================================
// 离线队列
// ============================================================================

/**
 * 离线操作类型
 */
export type OfflineOperationType =
  | 'workflow:create'
  | 'workflow:update'
  | 'workflow:delete'
  | 'execution:create'
  | 'settings:update'
  | 'api:request';

/**
 * 离线操作状态
 */
export type OfflineOperationStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * 离线操作项
 */
export interface OfflineOperation<T = unknown> {
  /** 操作 ID */
  id: string;
  /** 操作类型 */
  type: OfflineOperationType;
  /** 操作数据 */
  data: T;
  /** 创建时间 */
  createdAt: Date;
  /** 状态 */
  status: OfflineOperationStatus;
  /** 重试次数 */
  retryCount: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** 错误信息 */
  error?: string;
  /** 优先级 (越小越优先) */
  priority: number;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 离线队列配置
 */
export interface OfflineQueueConfig {
  /** 最大队列长度 */
  maxSize: number;
  /** 默认最大重试次数 */
  defaultMaxRetries: number;
  /** 重试间隔 (ms) */
  retryInterval: number;
  /** 是否启用持久化 */
  persistToStorage: boolean;
  /** 存储键名 */
  storageKey: string;
}

/**
 * 离线队列状态
 */
export interface OfflineQueueState {
  /** 队列长度 */
  length: number;
  /** 待处理数量 */
  pendingCount: number;
  /** 处理中数量 */
  processingCount: number;
  /** 失败数量 */
  failedCount: number;
  /** 是否正在同步 */
  isSyncing: boolean;
}

// ============================================================================
// 离线存储
// ============================================================================

/**
 * 离线存储项
 */
export interface OfflineStorageItem<T = unknown> {
  /** 键名 */
  key: string;
  /** 数据 */
  value: T;
  /** 过期时间 */
  expiresAt?: Date;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 版本 */
  version: number;
}

/**
 * 缓存策略
 */
export type CacheStrategy =
  | 'cache-first'
  | 'network-first'
  | 'stale-while-revalidate'
  | 'network-only'
  | 'cache-only';

/**
 * 缓存配置
 */
export interface CacheConfig {
  /** 缓存策略 */
  strategy: CacheStrategy;
  /** 过期时间 (ms) */
  ttl: number;
  /** 最大缓存条目数 */
  maxEntries: number;
}

// ============================================================================
// 离线功能配置
// ============================================================================

/**
 * 离线功能矩阵
 */
export interface OfflineCapabilities {
  /** 查看工作流 */
  viewWorkflows: boolean;
  /** 编辑工作流 */
  editWorkflows: boolean;
  /** 执行工作流（仅本地 LLM） */
  executeWorkflows: 'full' | 'local-only' | 'disabled';
  /** 查看执行记录 */
  viewExecutions: boolean;
  /** 浏览 Agent 商店 */
  browseStore: 'full' | 'cached' | 'disabled';
  /** 用户设置 */
  userSettings: boolean;
}

/**
 * 默认离线功能配置
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
// 事件类型
// ============================================================================

/**
 * 离线事件类型
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
 * 离线事件
 */
export interface OfflineEvent {
  type: OfflineEventType;
  timestamp: Date;
  data?: unknown;
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 生成离线操作 ID
 */
export function generateOfflineId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 检查操作是否过期
 */
export function isOperationExpired(
  operation: OfflineOperation,
  maxAge: number = 24 * 60 * 60 * 1000 // 默认 24 小时
): boolean {
  const age = Date.now() - new Date(operation.createdAt).getTime();
  return age > maxAge;
}

/**
 * 按优先级和时间排序操作
 */
export function sortOperations(operations: OfflineOperation[]): OfflineOperation[] {
  return [...operations].sort((a, b) => {
    // 先按优先级排序
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // 再按创建时间排序
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}
