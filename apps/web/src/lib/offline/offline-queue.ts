/**
 * Offline Queue Management
 * @description Manage Offline Status Action Queue, Support Persistent and Auto Sync
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
 * Default Queue Config
 */
const DEFAULT_CONFIG: OfflineQueueConfig = {
 maxSize: 1000,
 defaultMaxRetries: 3,
 retryInterval: 5000,
 persistToStorage: true,
 storageKey: 'agentflow_offline_queue',
};

/**
 * Event Listener Type
 */
type EventListener = (event: { type: OfflineEventType; data?: unknown }) => void;

/**
 * Offline Queue Management
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

    // Restore queue from storage
    if (this.config.persistToStorage) {
      this.loadFromStorage();
    }
 }

  /**
   * Add Action to Queue
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
    // Check if queue is already full
    if (this.queue.length >= this.config.maxSize) {
      // Remove the oldest already failed action
      const failedIndex = this.queue.findIndex((op) => op.status === 'failed');
      if (failedIndex !== -1) {
        this.queue.splice(failedIndex, 1);
      } else {
        throw new Error('Offline queue is already full');
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
   * Remove Action
   */
 remove(id: string): boolean {
 const index = this.queue.findIndex((op) => op.id === id);
 if (index === -1) return false;

 this.queue.splice(index, 1);
 this.persist();
 return true;
 }

  /**
   * Cancel Action
   */
 cancel(id: string): boolean {
 const operation = this.queue.find((op) => op.id === id);
 if (!operation || operation.status === 'processing') return false;

 operation.status = 'cancelled';
 this.persist();
 return true;
 }

  /**
   * Fetch All Actions in Queue
   */
 getAll(): OfflineOperation[] {
 return [...this.queue];
 }

  /**
   * Fetch Pending Actions
   */
 getPending(): OfflineOperation[] {
 return this.queue.filter((op) => op.status === 'pending');
 }

  /**
   * Fetch Failed Actions
   */
 getFailed(): OfflineOperation[] {
 return this.queue.filter((op) => op.status === 'failed');
 }

  /**
   * Fetch Queue Status
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
   * Process Queue
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
   * Internal Process Logic
   */
 private async processQueue(
 handler: (operation: OfflineOperation) => Promise<void>
 ): Promise<void> {
 const pendingOperations = this.getPending();

 for (const operation of pendingOperations) {
      // Check if expired
      if (isOperationExpired(operation)) {
        operation.status = 'failed';
        operation.error = 'Action expired';
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
        operation.error = error instanceof Error ? error.message: 'Unknown error';

        if (operation.retryCount >= operation.maxRetries) {
          operation.status = 'failed';
          this.emit('queue:fail', operation);
        } else {
          operation.status = 'pending';
          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.retryInterval)
          );
        }
 }

 this.persist();
 }

    // Clean up completed actions
    this.cleanup();
  }

  /**
   * Retry Failed Actions
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
   * Clean up Completed and Cancelled Actions
   */
 cleanup(): void {
 this.queue = this.queue.filter(
 (op) => op.status !== 'completed' && op.status !== 'cancelled'
 );
 this.persist();
 }

  /**
   * Clear Queue
   */
 clear(): void {
 this.queue = [];
 this.persist();
 }

  /**
   * Persist to Storage
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
   * Load from Storage
   */
 private loadFromStorage(): void {
 try {
 const data = localStorage.getItem(this.config.storageKey);
 if (data) {
        const parsed = JSON.parse(data) as OfflineOperation[];
        // Restore date format
        this.queue = parsed.map((op) => ({
          ...op,
          createdAt: new Date(op.createdAt),
          // Reset processing status to pending
          status: op.status === 'processing' ? 'pending' : op.status,
        }));
 }
 } catch (error) {
 console.error('Failed to load offline queue:', error);
 this.queue = [];
 }
 }

  /**
   * Subscribe to Event
   */
 on(event: OfflineEventType, listener: EventListener): () => void {
 if (!this.listeners.has(event)) {
 this.listeners.set(event, new Set());
 }
    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
 }

  /**
   * Trigger Event
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
 * Create Offline Queue Instance
 */
export function createOfflineQueue(
 config?: Partial<OfflineQueueConfig>
): OfflineQueue {
 return new OfflineQueue(config);
}

/**
 * Default Offline Queue Instance
 */
let defaultQueue: OfflineQueue | null = null;

/**
 * Fetch Default Offline Queue
 */
export function getDefaultOfflineQueue(): OfflineQueue {
 if (!defaultQueue) {
 defaultQueue = new OfflineQueue();
 }
 return defaultQueue;
}
