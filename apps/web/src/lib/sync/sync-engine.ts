/**
 * 数据同步引擎
 * @description 管理本地与云端数据的同步
 */

import type {
  SyncConfig,
  ChangeRecord,
  SyncResult,
  SyncEngineState,
  SyncEventType,
  Conflict,
  ResolvedConflict,
  ConflictDetectionResult,
  UploadResult,
  DownloadResult,
  SyncError,
  EntityType,
  OperationType,
} from './types';
import {
  DEFAULT_SYNC_CONFIG,
  generateChangeId,
  generateDeviceId,
  calculateChecksum,
  compareTimestamps,
  shouldExclude,
} from './types';

/**
 * 事件监听器类型
 */
type EventListener = (event: { type: SyncEventType; data?: unknown }) => void;

/**
 * 本地存储接口
 */
export interface LocalStorage {
  getChanges(): Promise<ChangeRecord[]>;
  getPendingChanges(): Promise<ChangeRecord[]>;
  saveChange(change: ChangeRecord): Promise<void>;
  updateChangeStatus(id: string, status: ChangeRecord['syncStatus']): Promise<void>;
  deleteChange(id: string): Promise<void>;
  getLastSyncTime(): Promise<Date | null>;
  setLastSyncTime(time: Date): Promise<void>;
  applyChange(change: ChangeRecord): Promise<void>;
}

/**
 * 云端 API 接口
 */
export interface CloudApi {
  getChangesSince(since: Date | null): Promise<ChangeRecord[]>;
  pushChanges(changes: ChangeRecord[]): Promise<{ successful: string[]; failed: SyncError[] }>;
  isOnline(): Promise<boolean>;
}

/**
 * 同步引擎
 */
export class SyncEngine {
  private config: SyncConfig;
  private localStorage: LocalStorage;
  private cloudApi: CloudApi;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;
  private listeners: Map<SyncEventType, Set<EventListener>> = new Map();
  private deviceId: string;
  private pendingChanges: ChangeRecord[] = [];
  private conflictQueue: Conflict[] = [];

  constructor(
    localStorage: LocalStorage,
    cloudApi: CloudApi,
    config: Partial<SyncConfig> = {}
  ) {
    this.localStorage = localStorage;
    this.cloudApi = cloudApi;
    this.config = { ...DEFAULT_SYNC_CONFIG, ...config };
    this.deviceId = generateDeviceId();
  }

  /**
   * 获取当前状态
   */
  async getState(): Promise<SyncEngineState> {
    const pendingChanges = await this.localStorage.getPendingChanges();
    const lastSyncTime = await this.localStorage.getLastSyncTime();
    const isOnline = await this.cloudApi.isOnline();

    return {
      isSyncing: this.isSyncing,
      isEnabled: this.config.autoSync,
      isOnline,
      pendingCount: pendingChanges.length,
      conflictCount: this.conflictQueue.length,
      lastSyncAt: lastSyncTime || undefined,
      nextSyncAt: this.syncInterval 
        ? new Date(Date.now() + this.config.interval) 
        : undefined,
    };
  }

  /**
   * 启动自动同步
   */
  startAutoSync(): void {
    if (this.syncInterval) return;

    this.config.autoSync = true;
    this.syncInterval = setInterval(() => {
      this.sync().catch(console.error);
    }, this.config.interval);

    // 立即执行一次同步
    this.sync().catch(console.error);
  }

  /**
   * 停止自动同步
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.config.autoSync = false;
  }

  /**
   * 记录变更
   */
  async recordChange<T>(
    entityType: EntityType,
    entityId: string,
    operation: OperationType,
    data: T
  ): Promise<ChangeRecord<T>> {
    // 检查是否应该排除
    if (shouldExclude(entityType, this.config.excludePatterns)) {
      throw new Error(`Entity type '${entityType}' is excluded from sync`);
    }

    const checksum = await calculateChecksum(data);

    const change: ChangeRecord<T> = {
      id: generateChangeId(),
      entityType,
      entityId,
      operation,
      data,
      timestamp: new Date(),
      syncStatus: 'pending',
      version: 1,
      checksum,
      deviceId: this.deviceId,
    };

    await this.localStorage.saveChange(change);
    this.emit('change:created', change);

    return change;
  }

