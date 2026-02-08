/**
 * OfflineStatus Hook
 * @description Network status detection and offline queue management
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
 type NetworkStatus,
 type NetworkQuality,
 type ConnectionInfo,
 type OfflineQueueState,
 type OfflineOperation,
 type OfflineOperationType,
 getDefaultOfflineQueue,
} from '@/lib/offline';

/**
 * Hook BackType
 */
export interface UseOfflineStatusReturn {
 /** Whether online */
 isOnline: boolean;
 /** NetworkStatus */
 status: NetworkStatus;
 /** ConnectInfo */
 connectionInfo: ConnectionInfo;
 /** QueueStatus */
 queueState: OfflineQueueState;
 /** AddOfflineAction */
 addToQueue: <T>(
 type: OfflineOperationType,
 data: T,
 options?: { priority?: number; maxRetries?: number }
 ) => OfflineOperation<T>;
 /** ProcessQueue */
 processQueue: () => Promise<void>;
 /** RetryFailedAction */
 retryFailed: () => void;
 /** ClearQueue */
 clearQueue: () => void;
 /** FetchPendingAction */
 getPendingOperations: () => OfflineOperation[];
 /** FetchFailedAction */
 getFailedOperations: () => OfflineOperation[];
}

/**
 * Hook ConfigOption
 */
interface UseOfflineStatusOptions {
 /** afterAutoSync */
 autoSync?: boolean;
 /** ActionProcess */
 onProcess?: (operation: OfflineOperation) => Promise<void>;
 /** StatusCallback */
 onStatusChange?: (status: NetworkStatus) => void;
}

/**
 * FetchNetworkInfo
 */
function getNetworkQuality(): NetworkQuality | undefined {
 if (typeof navigator === 'undefined') return undefined;

 // @ts-expect-error - Navigator connection API
 const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

 if (!connection) return undefined;

 return {
 effectiveType: connection.effectiveType || 'unknown',
 rtt: connection.rtt || 0,
 downlink: connection.downlink || 0,
 saveData: connection.saveData || false,
 };
}

/**
 * Determine whether network is slow
 */
function isSlowNetwork(quality?: NetworkQuality): boolean {
 if (!quality) return false;
 return (
 quality.effectiveType === 'slow-2g' ||
 quality.effectiveType === '2g' ||
 quality.rtt > 1000 ||
 quality.downlink < 0.5
 );
}

/**
 * OfflineStatus Hook
 */
