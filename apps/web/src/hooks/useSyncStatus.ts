/**
 * 同步状态 Hook
 * @description 管理数据同步状态的 React Hook
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getApiBaseUrl } from "@/lib/env";
import { getStoredTokens } from "@/lib/api/shared";
import type {
  SyncConfig,
  SyncResult,
  SyncEngineState,
  Conflict,
  ChangeRecord,
  EntityType,
  OperationType,
} from '@/lib/sync';

/**
 * Hook 返回类型
 */
export interface UseSyncStatusReturn {
  /** 同步引擎状态 */
  state: SyncEngineState;
  /** 是否正在同步 */
  isSyncing: boolean;
  /** 是否已启用同步 */
  isEnabled: boolean;
  /** 是否在线 */
  isOnline: boolean;
  /** 待同步数量 */
  pendingCount: number;
  /** 冲突列表 */
  conflicts: Conflict[];
  /** 上次同步结果 */
  lastSyncResult: SyncResult | null;
  /** 上次同步时间 */
  lastSyncAt: Date | null;
  /** 触发同步 */
  sync: () => Promise<SyncResult>;
  /** 启动自动同步 */
  startAutoSync: () => void;
  /** 停止自动同步 */
  stopAutoSync: () => void;
  /** 记录变更 */
  recordChange: <T>(
    entityType: EntityType,
    entityId: string,
    operation: OperationType,
    data: T
  ) => Promise<void>;
  /** 解决冲突 */
  resolveConflict: (index: number, resolution: 'local' | 'cloud') => Promise<void>;
  /** 更新配置 */
  updateConfig: (config: Partial<SyncConfig>) => void;
}

/**
 * Hook 配置选项
 */
interface UseSyncStatusOptions {
  /** 是否自动启动同步 */
  autoStart?: boolean;
  /** 初始配置 */
  config?: Partial<SyncConfig>;
  /** 同步完成回调 */
  onSyncComplete?: (result: SyncResult) => void;
  /** 冲突回调 */
  onConflict?: (conflicts: Conflict[]) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

/**
 * 本地存储实现 (使用 localStorage 作为简单实现，可升级为 IndexedDB)
 * TODO: 升级为 IndexedDB 以支持大量数据和更好的离线支持
 */
function createLocalStorage() {
  const STORAGE_KEY = 'agentflow_sync_changes';
  const LAST_SYNC_KEY = 'agentflow_last_sync';

  // 从 localStorage 获取变更列表
  const getStoredChanges = (): ChangeRecord[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // 保存变更列表到 localStorage
  const saveStoredChanges = (changes: ChangeRecord[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(changes));
    } catch (err) {
      console.error('保存同步变更失败:', err);
    }
  };

  return {
    async getChanges() {
      return getStoredChanges();
    },
    async getPendingChanges() {
      return getStoredChanges().filter((c) => c.syncStatus === 'pending');
    },
    async saveChange(change: ChangeRecord) {
      const changes = getStoredChanges();
      changes.push(change);
      saveStoredChanges(changes);
    },
    async updateChangeStatus(id: string, status: ChangeRecord['syncStatus']) {
      const changes = getStoredChanges();
      const change = changes.find((c) => c.id === id);
      if (change) {
        change.syncStatus = status;
        saveStoredChanges(changes);
      }
    },
    async deleteChange(id: string) {
      const changes = getStoredChanges();
      const index = changes.findIndex((c) => c.id === id);
      if (index !== -1) {
        changes.splice(index, 1);
        saveStoredChanges(changes);
      }
    },
    async getLastSyncTime(): Promise<Date | null> {
      if (typeof window === 'undefined') return null;
      try {
        const stored = localStorage.getItem(LAST_SYNC_KEY);
        return stored ? new Date(stored) : null;
      } catch {
        return null;
      }
    },
    async setLastSyncTime(time: Date) {
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem(LAST_SYNC_KEY, time.toISOString());
      } catch (err) {
        console.error('保存同步时间失败:', err);
      }
    },
    async applyChange(_change: ChangeRecord) {
      // 变更会通过正常的 API 调用应用，这里不需要额外操作
    },
    async clearAll() {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LAST_SYNC_KEY);
    },
  };
}