  /**
   * 执行同步
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { status: 'skipped', reason: 'Sync already in progress' };
    }

    // 检查是否在线
    const isOnline = await this.cloudApi.isOnline();
    if (!isOnline) {
      return { status: 'skipped', reason: 'Offline' };
    }

    this.isSyncing = true;
    const startTime = Date.now();
    this.emit('sync:start');

    try {
      // 1. 获取本地待同步的变更
      const localChanges = await this.localStorage.getPendingChanges();

      // 2. 获取云端的变更
      const lastSyncTime = await this.localStorage.getLastSyncTime();
      const cloudChanges = await this.cloudApi.getChangesSince(lastSyncTime);

      // 3. 检测冲突
      const { conflicts, localOnly, cloudOnly } = this.detectConflicts(
        localChanges,
        cloudChanges
      );

      // 4. 解决冲突
      const resolvedConflicts = await this.resolveConflicts(conflicts);

      // 5. 上传本地变更
      const changesToUpload = [
        ...localOnly,
        ...resolvedConflicts
          .filter((c) => c.resolution === 'local')
          .map((c) => c.local),
      ];
      const uploadResults = await this.uploadChanges(changesToUpload);

      // 6. 下载云端变更
      const changesToDownload = [
        ...cloudOnly,
        ...resolvedConflicts
          .filter((c) => c.resolution === 'cloud')
          .map((c) => c.cloud),
      ];
      const downloadResults = await this.downloadChanges(changesToDownload);

      // 7. 更新同步时间
      await this.localStorage.setLastSyncTime(new Date());

      // 8. 标记已同步的变更
      for (const id of uploadResults.successful) {
        await this.localStorage.updateChangeStatus(id, 'synced');
        this.emit('change:synced', { id });
      }

      const result: SyncResult = {
        status: uploadResults.failed.length > 0 || downloadResults.failed.length > 0 
          ? 'partial' 
          : 'success',
        uploaded: uploadResults.successful.length,
        downloaded: downloadResults.successful.length,
        conflicts: conflicts.length,
        errors: [...uploadResults.failed, ...downloadResults.failed],
        syncedAt: new Date(),
        duration: Date.now() - startTime,
      };

      this.emit('sync:complete', result);
      return result;

    } catch (error) {
      const result: SyncResult = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
      this.emit('sync:error', { error });
      return result;

    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 检测冲突
   */
  private detectConflicts(
    localChanges: ChangeRecord[],
    cloudChanges: ChangeRecord[]
  ): ConflictDetectionResult {
    const conflicts: Conflict[] = [];
    const localOnly: ChangeRecord[] = [];
    const cloudOnly: ChangeRecord[] = [];

    const cloudMap = new Map(
      cloudChanges.map((c) => [`${c.entityType}:${c.entityId}`, c])
    );

    // 检查本地变更
    for (const local of localChanges) {
      const key = `${local.entityType}:${local.entityId}`;
      const cloud = cloudMap.get(key);

      if (cloud) {
        // 同一实体在两端都有变更 -> 冲突
        conflicts.push({ local, cloud });
        cloudMap.delete(key);
      } else {
        localOnly.push(local);
      }
    }

    // 剩余的云端变更
    cloudOnly.push(...cloudMap.values());

    // 记录冲突到队列
    this.conflictQueue = conflicts;

    if (conflicts.length > 0) {
      this.emit('sync:conflict', { conflicts });
    }

    return { conflicts, localOnly, cloudOnly };
  }

  /**
   * 解决冲突
   */
  private async resolveConflicts(conflicts: Conflict[]): Promise<ResolvedConflict[]> {
    const resolved: ResolvedConflict[] = [];

    for (const conflict of conflicts) {
      let resolution: 'local' | 'cloud';

      switch (this.config.conflictResolution) {
        case 'local':
          resolution = 'local';
          break;
        case 'cloud':
          resolution = 'cloud';
          break;
        case 'latest':
          const comparison = compareTimestamps(
            conflict.local.timestamp,
            conflict.cloud.timestamp
          );
          resolution = comparison === 'a' ? 'local' : 'cloud';
          break;
        case 'manual':
          // 手动解决时，默认保留本地
          // 实际实现需要 UI 交互
          resolution = 'local';
          break;
        default:
          resolution = 'latest' as never;
      }

      resolved.push({
        ...conflict,
        resolution,
        resolvedAt: new Date(),
      });
    }

    return resolved;
  }