export function useOfflineStatus(
 options: UseOfflineStatusOptions = {}
): UseOfflineStatusReturn {
 const { autoSync = true, onProcess, onStatusChange } = options;

 // FetchOfflineQueueInstance
 const queueRef = useRef(getDefaultOfflineQueue());

 // NetworkStatus
 const [isOnline, setIsOnline] = useState(() =>
 typeof navigator !== 'undefined' ? navigator.onLine : true
 );

 // Network
 const [quality, setQuality] = useState<NetworkQuality | undefined>(() =>
 getNetworkQuality()
 );

 // ConnectInfo
 const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>(() => ({
 isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
 status: 'online',
 quality: getNetworkQuality(),
 }));

 // QueueStatus
 const [queueState, setQueueState] = useState<OfflineQueueState>(() =>
 queueRef.current.getState()
 );

 // UpdateQueueStatus
 const updateQueueState = useCallback(() => {
 setQueueState(queueRef.current.getState());
 }, []);

 // CalculateNetworkStatus
 const getNetworkStatus = useCallback(
 (online: boolean, networkQuality?: NetworkQuality): NetworkStatus => {
 if (!online) return 'offline';
 if (isSlowNetwork(networkQuality)) return 'slow';
 return 'online';
 },
 []
 );

 // ProcessOnlineStatus
 const handleOnline = useCallback(() => {
 const newQuality = getNetworkQuality();
 const newStatus = getNetworkStatus(true, newQuality);

 setIsOnline(true);
 setQuality(newQuality);
 setConnectionInfo((prev) => ({
 ...prev,
 isOnline: true,
 status: newStatus,
 quality: newQuality,
 lastOnlineAt: new Date(),
 }));

 onStatusChange?.(newStatus);

 // AutoSync
 if (autoSync && onProcess) {
 queueRef.current.process(onProcess).then(updateQueueState);
 }
 }, [autoSync, onProcess, onStatusChange, getNetworkStatus, updateQueueState]);

 // ProcessOfflineStatus
 const handleOffline = useCallback(() => {
 setIsOnline(false);
 setConnectionInfo((prev) => ({
 ...prev,
 isOnline: false,
 status: 'offline',
 lastOfflineAt: new Date(),
 }));

 onStatusChange?.('offline');
 }, [onStatusChange]);

 // ProcessConnect
 const handleConnectionChange = useCallback(() => {
 const newQuality = getNetworkQuality();
 const online = navigator.onLine;
 const newStatus = getNetworkStatus(online, newQuality);

 setQuality(newQuality);
 setConnectionInfo((prev) => ({
 ...prev,
 status: newStatus,
 quality: newQuality,
 }));

 // If network restored to normal, trigger sync
 if (
 autoSync &&
 onProcess &&
 newStatus === 'online' &&
 connectionInfo.status === 'slow'
 ) {
 queueRef.current.process(onProcess).then(updateQueueState);
 }
 }, [autoSync, onProcess, connectionInfo.status, getNetworkStatus, updateQueueState]);

 // ListenNetworkStatus
 useEffect(() => {
 if (typeof window === 'undefined') return;

 window.addEventListener('online', handleOnline);
 window.addEventListener('offline', handleOffline);

 // ListenConnect
 // @ts-expect-error - Navigator connection API
 const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
 if (connection) {
 connection.addEventListener('change', handleConnectionChange);
 }

 return () => {
 window.removeEventListener('online', handleOnline);
 window.removeEventListener('offline', handleOffline);
 if (connection) {
 connection.removeEventListener('change', handleConnectionChange);
 }
 };
 }, [handleOnline, handleOffline, handleConnectionChange]);

 // ListenQueueEvent
 useEffect(() => {
 const queue = queueRef.current;

 const unsubscribers = [
 queue.on('queue:add', updateQueueState),
 queue.on('queue:complete', updateQueueState),
 queue.on('queue:fail', updateQueueState),
 queue.on('sync:start', updateQueueState),
 queue.on('sync:complete', updateQueueState),
 ];

 return () => {
 unsubscribers.forEach((unsub) => unsub());
 };
 }, [updateQueueState]);

 // AddtoQueue
 const addToQueue = useCallback(
 <T>(
 type: OfflineOperationType,
 data: T,
 addOptions?: { priority?: number; maxRetries?: number }
 ): OfflineOperation<T> => {
 const operation = queueRef.current.add(type, data, addOptions);
 updateQueueState();
 return operation;
 },
 [updateQueueState]
 );

 // ProcessQueue
 const processQueue = useCallback(async () => {
 if (!onProcess) {
 console.warn('No onProcess handler provided');
 return;
 }

 await queueRef.current.process(onProcess);
 updateQueueState();
 }, [onProcess, updateQueueState]);

 // RetryFailedAction
 const retryFailed = useCallback(() => {
 queueRef.current.retryFailed();
 updateQueueState();

 // If online, process now
 if (isOnline && onProcess) {
 queueRef.current.process(onProcess).then(updateQueueState);
 }
 }, [isOnline, onProcess, updateQueueState]);

 // ClearQueue
 const clearQueue = useCallback(() => {
 queueRef.current.clear();
 updateQueueState();
 }, [updateQueueState]);

 // FetchPendingAction
 const getPendingOperations = useCallback(() => {
 return queueRef.current.getPending();
 }, []);

 // FetchFailedAction
 const getFailedOperations = useCallback(() => {
 return queueRef.current.getFailed();
 }, []);

 return {
 isOnline,
 status: connectionInfo.status,
 connectionInfo,
 queueState,
 addToQueue,
 processQueue,
 retryFailed,
 clearQueue,
 getPendingOperations,
 getFailedOperations,
 };
}

export default useOfflineStatus;
