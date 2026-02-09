/**
 * System Integration Hook
 * 
 * Provides system info, launch, and resource monitor features
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

// ===== Type Definitions =====

export interface SystemInfo {
 /** Operating System */
 os: string;
 /** Architecture */
 arch: string;
 /** Hostname */
 hostname: string;
 /** CPU Core Count */
 cpuCount: number;
 /** Total Memory (Bytes) */
 memoryTotal: number;
}

export interface SystemResources {
 /** CPU Usage Rate (0-100) */
 cpuUsage: number;
 /** Memory Used (Bytes) */
 memoryUsed: number;
 /** Total Memory (Bytes) */
 memoryTotal: number;
 /** Memory Usage Rate (0-100) */
 memoryUsage: number;
 /** Storage Used (Bytes) */
 storageUsed: number;
 /** Storage Total (Bytes) */
 storageTotal: number;
 /** Storage Usage Rate (0-100) */
 storageUsage: number;
 /** App Data Directory Size (Bytes) */
 appDataSize: number;
 /** Timestamp */
 timestamp: string;
}

export interface StorageDetails {
 /** Workflow Data Size */
 workflowsSize: number;
 /** Execution Record Size */
 executionsSize: number;
 /** Snapshot Data Size */
 snapshotsSize: number;
 /** Cache Size */
 cacheSize: number;
 /** Logs Size */
 logsSize: number;
 /** Other Data Size */
 otherSize: number;
 /** Total Size */
 totalSize: number;
}

export interface LogFileInfo {
 /** File Name */
 name: string;
 /** File Path */
 path: string;
 /** File Size (Bytes) */
 size: number;
 /** Created At */
 createdAt?: string;
 /** Modified At */
 modifiedAt?: string;
}

export interface LogStats {
 /** Log Files List */
 files: LogFileInfo[];
 /** Total Size (Bytes) */
 totalSize: number;
 /** File Count */
 fileCount: number;
}

export interface AutoLaunchStatus {
  /** Whether the feature is enabled */
  enabled: boolean;
  /** Whether the feature is supported */
  supported: boolean;
}

// ===== Hook =====