  /**
   * 上传变更
   */
  private async uploadChanges(changes: ChangeRecord[]): Promise<UploadResult> {
    if (changes.length === 0) {
      return { successful: [], failed: [] };
    }

    const successful: string[] = [];
    const failed: SyncError[] = [];

    // 分批上传
    for (let i = 0; i < changes.length; i += this.config.batchSize) {
      const batch = changes.slice(i, i + this.config.batchSize);

      try {
        // 更新状态为同步中
        for (const change of batch) {
          await this.localStorage.updateChangeStatus(change.id, 'syncing');
        }

        const result = await this.cloudApi.pushChanges(batch);
        successful.push(...result.successful);
        failed.push(...result.failed);

        // 标记失败的变更
        for (const error of result.failed) {
          for (const id of error.changeIds) {
            await this.localStorage.updateChangeStatus(id, 'failed');
            this.emit('change:failed', { id, error: error.error });
          }
        }
      } catch (error) {
        failed.push({
          changeIds: batch.map((c) => c.id),
          error: error instanceof Error ? error.message : 'Upload failed',
        });

        // 重置状态为待同步
        for (const change of batch) {
          await this.localStorage.updateChangeStatus(change.id, 'pending');
        }
      }

      // 发送进度事件
      this.emit('sync:progress', {
        uploaded: successful.length,
        total: changes.length,
      });
    }

    return { successful, failed };
  }

  /**
   * 下载变更
   */
  private async downloadChanges(changes: ChangeRecord[]): Promise<DownloadResult> {
    if (changes.length === 0) {
      return { successful: [], failed: [] };
    }

    const successful: string[] = [];
    const failed: SyncError[] = [];

    for (const change of changes) {
      try {
        await this.localStorage.applyChange(change);
        successful.push(change.id);
      } catch (error) {
        failed.push({
          changeIds: [change.id],
          error: error instanceof Error ? error.message : 'Download failed',
        });
      }
    }

    return { successful, failed };
  }

  /**
   * 获取冲突队列
   */
  getConflicts(): Conflict[] {
    return [...this.conflictQueue];
  }

  /**
   * 手动解决冲突
   */
  async resolveConflictManually(
    conflictIndex: number,
    resolution: 'local' | 'cloud'
  ): Promise<void> {
    const conflict = this.conflictQueue[conflictIndex];
    if (!conflict) return;

    const chosen = resolution === 'local' ? conflict.local : conflict.cloud;
    await this.localStorage.applyChange(chosen);

    // 从队列中移除
    this.conflictQueue.splice(conflictIndex, 1);
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SyncConfig>): void {
    const wasAutoSync = this.config.autoSync;
    this.config = { ...this.config, ...config };

    // 如果自动同步状态改变
    if (wasAutoSync && !this.config.autoSync) {
      this.stopAutoSync();
    } else if (!wasAutoSync && this.config.autoSync) {
      this.startAutoSync();
    }

    // 如果间隔改变，重启自动同步
    if (this.syncInterval && config.interval) {
      this.stopAutoSync();
      this.startAutoSync();
    }
  }

  /**
   * 获取配置
   */
  getConfig(): SyncConfig {
    return { ...this.config };
  }

  /**
   * 订阅事件
   */
  on(event: SyncEventType, listener: EventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  /**
   * 触发事件
   */
  private emit(type: SyncEventType, data?: unknown): void {
    const eventListeners = this.listeners.get(type);
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          listener({ type, data });
        } catch (error) {
          console.error('Sync event listener error:', error);
        }
      }
    }
  }

  /**
   * 销毁引擎
   */
  destroy(): void {
    this.stopAutoSync();
    this.listeners.clear();
  }
}

/**
 * 创建同步引擎
 */
export function createSyncEngine(
  localStorage: LocalStorage,
  cloudApi: CloudApi,
  config?: Partial<SyncConfig>
): SyncEngine {
  return new SyncEngine(localStorage, cloudApi, config);
}
