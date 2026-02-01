/**
 * 自动更新 Hook
 * 
 * 提供检查更新、下载更新、安装更新等功能
 */

import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// ===== 类型定义 =====

export interface UpdateInfo {
  /** 当前版本 */
  currentVersion: string;
  /** 最新版本 */
  latestVersion: string;
  /** 发布日期 */
  date?: string;
  /** 更新说明 */
  body?: string;
  /** 是否有可用更新 */
  available: boolean;
}

export interface UpdateProgress {
  /** 已下载字节数 */
  downloaded: number;
  /** 总字节数 */
  total?: number;
  /** 进度百分比 (0-100) */
  percent: number;
}

export type UpdateStatus = 
  | 'idle'
  | 'checking'
  | 'available'
  | 'not_available'
  | 'downloading'
  | 'downloaded'
  | 'installing'
  | 'error';

export interface AppInfo {
  name: string;
  version: string;
  authors: string;
  description: string;
}

// ===== Hook =====

export function useUpdater() {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  // 监听更新事件
  useEffect(() => {
    const unlistenStatus = listen<UpdateStatus>('update-status', (event) => {
      setStatus(event.payload);
    });

    const unlistenProgress = listen<UpdateProgress>('update-progress', (event) => {
      setProgress(event.payload);
    });

    // 获取应用信息
    getAppInfo().then(setAppInfo).catch(console.error);

    return () => {
      unlistenStatus.then((fn) => fn());
      unlistenProgress.then((fn) => fn());
    };
  }, []);

  // 检查更新
  const checkUpdate = useCallback(async (): Promise<UpdateInfo | null> => {
    try {
      setStatus('checking');
      setError(null);
      
      const info = await invoke<UpdateInfo>('check_update');
      setUpdateInfo(info);
      setStatus(info.available ? 'available' : 'not_available');
      
      return info;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStatus('error');
      return null;
    }
  }, []);

  // 下载并安装更新
  const downloadAndInstall = useCallback(async (): Promise<boolean> => {
    try {
      setStatus('downloading');
      setError(null);
      setProgress(null);
      
      await invoke('download_and_install_update');
      
      // 如果到这里，说明安装会重启应用
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStatus('error');
      return false;
    }
  }, []);

  // 获取当前版本
  const getVersion = useCallback(async (): Promise<string> => {
    try {
      return await invoke<string>('get_app_version');
    } catch (err) {
      console.error('Failed to get app version:', err);
      return 'unknown';
    }
  }, []);

  // 获取应用信息
  const getAppInfo = useCallback(async (): Promise<AppInfo> => {
    try {
      return await invoke<AppInfo>('get_app_info');
    } catch (err) {
      console.error('Failed to get app info:', err);
      return {
        name: 'AgentFlow',
        version: 'unknown',
        authors: '',
        description: '',
      };
    }
  }, []);

  // 重置状态
  const reset = useCallback(() => {
    setStatus('idle');
    setUpdateInfo(null);
    setProgress(null);
    setError(null);
  }, []);

  return {
    // 状态
    status,
    updateInfo,
    progress,
    error,
    appInfo,
    
    // 计算属性
    isChecking: status === 'checking',
    isDownloading: status === 'downloading',
    isInstalling: status === 'installing',
    hasUpdate: status === 'available' && updateInfo?.available,
    
    // 方法
    checkUpdate,
    downloadAndInstall,
    getVersion,
    getAppInfo,
    reset,
  };
}

export default useUpdater;
