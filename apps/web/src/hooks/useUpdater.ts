/**
 * Auto Update Hook
 * 
 * Provide check update, download update, install update, etc. features
 */

import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// ===== TypeDefinition =====

export interface UpdateInfo {
 /** Current Version */
 currentVersion: string;
 /** Latest Version */
 latestVersion: string;
 /** Publish Date */
 date?: string;
  /** Update description */
  body?: string;
  /** Whether there is an available update */
  available: boolean;
}

export interface UpdateProgress {
 /** Already Downloaded Bytes Count */
 downloaded: number;
 /** Total Bytes Count */
 total?: number;
 /** Progress Percentage (0-100) */
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

 // Listen to update event
 useEffect(() => {
 const unlistenStatus = listen<UpdateStatus>('update-status', (event) => {
 setStatus(event.payload);
 });

 const unlistenProgress = listen<UpdateProgress>('update-progress', (event) => {
   setProgress(event.payload);
  });

 return () => {
 unlistenStatus.then((fn) => fn());
   unlistenProgress.then((fn) => fn());
  };
 }, []);

 // Fetch app info
 getAppInfo().then(setAppInfo).catch(console.error);

 // Check update
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

 // Download and install update
 const downloadAndInstall = useCallback(async (): Promise<boolean> => {
 try {
 setStatus('downloading');
 setError(null);
   setProgress(null);
  
  await invoke('download_and_install_update');
  
  // If result is successful, app will restart automatically
 return true;
 } catch (err) {
 const message = err instanceof Error ? err.message : String(err);
 setError(message);
 setStatus('error');
 return false;
 }
 }, []);

 // Fetch current version
 const getVersion = useCallback(async (): Promise<string> => {
 try {
 return await invoke<string>('get_app_version');
 } catch (err) {
 console.error('Failed to get app version:', err);
 return 'unknown';
  }
 }, []);

 // Fetch app info
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

 // Reset status
 const reset = useCallback(() => {
 setStatus('idle');
 setUpdateInfo(null);
 setProgress(null);
 setError(null);
 }, []);

 return {
 // Status
 status,
 updateInfo,
 progress,
 error,
 appInfo,
 
 // Calculate
 isChecking: status === 'checking',
 isDownloading: status === 'downloading',
 isInstalling: status === 'installing',
 hasUpdate: status === 'available' && updateInfo?.available,
 
 // Method
 checkUpdate,
 downloadAndInstall,
 getVersion,
 getAppInfo,
 reset,
 };
}

export default useUpdater;