/**
 * 云端 API 实现
 * 通过现有的 workflowApi 等接口进行同步操作
 */
function createCloudApi() {
  const API_BASE_URL = getApiBaseUrl();

  return {
    async getChangesSince(_since: Date | null): Promise<ChangeRecord[]> {
      // 获取云端变更
      // 当前实现：返回空数组，因为主要数据通过各自的 API 获取
      // TODO: 实现增量同步端点
      return [];
    },
    async pushChanges(changes: ChangeRecord[]) {
      const token = getStoredTokens()?.accessToken;
      if (!token) {
        return {
          successful: [],
          failed: changes.map((c) => c.id),
        };
      }

      const successful: string[] = [];
      const failed: string[] = [];

      for (const change of changes) {
        try {
          // 根据实体类型和操作类型调用对应的 API
          const endpoint = getEndpointForChange(change);
          const method = getMethodForOperation(change.operation);
          
          if (!endpoint) {
            successful.push(change.id); // 无需同步的变更视为成功
            continue;
          }

          const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: method !== 'DELETE' ? JSON.stringify(change.data) : undefined,
          });

          if (response.ok) {
            successful.push(change.id);
          } else {
            failed.push(change.id);
          }
        } catch {
          failed.push(change.id);
        }
      }

      return { successful, failed };
    },
    async isOnline() {
      return typeof navigator !== 'undefined' ? navigator.onLine : true;
    },
  };
}

/**
 * 根据变更获取 API 端点
 */
function getEndpointForChange(change: ChangeRecord): string | null {
  switch (change.entityType) {
    case 'workflow':
      if (change.operation === 'create') return '/workflows';
      return `/workflows/${change.entityId}`;
    case 'folder':
      if (change.operation === 'create') return '/folders';
      return `/folders/${change.entityId}`;
    case 'execution':
      // 执行记录通常不需要客户端推送
      return null;
    default:
      return null;
  }
}

/**
 * 根据操作类型获取 HTTP 方法
 */
function getMethodForOperation(operation: OperationType): string {
  switch (operation) {
    case 'create':
      return 'POST';
    case 'update':
      return 'PUT';
    case 'delete':
      return 'DELETE';
    default:
      return 'POST';
  }
}

/**
 * 同步状态 Hook
 */