export function useSystem() {
 const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
 const [resources, setResources] = useState<SystemResources | null>(null);
 const [storageDetails, setStorageDetails] = useState<StorageDetails | null>(null);
 const [logStats, setLogStats] = useState<LogStats | null>(null);
 const [autoLaunchStatus, setAutoLaunchStatus] = useState<AutoLaunchStatus | null>(null);
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 
 const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);

 // FetchSystemInfo
 const fetchSystemInfo = useCallback(async () => {
 try {
 const info = await invoke<SystemInfo>('get_system_info');
 setSystemInfo(info);
 return info;
 } catch (err) {
 const message = err instanceof Error ? err.message : String(err);
 setError(message);
 return null;
 }
 }, []);

 // FetchSystemResource
 const fetchResources = useCallback(async () => {
 try {
 const data = await invoke<SystemResources>('get_system_resources');
 setResources(data);
 return data;
 } catch (err) {
 const message = err instanceof Error ? err.message : String(err);
 setError(message);
 return null;
 }
 }, []);

 // FetchStorageDetails
 const fetchStorageDetails = useCallback(async () => {
 try {
 const info = await invoke<StorageDetails>('get_storage_details');
 setStorageDetails(info);
 return info;
 } catch (err) {
 const message = err instanceof Error ? err.message : String(err);
 setError(message);
 return null;
 }
 }, []);

 // FetchLogsStatistics
 const fetchLogStats = useCallback(async () => {
 try {
 const stats = await invoke<LogStats>('get_log_stats');
 setLogStats(stats);
 return stats;
 } catch (err) {
 const message = err instanceof Error ? err.message : String(err);
 setError(message);
 return null;
 }
 }, []);

 // FetchLaunchStatus
 const fetchAutoLaunchStatus = useCallback(async () => {
 try {
 const status = await invoke<AutoLaunchStatus>('get_auto_start_status');
 setAutoLaunchStatus(status);
 return status;
 } catch (err) {
 const message = err instanceof Error ? err.message : String(err);
 setError(message);
 return null;
 }
 }, []);

 // SettingsLaunch
 const setAutoLaunch = useCallback(async (enabled: boolean): Promise<boolean> => {
 try {
 setIsLoading(true);
 await invoke('set_auto_start', { enabled });
 await fetchAutoLaunchStatus();
 return true;
 } catch (err) {
 const message = err instanceof Error ? err.message : String(err);
 setError(message);
 return false;
 } finally {
 setIsLoading(false);
 }
 }, [fetchAutoLaunchStatus]);

 // Clean upLogs
 const clearLogs = useCallback(async (keepDays: number = 7): Promise<number> => {
 try {
 setIsLoading(true);
 const deletedCount = await invoke<number>('clear_logs', { keepDays });
 await fetchLogStats();
 await fetchStorageDetails();
 return deletedCount;
 } catch (err) {
 const message = err instanceof Error ? err.message : String(err);
 setError(message);
 return 0;
 } finally {
 setIsLoading(false);
 }
 }, [fetchLogStats, fetchStorageDetails]);

 // Clean upCache
 const clearCache = useCallback(async (): Promise<number> => {
 try {
 setIsLoading(true);
 const cleanedSize = await invoke<number>('clear_cache');
 await fetchStorageDetails();
 return cleanedSize;
 } catch (err) {
 const message = err instanceof Error ? err.message : String(err);
 setError(message);
 return 0;
 } finally {
 setIsLoading(false);
 }
 }, [fetchStorageDetails]);

 // ExportLogs
 const exportLogs = useCallback(async (outputPath: string): Promise<string | null> => {
 try {
 setIsLoading(true);
 const result = await invoke<string>('export_logs', { outputPath });
 return result;
 } catch (err) {
 const message = err instanceof Error ? err.message : String(err);
 setError(message);
 return null;
 } finally {
 setIsLoading(false);
 }
 }, []);

 // DisplaymainWindow
 const showMainWindow = useCallback(async () => {
 try {
 await invoke('restore_from_tray');
 } catch (err) {
 console.error('Failed to show main window:', err);
 }
 }, []);

 // HidemainWindow
 const hideMainWindow = useCallback(async () => {
 try {
 await invoke('minimize_to_tray');
 } catch (err) {
 console.error('Failed to hide main window:', err);
 }
 }, []);

 // ExitApp
 const quitApp = useCallback(async () => {
 try {
 await invoke('quit_app');
 } catch (err) {
 console.error('Failed to quit app:', err);
 }
 }, []);

 // StartResourceMonitor
 const startResourceMonitor = useCallback((intervalMs: number = 5000) => {
 if (monitorIntervalRef.current) {
 clearInterval(monitorIntervalRef.current);
 }
 
 // NowFetch1times
 fetchResources();
 
 // PeriodicFetch
 monitorIntervalRef.current = setInterval(() => {
 fetchResources();
 }, intervalMs);
 }, [fetchResources]);

 // StopResourceMonitor
 const stopResourceMonitor = useCallback(() => {
 if (monitorIntervalRef.current) {
 clearInterval(monitorIntervalRef.current);
 monitorIntervalRef.current = null;
 }
 }, []);

 // InitialtimeFetchInfo
 useEffect(() => {
 fetchSystemInfo();
 fetchStorageDetails();
 fetchLogStats();
 fetchAutoLaunchStatus();
 
 return () => {
 stopResourceMonitor();
 };
 }, [fetchSystemInfo, fetchStorageDetails, fetchLogStats, fetchAutoLaunchStatus, stopResourceMonitor]);

 // FormatBytesSize
 const formatBytes = useCallback((bytes: number): string => {
 if (bytes === 0) return '0 B';
 const k = 1024;
 const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
 const i = Math.floor(Math.log(bytes) / Math.log(k));
 return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
 }, []);

 // FormatPercentage
 const formatPercent = useCallback((value: number): string => {
 return `${value.toFixed(1)}%`;
 }, []);

 return {
 // Status
 systemInfo,
 resources,
 storageDetails,
 logStats,
 autoLaunchStatus,
 isLoading,
 error,
 
 // Method
 fetchSystemInfo,
 fetchResources,
 fetchStorageDetails,
 fetchLogStats,
 fetchAutoLaunchStatus,
 setAutoLaunch,
 clearLogs,
 clearCache,
 exportLogs,
 showMainWindow,
 hideMainWindow,
 quitApp,
 startResourceMonitor,
 stopResourceMonitor,
 
 // Tool
 formatBytes,
 formatPercent,
 };
}

export default useSystem;
