/**
 * 系统集成 Hook
 * 
 * 提供系统托盘、开机自启动、资源监控等功能
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

// ===== 类型定义 =====

export interface SystemInfo {
  /** 操作系统 */
  os: string;
  /** 架构 */
  arch: string;
  /** 主机名 */
  hostname: string;
  /** CPU 核心数 */
  cpuCount: number;
  /** 总内存 (字节) */
  memoryTotal: number;
}

export interface SystemResources {
  /** CPU 使用率 (0-100) */
  cpuUsage: number;
  /** 内存使用量 (字节) */
  memoryUsed: number;
  /** 总内存 (字节) */
  memoryTotal: number;
  /** 内存使用率 (0-100) */
  memoryUsage: number;
  /** 存储使用量 (字节) */
  storageUsed: number;
  /** 存储总量 (字节) */
  storageTotal: number;
  /** 存储使用率 (0-100) */
  storageUsage: number;
  /** 应用数据目录大小 (字节) */
  appDataSize: number;
  /** 采集时间 */
  timestamp: string;
}

export interface StorageDetails {
  /** 工作流数据大小 */
  workflowsSize: number;
  /** 执行记录大小 */
  executionsSize: number;
  /** 快照数据大小 */
  snapshotsSize: number;
  /** 缓存大小 */
  cacheSize: number;
  /** 日志大小 */
  logsSize: number;
  /** 其他数据大小 */
  otherSize: number;
  /** 总大小 */
  totalSize: number;
}

export interface LogFileInfo {
  /** 文件名 */
  name: string;
  /** 文件路径 */
  path: string;
  /** 文件大小 (字节) */
  size: number;
  /** 创建时间 */
  createdAt?: string;
  /** 修改时间 */
  modifiedAt?: string;
}

export interface LogStats {
  /** 日志文件列表 */
  files: LogFileInfo[];
  /** 总大小 (字节) */
  totalSize: number;
  /** 文件数量 */
  fileCount: number;
}

export interface AutoLaunchStatus {
  /** 是否已启用 */
  enabled: boolean;
  /** 是否支持 */
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

  // 获取系统信息
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

  // 获取系统资源
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

  // 获取存储详情
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

  // 获取日志统计
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

  // 获取自启动状态
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

  // 设置自启动
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

  // 清理日志
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

  // 清理缓存
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

  // 导出日志
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

  // 显示主窗口
  const showMainWindow = useCallback(async () => {
    try {
      await invoke('restore_from_tray');
    } catch (err) {
      console.error('Failed to show main window:', err);
    }
  }, []);

  // 隐藏主窗口
  const hideMainWindow = useCallback(async () => {
    try {
      await invoke('minimize_to_tray');
    } catch (err) {
      console.error('Failed to hide main window:', err);
    }
  }, []);

  // 退出应用
  const quitApp = useCallback(async () => {
    try {
      await invoke('quit_app');
    } catch (err) {
      console.error('Failed to quit app:', err);
    }
  }, []);

  // 开始资源监控
  const startResourceMonitor = useCallback((intervalMs: number = 5000) => {
    if (monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current);
    }
    
    // 立即获取一次
    fetchResources();
    
    // 定期获取
    monitorIntervalRef.current = setInterval(() => {
      fetchResources();
    }, intervalMs);
  }, [fetchResources]);

  // 停止资源监控
  const stopResourceMonitor = useCallback(() => {
    if (monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current);
      monitorIntervalRef.current = null;
    }
  }, []);

  // 初始化时获取信息
  useEffect(() => {
    fetchSystemInfo();
    fetchStorageDetails();
    fetchLogStats();
    fetchAutoLaunchStatus();
    
    return () => {
      stopResourceMonitor();
    };
  }, [fetchSystemInfo, fetchStorageDetails, fetchLogStats, fetchAutoLaunchStatus, stopResourceMonitor]);

  // 格式化字节大小
  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }, []);

  // 格式化百分比
  const formatPercent = useCallback((value: number): string => {
    return `${value.toFixed(1)}%`;
  }, []);

  return {
    // 状态
    systemInfo,
    resources,
    storageDetails,
    logStats,
    autoLaunchStatus,
    isLoading,
    error,
    
    // 方法
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
    
    // 工具
    formatBytes,
    formatPercent,
  };
}

export default useSystem;
