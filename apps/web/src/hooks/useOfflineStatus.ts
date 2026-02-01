/**
 * 离线状态 Hook
 * @description 监测网络状态并管理离线队列
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
 * Hook 返回类型
 */
export interface UseOfflineStatusReturn {
  /** 是否在线 */
  isOnline: boolean;
  /** 网络状态 */
  status: NetworkStatus;
  /** 连接信息 */
  connectionInfo: ConnectionInfo;
  /** 队列状态 */
  queueState: OfflineQueueState;
  /** 添加离线操作 */
  addToQueue: <T>(
    type: OfflineOperationType,
    data: T,
    options?: { priority?: number; maxRetries?: number }
  ) => OfflineOperation<T>;
  /** 处理队列 */
  processQueue: () => Promise<void>;
  /** 重试失败操作 */
  retryFailed: () => void;
  /** 清空队列 */
  clearQueue: () => void;
  /** 获取待处理操作 */
  getPendingOperations: () => OfflineOperation[];
  /** 获取失败操作 */
  getFailedOperations: () => OfflineOperation[];
}

/**
 * Hook 配置选项
 */
interface UseOfflineStatusOptions {
  /** 联网后自动同步 */
  autoSync?: boolean;
  /** 操作处理器 */
  onProcess?: (operation: OfflineOperation) => Promise<void>;
  /** 状态变化回调 */
  onStatusChange?: (status: NetworkStatus) => void;
}

/**
 * 获取网络质量信息
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
 * 判断网络是否慢
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
 * 离线状态 Hook
 */
export function useOfflineStatus(
  options: UseOfflineStatusOptions = {}
): UseOfflineStatusReturn {
  const { autoSync = true, onProcess, onStatusChange } = options;

  // 获取离线队列实例
  const queueRef = useRef(getDefaultOfflineQueue());

  // 网络状态
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // 网络质量
  const [quality, setQuality] = useState<NetworkQuality | undefined>(() =>
    getNetworkQuality()
  );

  // 连接信息
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    status: 'online',
    quality: getNetworkQuality(),
  }));

  // 队列状态
  const [queueState, setQueueState] = useState<OfflineQueueState>(() =>
    queueRef.current.getState()
  );

  // 更新队列状态
  const updateQueueState = useCallback(() => {
    setQueueState(queueRef.current.getState());
  }, []);

  // 计算网络状态
  const getNetworkStatus = useCallback(
    (online: boolean, networkQuality?: NetworkQuality): NetworkStatus => {
      if (!online) return 'offline';
      if (isSlowNetwork(networkQuality)) return 'slow';
      return 'online';
    },
    []
  );

  // 处理在线状态变化
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

    // 自动同步
    if (autoSync && onProcess) {
      queueRef.current.process(onProcess).then(updateQueueState);
    }
  }, [autoSync, onProcess, onStatusChange, getNetworkStatus, updateQueueState]);

  // 处理离线状态变化
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

  // 处理连接变化
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

    // 如果从慢网络恢复到正常，触发同步
    if (
      autoSync &&
      onProcess &&
      newStatus === 'online' &&
      connectionInfo.status === 'slow'
    ) {
      queueRef.current.process(onProcess).then(updateQueueState);
    }
  }, [autoSync, onProcess, connectionInfo.status, getNetworkStatus, updateQueueState]);

  // 监听网络状态变化
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 监听连接质量变化
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

  // 监听队列事件
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

  // 添加到队列
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

  // 处理队列
  const processQueue = useCallback(async () => {
    if (!onProcess) {
      console.warn('No onProcess handler provided');
      return;
    }

    await queueRef.current.process(onProcess);
    updateQueueState();
  }, [onProcess, updateQueueState]);

  // 重试失败操作
  const retryFailed = useCallback(() => {
    queueRef.current.retryFailed();
    updateQueueState();

    // 如果在线，立即处理
    if (isOnline && onProcess) {
      queueRef.current.process(onProcess).then(updateQueueState);
    }
  }, [isOnline, onProcess, updateQueueState]);

  // 清空队列
  const clearQueue = useCallback(() => {
    queueRef.current.clear();
    updateQueueState();
  }, [updateQueueState]);

  // 获取待处理操作
  const getPendingOperations = useCallback(() => {
    return queueRef.current.getPending();
  }, []);

  // 获取失败操作
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
