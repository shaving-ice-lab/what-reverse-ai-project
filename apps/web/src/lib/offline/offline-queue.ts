/**
 * 离线队列管理
 * @description 管理离线状态下的操作队列，支持持久化和自动同步
 */

import type {
  OfflineOperation,
  OfflineOperationType,
  OfflineOperationStatus,
  OfflineQueueConfig,
  OfflineQueueState,
  OfflineEventType,
} from './types';
import { generateOfflineId, sortOperations, isOperationExpired } from './types';

/**
 * 默认队列配置
 */
const DEFAULT_CONFIG: OfflineQueueConfig = {
  maxSize: 1000,
  defaultMaxRetries: 3,
  retryInterval: 5000,
  persistToStorage: true,
  storageKey: 'agentflow_offline_queue',
};

/**
 * 事件监听器类型
 */
type EventListener = (event: { type: OfflineEventType; data?: unknown }) => void;

/**
 * 离线队列管理器
 */
export class OfflineQueue {
  private config: OfflineQueueConfig;
  private queue: OfflineOperation[];
  private listeners: Map<OfflineEventType, Set<EventListener>>;
  private processingPromise: Promise<void> | null = null;
  private isProcessing = false;

  constructor(config: Partial<OfflineQueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.queue = [];
    this.listeners = new Map();

    // 从存储恢复队列
    if (this.config.persistToStorage) {
      this.loadFromStorage();
    }
  }

  /**
   * 添加操作到队列
   */
  add<T>(
    type: OfflineOperationType,
    data: T,
    options: {
      priority?: number;
      maxRetries?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): OfflineOperation<T> {
    // 检查队列是否已满
    if (this.queue.length >= this.config.maxSize) {
      // 移除最旧的已失败操作
      const failedIndex = this.queue.findIndex((op) => op.status === 'failed');
      if (failedIndex !== -1) {
        this.queue.splice(failedIndex, 1);
      } else {
        throw new Error('离线队列已满');
      }
    }

    const operation: OfflineOperation<T> = {
      id: generateOfflineId(),
      type,
      data,
      createdAt: new Date(),
      status: 'pending',
      retryCount: 0,
      maxRetries: options.maxRetries ?? this.config.defaultMaxRetries,
      priority: options.priority ?? 10,
      metadata: options.metadata,
    };

    this.queue.push(operation);
    this.queue = sortOperations(this.queue);
    this.persist();
    this.emit('queue:add', operation);

    return operation;
  }

  /**
   * 移除操作
   */
  remove(id: string): boolean {
    const index = this.queue.findIndex((op) => op.id === id);
    if (index === -1) return false;

    this.queue.splice(index, 1);
    this.persist();
    return true;
  }

  /**
   * 取消操作
   */
  cancel(id: string): boolean {
    const operation = this.queue.find((op) => op.id === id);
    if (!operation || operation.status === 'processing') return false;

    operation.status = 'cancelled';
    this.persist();
    return true;
  }

  /**
   * 获取队列中的所有操作
   */
  getAll(): OfflineOperation[] {
    return [...this.queue];
  }

  /**
   * 获取待处理的操作
   */
  getPending(): OfflineOperation[] {
    return this.queue.filter((op) => op.status === 'pending');
  }

  /**
   * 获取失败的操作
   */
  getFailed(): OfflineOperation[] {
    return this.queue.filter((op) => op.status === 'failed');
  }

  /**
   * 获取队列状态
   */
  getState(): OfflineQueueState {
    return {
      length: this.queue.length,
      pendingCount: this.queue.filter((op) => op.status === 'pending').length,
      processingCount: this.queue.filter((op) => op.status === 'processing').length,
      failedCount: this.queue.filter((op) => op.status === 'failed').length,
      isSyncing: this.isProcessing,
    };
  }

  /**
   * 处理队列
   */
  async process(
    handler: (operation: OfflineOperation) => Promise<void>
  ): Promise<void> {
    if (this.isProcessing) {
      return this.processingPromise!;
    }

    this.isProcessing = true;
    this.emit('sync:start');

    this.processingPromise = this.processQueue(handler);

    try {
      await this.processingPromise;
      this.emit('sync:complete', { processed: this.queue.length });
    } catch (error) {
      this.emit('sync:error', { error });
    } finally {
      this.isProcessing = false;
      this.processingPromise = null;
    }
  }

  /**
   * 内部处理逻辑
   */
  private async processQueue(
    handler: (operation: OfflineOperation) => Promise<void>
  ): Promise<void> {
    const pendingOperations = this.getPending();

    for (const operation of pendingOperations) {
      // 检查是否过期
      if (isOperationExpired(operation)) {
        operation.status = 'failed';
        operation.error = '操作已过期';
        this.persist();
        continue;
      }

      operation.status = 'processing';
      this.emit('queue:process', operation);
      this.persist();

      try {
        await handler(operation);
        operation.status = 'completed';
        this.emit('queue:complete', operation);
      } catch (error) {
        operation.retryCount++;
        operation.error = error instanceof Error ? error.message : '未知错误';

        if (operation.retryCount >= operation.maxRetries) {
          operation.status = 'failed';
          this.emit('queue:fail', operation);
        } else {
          operation.status = 'pending';
          // 等待重试间隔
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.retryInterval)
          );
        }
      }

      this.persist();
    }

    // 清理已完成的操作
    this.cleanup();
  }

  /**
   * 重试失败的操作
   */
  retryFailed(): void {
    const failedOperations = this.getFailed();
    for (const operation of failedOperations) {
      if (operation.retryCount < operation.maxRetries) {
        operation.status = 'pending';
        operation.retryCount = 0;
        operation.error = undefined;
      }
    }
    this.persist();
  }

  /**
   * 清理已完成和已取消的操作
   */
  cleanup(): void {
    this.queue = this.queue.filter(
      (op) => op.status !== 'completed' && op.status !== 'cancelled'
    );
    this.persist();
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue = [];
    this.persist();
  }

  /**
   * 持久化到存储
   */
  private persist(): void {
    if (!this.config.persistToStorage) return;

    try {
      const data = JSON.stringify(this.queue);
      localStorage.setItem(this.config.storageKey, data);
    } catch (error) {
      console.error('Failed to persist offline queue:', error);
    }
  }

  /**
   * 从存储加载
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.config.storageKey);
      if (data) {
        const parsed = JSON.parse(data) as OfflineOperation[];
        // 恢复日期对象
        this.queue = parsed.map((op) => ({
          ...op,
          createdAt: new Date(op.createdAt),
          // 将处理中的状态重置为待处理
          status: op.status === 'processing' ? 'pending' : op.status,
        }));
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  /**
   * 订阅事件
   */
  on(event: OfflineEventType, listener: EventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // 返回取消订阅函数
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  /**
   * 触发事件
   */
  private emit(type: OfflineEventType, data?: unknown): void {
    const eventListeners = this.listeners.get(type);
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          listener({ type, data });
        } catch (error) {
          console.error('Event listener error:', error);
        }
      }
    }
  }
}

/**
 * 创建离线队列实例
 */
export function createOfflineQueue(
  config?: Partial<OfflineQueueConfig>
): OfflineQueue {
  return new OfflineQueue(config);
}

/**
 * 默认离线队列实例
 */
let defaultQueue: OfflineQueue | null = null;

/**
 * 获取默认离线队列
 */
export function getDefaultOfflineQueue(): OfflineQueue {
  if (!defaultQueue) {
    defaultQueue = new OfflineQueue();
  }
  return defaultQueue;
}
