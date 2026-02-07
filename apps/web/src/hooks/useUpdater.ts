/**
 * AutoUpdate Hook
 * 
 * ProvideCheckUpdate, DownloadUpdate, InstallUpdateetcFeatures
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
 /** PublishDate */
 date?: string;
 /** UpdateDescription */
 body?: string;
 /** isnohasAvailableUpdate */
 available: boolean;
}

export interface UpdateProgress {
 /** alreadyDownloadBytescount */
 downloaded: number;
 /** totalBytescount */
 total?: number;
 /** ProgressPercentage (0-100) */
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

 // ListenUpdateEvent
 useEffect(() => {
 const unlistenStatus = listen<UpdateStatus>('update-status', (event) => {
 setStatus(event.payload);
 });

 const unlistenProgress = listen<UpdateProgress>('update-progress', (event) => {
 setProgress(event.payload);
 });

 // FetchAppInfo
 getAppInfo().then(setAppInfo).catch(console.error);

 return () => {
 unlistenStatus.then((fn) => fn());
 unlistenProgress.then((fn) => fn());
 };
 }, []);

 // CheckUpdate
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

 // DownloadandInstallUpdate
 const downloadAndInstall = useCallback(async (): Promise<boolean> => {
 try {
 setStatus('downloading');
 setError(null);
 setProgress(null);
 
 await invoke('download_and_install_update');
 
 // ifresulttothisin, DescriptionInstallwillre-App
 return true;
 } catch (err) {
 const message = err instanceof Error ? err.message : String(err);
 setError(message);
 setStatus('error');
 return false;
 }
 }, []);

 // FetchCurrent Version
 const getVersion = useCallback(async (): Promise<string> => {
 try {
 return await invoke<string>('get_app_version');
 } catch (err) {
 console.error('Failed to get app version:', err);
 return 'unknown';
 }
 }, []);

 // FetchAppInfo
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

 // ResetStatus
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
