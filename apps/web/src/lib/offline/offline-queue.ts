/**
 * OfflineQueueManage
 * @description ManageOfflineStatusdown'sActionQueue, SupportPersistentandAutoSync
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
 * DefaultQueueConfig
 */
const DEFAULT_CONFIG: OfflineQueueConfig = {
 maxSize: 1000,
 defaultMaxRetries: 3,
 retryInterval: 5000,
 persistToStorage: true,
 storageKey: 'agentflow_offline_queue',
};

/**
 * EventListenType
 */
type EventListener = (event: { type: OfflineEventType; data?: unknown }) => void;

/**
 * OfflineQueueManage
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

 // fromStorageRestoreQueue
 if (this.config.persistToStorage) {
 this.loadFromStorage();
 }
 }

 /**
 * AddActiontoQueue
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
 // CheckQueueisnoalready
 if (this.queue.length >= this.config.maxSize) {
 // Removemostold'salreadyFailedAction
 const failedIndex = this.queue.findIndex((op) => op.status === 'failed');
 if (failedIndex !== -1) {
 this.queue.splice(failedIndex, 1);
 } else {
 throw new Error('OfflineQueuealready');
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
 * RemoveAction
 */
 remove(id: string): boolean {
 const index = this.queue.findIndex((op) => op.id === id);
 if (index === -1) return false;

 this.queue.splice(index, 1);
 this.persist();
 return true;
 }

 /**
 * CancelAction
 */
 cancel(id: string): boolean {
 const operation = this.queue.find((op) => op.id === id);
 if (!operation || operation.status === 'processing') return false;

 operation.status = 'cancelled';
 this.persist();
 return true;
 }

 /**
 * FetchQueue'sAllAction
 */
 getAll(): OfflineOperation[] {
 return [...this.queue];
 }

 /**
 * FetchPending'sAction
 */
 getPending(): OfflineOperation[] {
 return this.queue.filter((op) => op.status === 'pending');
 }

 /**
 * FetchFailed'sAction
 */
 getFailed(): OfflineOperation[] {
 return this.queue.filter((op) => op.status === 'failed');
 }

 /**
 * FetchQueueStatus
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
 * ProcessQueue
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
 * InternalProcessLogic
 */
 private async processQueue(
 handler: (operation: OfflineOperation) => Promise<void>
 ): Promise<void> {
 const pendingOperations = this.getPending();

 for (const operation of pendingOperations) {
 // CheckisnoExpired
 if (isOperationExpired(operation)) {
 operation.status = 'failed';
 operation.error = 'ActionExpired';
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
 operation.error = error instanceof Error ? error.message: 'UnknownError';

 if (operation.retryCount >= operation.maxRetries) {
 operation.status = 'failed';
 this.emit('queue:fail', operation);
 } else {
 operation.status = 'pending';
 // etcpendingRetrybetween
 await new Promise((resolve) =>
 setTimeout(resolve, this.config.retryInterval)
 );
 }
 }

 this.persist();
 }

 // Clean upCompleted'sAction
 this.cleanup();
 }

 /**
 * RetryFailed'sAction
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
 * Clean upCompletedandCancelled'sAction
 */
 cleanup(): void {
 this.queue = this.queue.filter(
 (op) => op.status !== 'completed' && op.status !== 'cancelled'
 );
 this.persist();
 }

 /**
 * ClearQueue
 */
 clear(): void {
 this.queue = [];
 this.persist();
 }

 /**
 * PersistenttoStorage
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
 * fromStorageLoad
 */
 private loadFromStorage(): void {
 try {
 const data = localStorage.getItem(this.config.storageKey);
 if (data) {
 const parsed = JSON.parse(data) as OfflineOperation[];
 // RestoreDatefor
 this.queue = parsed.map((op) => ({
 ...op,
 createdAt: new Date(op.createdAt),
 // willProcessing'sStatusResetasPending
 status: op.status === 'processing' ? 'pending' : op.status,
 }));
 }
 } catch (error) {
 console.error('Failed to load offline queue:', error);
 this.queue = [];
 }
 }

 /**
 * SubscriptionEvent
 */
 on(event: OfflineEventType, listener: EventListener): () => void {
 if (!this.listeners.has(event)) {
 this.listeners.set(event, new Set());
 }
 this.listeners.get(event)!.add(listener);

 // BackUnsubscribecount
 return () => {
 this.listeners.get(event)?.delete(listener);
 };
 }

 /**
 * TriggerEvent
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
 * CreateOfflineQueueInstance
 */
export function createOfflineQueue(
 config?: Partial<OfflineQueueConfig>
): OfflineQueue {
 return new OfflineQueue(config);
}

/**
 * DefaultOfflineQueueInstance
 */
let defaultQueue: OfflineQueue | null = null;

/**
 * FetchDefaultOfflineQueue
 */
export function getDefaultOfflineQueue(): OfflineQueue {
 if (!defaultQueue) {
 defaultQueue = new OfflineQueue();
 }
 return defaultQueue;
}