export function useSyncStatus(
  options: UseSyncStatusOptions = {}
): UseSyncStatusReturn {
  const {
    autoStart = false,
    config: initialConfig,
    onSyncComplete,
    onConflict,
    onError,
  } = options;

  // 状态
  const [state, setState] = useState<SyncEngineState>({
    isSyncing: false,
    isEnabled: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    conflictCount: 0,
  });

  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  // 配置
  const [config, setConfig] = useState<Partial<SyncConfig>>(initialConfig || {});

  // 同步引擎引用（延迟初始化）
  const engineRef = useRef<{
    localStorage: ReturnType<typeof createLocalStorage>;
    cloudApi: ReturnType<typeof createCloudApi>;
    autoSyncInterval: ReturnType<typeof setInterval> | null;
  } | null>(null);

  // 初始化
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = {
        localStorage: createLocalStorage(),
        cloudApi: createCloudApi(),
        autoSyncInterval: null,
      };
    }

    // 监听在线状态
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
      // 清理自动同步
      if (engineRef.current?.autoSyncInterval) {
        clearInterval(engineRef.current.autoSyncInterval);
      }
    };
  }, []);

  // 自动启动
  useEffect(() => {
    if (autoStart && engineRef.current) {
      startAutoSync();
    }
  }, [autoStart]);

  /**
   * 执行同步
   */
  const sync = useCallback(async (): Promise<SyncResult> => {
    if (!engineRef.current) {
      return { status: 'failed', error: 'Engine not initialized' };
    }

    if (state.isSyncing) {
      return { status: 'skipped', reason: 'Sync in progress' };
    }

    if (!state.isOnline) {
      return { status: 'skipped', reason: 'Offline' };
    }

    setState((prev) => ({ ...prev, isSyncing: true }));

    try {
      const startTime = Date.now();
      const { localStorage, cloudApi } = engineRef.current;

      // 获取待同步变更
      const pendingChanges = await localStorage.getPendingChanges();
      
      // 推送变更
      const result = await cloudApi.pushChanges(pendingChanges);

      // 更新状态
      for (const id of result.successful) {
        await localStorage.updateChangeStatus(id, 'synced');
      }

      const syncResult: SyncResult = {
        status: result.failed.length > 0 ? 'partial' : 'success',
        uploaded: result.successful.length,
        downloaded: 0,
        conflicts: 0,
        errors: result.failed,
        syncedAt: new Date(),
        duration: Date.now() - startTime,
      };

      setLastSyncResult(syncResult);
      setLastSyncAt(new Date());
      await localStorage.setLastSyncTime(new Date());

      // 更新待同步数量
      const newPendingChanges = await localStorage.getPendingChanges();
      setState((prev) => ({
        ...prev,
        pendingCount: newPendingChanges.length,
        lastSyncAt: new Date(),
      }));

      onSyncComplete?.(syncResult);
      return syncResult;

    } catch (error) {
      const syncResult: SyncResult = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      setLastSyncResult(syncResult);
      onError?.(error instanceof Error ? error : new Error('Sync failed'));
      return syncResult;

    } finally {
      setState((prev) => ({ ...prev, isSyncing: false }));
    }
  }, [state.isSyncing, state.isOnline, onSyncComplete, onError]);

  /**
   * 启动自动同步
   */
  const startAutoSync = useCallback(() => {
    if (!engineRef.current) return;
    if (engineRef.current.autoSyncInterval) return;

    const interval = config.interval || 60000;
    engineRef.current.autoSyncInterval = setInterval(() => {
      sync();
    }, interval);

    setState((prev) => ({ ...prev, isEnabled: true }));

    // 立即执行一次
    sync();
  }, [config.interval, sync]);

  /**
   * 停止自动同步
   */
  const stopAutoSync = useCallback(() => {
    if (!engineRef.current) return;
    if (engineRef.current.autoSyncInterval) {
      clearInterval(engineRef.current.autoSyncInterval);
      engineRef.current.autoSyncInterval = null;
    }
    setState((prev) => ({ ...prev, isEnabled: false }));
  }, []);

  /**
   * 记录变更
   */
  const recordChange = useCallback(
    async <T>(
      entityType: EntityType,
      entityId: string,
      operation: OperationType,
      data: T
    ): Promise<void> => {
      if (!engineRef.current) return;

      const { localStorage } = engineRef.current;
      
      const change: ChangeRecord<T> = {
        id: `change_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        entityType,
        entityId,
        operation,
        data,
        timestamp: new Date(),
        syncStatus: 'pending',
        version: 1,
      };

      await localStorage.saveChange(change);

      // 更新待同步数量
      const pendingChanges = await localStorage.getPendingChanges();
      setState((prev) => ({ ...prev, pendingCount: pendingChanges.length }));
    },
    []
  );

  /**
   * 解决冲突
   */
  const resolveConflict = useCallback(
    async (index: number, resolution: 'local' | 'cloud'): Promise<void> => {
      if (!engineRef.current) return;

      const conflict = conflicts[index];
      if (!conflict) return;

      const { localStorage } = engineRef.current;
      const chosen = resolution === 'local' ? conflict.local : conflict.cloud;
      await localStorage.applyChange(chosen);

      setConflicts((prev) => {
        const next = [...prev];
        next.splice(index, 1);
        return next;
      });

      setState((prev) => ({ ...prev, conflictCount: prev.conflictCount - 1 }));
    },
    [conflicts]
  );

  /**
   * 更新配置
   */
  const updateConfig = useCallback((newConfig: Partial<SyncConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));

    // 如果正在自动同步且间隔改变，重启
    if (engineRef.current?.autoSyncInterval && newConfig.interval) {
      stopAutoSync();
      startAutoSync();
    }
  }, [stopAutoSync, startAutoSync]);

  return {
    state,
    isSyncing: state.isSyncing,
    isEnabled: state.isEnabled,
    isOnline: state.isOnline,
    pendingCount: state.pendingCount,
    conflicts,
    lastSyncResult,
    lastSyncAt,
    sync,
    startAutoSync,
    stopAutoSync,
    recordChange,
    resolveConflict,
    updateConfig,
  };
}

export default useSyncStatus;
