/**
 * DataSyncEngine
 * @description ManageLocalandCloudData'sSync
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
 * EventListenType
 */
type EventListener = (event: { type: SyncEventType; data?: unknown }) => void;

/**
 * LocalStorageInterface
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
 * Cloud API Interface
 */
export interface CloudApi {
 getChangesSince(since: Date | null): Promise<ChangeRecord[]>;
 pushChanges(changes: ChangeRecord[]): Promise<{ successful: string[]; failed: SyncError[] }>;
 isOnline(): Promise<boolean>;
}

/**
 * SyncEngine
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
 * FetchCurrentStatus
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
 * LaunchAutoSync
 */
 startAutoSync(): void {
 if (this.syncInterval) return;

 this.config.autoSync = true;
 this.syncInterval = setInterval(() => {
 this.sync().catch(console.error);
 }, this.config.interval);

 // NowExecute1timesSync
 this.sync().catch(console.error);
 }

 /**
 * StopAutoSync
 */
 stopAutoSync(): void {
 if (this.syncInterval) {
 clearInterval(this.syncInterval);
 this.syncInterval = null;
 }
 this.config.autoSync = false;
 }

 /**
 * RecordChange
 */
 async recordChange<T>(
 entityType: EntityType,
 entityId: string,
 operation: OperationType,
 data: T
 ): Promise<ChangeRecord<T>> {
 // CheckisnoShouldExclude
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
 * ExecuteSync
 */
 async sync(): Promise<SyncResult> {
 if (this.isSyncing) {
 return { status: 'skipped', reason: 'Sync already in progress' };
 }

 // CheckisnoOnline
 const isOnline = await this.cloudApi.isOnline();
 if (!isOnline) {
 return { status: 'skipped', reason: 'Offline' };
 }

 this.isSyncing = true;
 const startTime = Date.now();
 this.emit('sync:start');

 try {
 // 1. FetchLocalpendingSync'sChange
 const localChanges = await this.localStorage.getPendingChanges();

 // 2. FetchCloud'sChange
 const lastSyncTime = await this.localStorage.getLastSyncTime();
 const cloudChanges = await this.cloudApi.getChangesSince(lastSyncTime);

 // 3. DetectConflict
 const { conflicts, localOnly, cloudOnly } = this.detectConflicts(
 localChanges,
 cloudChanges
 );

 // 4. ResolveConflict
 const resolvedConflicts = await this.resolveConflicts(conflicts);

 // 5. UploadLocalChange
 const changesToUpload = [
 ...localOnly,
 ...resolvedConflicts
 .filter((c) => c.resolution === 'local')
 .map((c) => c.local),
 ];
 const uploadResults = await this.uploadChanges(changesToUpload);

 // 6. DownloadCloudChange
 const changesToDownload = [
 ...cloudOnly,
 ...resolvedConflicts
 .filter((c) => c.resolution === 'cloud')
 .map((c) => c.cloud),
 ];
 const downloadResults = await this.downloadChanges(changesToDownload);

 // 7. UpdateSyncTime
 await this.localStorage.setLastSyncTime(new Date());

 // 8. MarkalreadySync'sChange
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
 * DetectConflict
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

 // CheckLocalChange
 for (const local of localChanges) {
 const key = `${local.entityType}:${local.entityId}`;
 const cloud = cloudMap.get(key);

 if (cloud) {
 // 1EntityatendpointallhasChange -> Conflict
 conflicts.push({ local, cloud });
 cloudMap.delete(key);
 } else {
 localOnly.push(local);
 }
 }

 // Remaining'sCloudChange
 cloudOnly.push(...cloudMap.values());

 // RecordConflicttoQueue
 this.conflictQueue = conflicts;

 if (conflicts.length > 0) {
 this.emit('sync:conflict', { conflicts });
 }

 return { conflicts, localOnly, cloudOnly };
 }

 /**
 * ResolveConflict
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
 // ManualResolvetime, DefaultRetainLocal
 // ActualImplementneedneed UI Interactive
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
 * UploadChange
 */
 private async uploadChanges(changes: ChangeRecord[]): Promise<UploadResult> {
 if (changes.length === 0) {
 return { successful: [], failed: [] };
 }

 const successful: string[] = [];
 const failed: SyncError[] = [];

 // Upload
 for (let i = 0; i < changes.length; i += this.config.batchSize) {
 const batch = changes.slice(i, i + this.config.batchSize);

 try {
 // UpdateStatusasSync
 for (const change of batch) {
 await this.localStorage.updateChangeStatus(change.id, 'syncing');
 }

 const result = await this.cloudApi.pushChanges(batch);
 successful.push(...result.successful);
 failed.push(...result.failed);

 // MarkFailed'sChange
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

 // ResetStatusaspendingSync
 for (const change of batch) {
 await this.localStorage.updateChangeStatus(change.id, 'pending');
 }
 }

 // SendProgressEvent
 this.emit('sync:progress', {
 uploaded: successful.length,
 total: changes.length,
 });
 }

 return { successful, failed };
 }

 /**
 * DownloadChange
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
 * FetchConflictQueue
 */
 getConflicts(): Conflict[] {
 return [...this.conflictQueue];
 }

 /**
 * ManualResolveConflict
 */
 async resolveConflictManually(
 conflictIndex: number,
 resolution: 'local' | 'cloud'
 ): Promise<void> {
 const conflict = this.conflictQueue[conflictIndex];
 if (!conflict) return;

 const chosen = resolution === 'local' ? conflict.local : conflict.cloud;
 await this.localStorage.applyChange(chosen);

 // fromQueueRemove
 this.conflictQueue.splice(conflictIndex, 1);
 }

 /**
 * UpdateConfig
 */
 updateConfig(config: Partial<SyncConfig>): void {
 const wasAutoSync = this.config.autoSync;
 this.config = { ...this.config, ...config };

 // ifresultAutoSyncStatusChange
 if (wasAutoSync && !this.config.autoSync) {
 this.stopAutoSync();
 } else if (!wasAutoSync && this.config.autoSync) {
 this.startAutoSync();
 }

 // ifresultbetweenChange, re-AutoSync
 if (this.syncInterval && config.interval) {
 this.stopAutoSync();
 this.startAutoSync();
 }
 }

 /**
 * FetchConfig
 */
 getConfig(): SyncConfig {
 return { ...this.config };
 }

 /**
 * SubscriptionEvent
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
 * TriggerEvent
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
 * DestroyEngine
 */
 destroy(): void {
 this.stopAutoSync();
 this.listeners.clear();
 }
}

/**
 * CreateSyncEngine
 */
export function createSyncEngine(
 localStorage: LocalStorage,
 cloudApi: CloudApi,
 config?: Partial<SyncConfig>
): SyncEngine {
 return new SyncEngine(localStorage, cloudApi, config);
}
