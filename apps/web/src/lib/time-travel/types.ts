/**
 * 时间旅行调试 - 内部类型定义
 */

import type { 
  ExecutionSnapshot, 
  NodeSnapshot, 
  SnapshotStorageOptions,
  SnapshotQueryParams,
  SnapshotListItem,
} from "@/types/time-travel";

/**
 * 快照存储接口
 */
export interface ISnapshotStore {
  /**
   * 保存执行快照
   */
  saveSnapshot(snapshot: ExecutionSnapshot): Promise<void>;
  
  /**
   * 获取执行快照
   */
  getSnapshot(executionId: string): Promise<ExecutionSnapshot | null>;
  
  /**
   * 删除执行快照
   */
  deleteSnapshot(executionId: string): Promise<void>;
  
  /**
   * 查询快照列表
   */
  querySnapshots(params?: SnapshotQueryParams): Promise<SnapshotListItem[]>;
  
  /**
   * 获取快照数量
   */
  getSnapshotCount(workflowId?: string): Promise<number>;
  
  /**
   * 清理过期快照
   */
  cleanupSnapshots(options?: SnapshotStorageOptions): Promise<number>;
  
  /**
   * 更新节点快照
   */
  updateNodeSnapshot(
    executionId: string, 
    nodeId: string, 
    nodeSnapshot: NodeSnapshot
  ): Promise<void>;
  
  /**
   * 导出快照为 JSON
   */
  exportSnapshot(executionId: string): Promise<string>;
  
  /**
   * 导入快照
   */
  importSnapshot(jsonData: string): Promise<ExecutionSnapshot>;
}

/**
 * 存储后端类型
 */
export type StorageBackend = "indexeddb" | "localstorage" | "tauri" | "memory";

/**
 * 快照存储配置
 */
export interface SnapshotStoreConfig {
  /** 存储后端 */
  backend: StorageBackend;
  /** 数据库名称 (IndexedDB) */
  dbName?: string;
  /** 表名称 */
  storeName?: string;
  /** 默认存储选项 */
  defaultOptions?: SnapshotStorageOptions;
  /** 是否启用调试日志 */
  debug?: boolean;
}

/**
 * 默认配置
 */
export const DEFAULT_STORE_CONFIG: SnapshotStoreConfig = {
  backend: "indexeddb",
  dbName: "agentflow-time-travel",
  storeName: "snapshots",
  defaultOptions: {
    compress: true,
    compressionLevel: 6,
    maxSnapshots: 100,
    maxAgeDays: 30,
    excludeSensitiveData: false,
  },
  debug: false,
};

/**
 * IndexedDB 数据库版本
 */
export const DB_VERSION = 1;

/**
 * 快照存储事件
 */
export type SnapshotStoreEvent = 
  | { type: "snapshot:saved"; executionId: string }
  | { type: "snapshot:deleted"; executionId: string }
  | { type: "snapshot:updated"; executionId: string; nodeId: string }
  | { type: "snapshots:cleaned"; count: number }
  | { type: "error"; error: Error };

/**
 * 快照存储事件监听器
 */
export type SnapshotStoreEventListener = (event: SnapshotStoreEvent) => void;
