/**
 * Data Sync Engine
 * @description Manages synchronization between local and cloud data
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
 * Event listener type
 */
type EventListener = (event: { type: SyncEventType; data?: unknown }) => void;

/**
 * Local storage interface
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
 * Cloud API interface
 */
export interface CloudApi {
 getChangesSince(since: Date | null): Promise<ChangeRecord[]>;
 pushChanges(changes: ChangeRecord[]): Promise<{ successful: string[]; failed: SyncError[] }>;
 isOnline(): Promise<boolean>;
}

/**
 * Sync Engine
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
 * Get current state
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
 * Start auto sync
 */
 startAutoSync(): void {
 if (this.syncInterval) return;

 this.config.autoSync = true;
 this.syncInterval = setInterval(() => {
 this.sync().catch(console.error);
 }, this.config.interval);

 // Execute sync immediately
 this.sync().catch(console.error);
 }

 /**
 * Stop auto sync
 */
 stopAutoSync(): void {
 if (this.syncInterval) {
 clearInterval(this.syncInterval);
 this.syncInterval = null;
 }
 this.config.autoSync = false;
 }

 /**
 * Record a change
 */
 async recordChange<T>(
 entityType: EntityType,
 entityId: string,
 operation: OperationType,
 data: T
 ): Promise<ChangeRecord<T>> {
 // Check if entity type should be excluded
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
 * Execute sync
 */
 async sync(): Promise<SyncResult> {
 if (this.isSyncing) {
 return { status: 'skipped', reason: 'Sync already in progress' };
 }

 // Check if online
 const isOnline = await this.cloudApi.isOnline();
 if (!isOnline) {
 return { status: 'skipped', reason: 'Offline' };
 }

 this.isSyncing = true;
 const startTime = Date.now();
 this.emit('sync:start');

 try {
 // 1. Get local pending changes
 const localChanges = await this.localStorage.getPendingChanges();

 // 2. Get cloud changes
 const lastSyncTime = await this.localStorage.getLastSyncTime();
 const cloudChanges = await this.cloudApi.getChangesSince(lastSyncTime);

 // 3. Detect conflicts
 const { conflicts, localOnly, cloudOnly } = this.detectConflicts(
 localChanges,
 cloudChanges
 );

 // 4. Resolve conflicts
 const resolvedConflicts = await this.resolveConflicts(conflicts);

 // 5. Upload local changes
 const changesToUpload = [
 ...localOnly,
 ...resolvedConflicts
 .filter((c) => c.resolution === 'local')
 .map((c) => c.local),
 ];
 const uploadResults = await this.uploadChanges(changesToUpload);

 // 6. Download cloud changes
 const changesToDownload = [
 ...cloudOnly,
 ...resolvedConflicts
 .filter((c) => c.resolution === 'cloud')
 .map((c) => c.cloud),
 ];
 const downloadResults = await this.downloadChanges(changesToDownload);

 // 7. Update sync time
 await this.localStorage.setLastSyncTime(new Date());

 // 8. Mark synced changes
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
 * Detect conflicts
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

 // Check local changes
 for (const local of localChanges) {
 const key = `${local.entityType}:${local.entityId}`;
 const cloud = cloudMap.get(key);

 if (cloud) {
 // Same entity changed on both sides -> conflict
 conflicts.push({ local, cloud });
 cloudMap.delete(key);
 } else {
 localOnly.push(local);
 }
 }

 // Remaining cloud changes
 cloudOnly.push(...cloudMap.values());

 // Record conflicts to queue
 this.conflictQueue = conflicts;

 if (conflicts.length > 0) {
 this.emit('sync:conflict', { conflicts });
 }

 return { conflicts, localOnly, cloudOnly };
 }

 /**
 * Resolve conflicts
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
 // For manual resolution, default to keeping local
 // Actual implementation requires UI interaction
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
 * Upload changes
 */
 private async uploadChanges(changes: ChangeRecord[]): Promise<UploadResult> {
 if (changes.length === 0) {
 return { successful: [], failed: [] };
 }

 const successful: string[] = [];
 const failed: SyncError[] = [];

 // Upload in batches
 for (let i = 0; i < changes.length; i += this.config.batchSize) {
 const batch = changes.slice(i, i + this.config.batchSize);

 try {
 // Update status to syncing
 for (const change of batch) {
 await this.localStorage.updateChangeStatus(change.id, 'syncing');
 }

 const result = await this.cloudApi.pushChanges(batch);
 successful.push(...result.successful);
 failed.push(...result.failed);

 // Mark failed changes
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

 // Reset status to pending
 for (const change of batch) {
 await this.localStorage.updateChangeStatus(change.id, 'pending');
 }
 }

 // Emit progress event
 this.emit('sync:progress', {
 uploaded: successful.length,
 total: changes.length,
 });
 }

 return { successful, failed };
 }

 /**
 * Download changes
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
 * Get conflict queue
 */
 getConflicts(): Conflict[] {
 return [...this.conflictQueue];
 }

 /**
 * Manually resolve a conflict
 */
 async resolveConflictManually(
 conflictIndex: number,
 resolution: 'local' | 'cloud'
 ): Promise<void> {
 const conflict = this.conflictQueue[conflictIndex];
 if (!conflict) return;

 const chosen = resolution === 'local' ? conflict.local : conflict.cloud;
 await this.localStorage.applyChange(chosen);

 // Remove from queue
 this.conflictQueue.splice(conflictIndex, 1);
 }

 /**
 * Update configuration
 */
 updateConfig(config: Partial<SyncConfig>): void {
 const wasAutoSync = this.config.autoSync;
 this.config = { ...this.config, ...config };

 // If auto sync status changed
 if (wasAutoSync && !this.config.autoSync) {
 this.stopAutoSync();
 } else if (!wasAutoSync && this.config.autoSync) {
 this.startAutoSync();
 }

 // If interval changed, restart auto sync
 if (this.syncInterval && config.interval) {
 this.stopAutoSync();
 this.startAutoSync();
 }
 }

 /**
 * Get configuration
 */
 getConfig(): SyncConfig {
 return { ...this.config };
 }

 /**
 * Subscribe to events
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
 * Emit event
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
 * Destroy engine
 */
 destroy(): void {
 this.stopAutoSync();
 this.listeners.clear();
 }
}

/**
 * Create sync engine
 */
export function createSyncEngine(
 localStorage: LocalStorage,
 cloudApi: CloudApi,
 config?: Partial<SyncConfig>
): SyncEngine {
 return new SyncEngine(localStorage, cloudApi, config);
}
