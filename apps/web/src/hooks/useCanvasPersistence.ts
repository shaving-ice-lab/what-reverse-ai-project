/**
 * 画布状态持久化 Hook
 * 
 * 功能:
 * 1. 自动保存画布状态到 localStorage
 * 2. 页面加载时恢复画布状态
 * 3. 支持视口位置、缩放级别
 * 4. 支持节点/边数据
 * 5. 防抖保存避免频繁写入
 */

import { useCallback, useEffect, useRef } from "react";
import { useReactFlow, type Viewport } from "@xyflow/react";
import type { Node, Edge } from "@xyflow/react";

// ===== 类型定义 =====
interface CanvasState {
  viewport: Viewport;
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
  version: string;
}

interface CanvasPersistenceOptions {
  /** 工作流 ID */
  workflowId: string;
  /** 自动保存间隔（毫秒），默认 5000 */
  autoSaveInterval?: number;
  /** 防抖延迟（毫秒），默认 1000 */
  debounceDelay?: number;
  /** 是否启用自动保存，默认 true */
  enableAutoSave?: boolean;
  /** 保存回调 */
  onSave?: (state: CanvasState) => void;
  /** 恢复回调 */
  onRestore?: (state: CanvasState) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

// 存储键前缀
const STORAGE_PREFIX = "agentflow_canvas_";
// 当前版本
const CURRENT_VERSION = "1.0";
// 最大保存状态数
const MAX_HISTORY = 5;

// 获取存储键
function getStorageKey(workflowId: string): string {
  return `${STORAGE_PREFIX}${workflowId}`;
}

// 获取历史记录键
function getHistoryKey(workflowId: string): string {
  return `${STORAGE_PREFIX}${workflowId}_history`;
}

// ===== 主 Hook =====
export function useCanvasPersistence(options: CanvasPersistenceOptions) {
  const {
    workflowId,
    autoSaveInterval = 5000,
    debounceDelay = 1000,
    enableAutoSave = true,
    onSave,
    onRestore,
    onError,
  } = options;

  const { getNodes, getEdges, getViewport, setViewport, setNodes, setEdges } =
    useReactFlow();

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);

  // 保存画布状态
  const saveState = useCallback(() => {
    try {
      const state: CanvasState = {
        viewport: getViewport(),
        nodes: getNodes(),
        edges: getEdges(),
        timestamp: Date.now(),
        version: CURRENT_VERSION,
      };

      // 保存到 localStorage
      localStorage.setItem(getStorageKey(workflowId), JSON.stringify(state));
      lastSaveRef.current = state.timestamp;

      // 保存到历史记录
      saveToHistory(workflowId, state);

      onSave?.(state);
      return true;
    } catch (error) {
      onError?.(error as Error);
      console.error("[CanvasPersistence] Save failed:", error);
      return false;
    }
  }, [workflowId, getViewport, getNodes, getEdges, onSave, onError]);

  // 防抖保存
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveState();
    }, debounceDelay);
  }, [saveState, debounceDelay]);

  // 恢复画布状态
  const restoreState = useCallback((): CanvasState | null => {
    try {
      const saved = localStorage.getItem(getStorageKey(workflowId));
      if (!saved) return null;

      const state: CanvasState = JSON.parse(saved);

      // 版本检查
      if (state.version !== CURRENT_VERSION) {
        console.warn("[CanvasPersistence] Version mismatch, migration may be needed");
      }

      // 恢复视口
      if (state.viewport) {
        setViewport(state.viewport, { duration: 0 });
      }

      // 恢复节点和边
      if (state.nodes && state.nodes.length > 0) {
        setNodes(state.nodes);
      }
      if (state.edges && state.edges.length > 0) {
        setEdges(state.edges);
      }

      onRestore?.(state);
      return state;
    } catch (error) {
      onError?.(error as Error);
      console.error("[CanvasPersistence] Restore failed:", error);
      return null;
    }
  }, [workflowId, setViewport, setNodes, setEdges, onRestore, onError]);

  // 清除保存的状态
  const clearState = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey(workflowId));
      localStorage.removeItem(getHistoryKey(workflowId));
      return true;
    } catch (error) {
      onError?.(error as Error);
      return false;
    }
  }, [workflowId, onError]);

  // 获取保存的状态（不恢复）
  const getSavedState = useCallback((): CanvasState | null => {
    try {
      const saved = localStorage.getItem(getStorageKey(workflowId));
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [workflowId]);

  // 检查是否有保存的状态
  const hasSavedState = useCallback((): boolean => {
    return !!localStorage.getItem(getStorageKey(workflowId));
  }, [workflowId]);

  // 获取历史记录
  const getHistory = useCallback((): CanvasState[] => {
    try {
      const history = localStorage.getItem(getHistoryKey(workflowId));
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }, [workflowId]);

  // 从历史记录恢复
  const restoreFromHistory = useCallback(
    (index: number): boolean => {
      try {
        const history = getHistory();
        if (index < 0 || index >= history.length) return false;

        const state = history[index];
        if (state.viewport) {
          setViewport(state.viewport, { duration: 300 });
        }
        if (state.nodes) {
          setNodes(state.nodes);
        }
        if (state.edges) {
          setEdges(state.edges);
        }

        onRestore?.(state);
        return true;
      } catch (error) {
        onError?.(error as Error);
        return false;
      }
    },
    [getHistory, setViewport, setNodes, setEdges, onRestore, onError]
  );

  // 仅保存视口
  const saveViewportOnly = useCallback(() => {
    try {
      const saved = localStorage.getItem(getStorageKey(workflowId));
      const state: CanvasState = saved
        ? JSON.parse(saved)
        : { nodes: [], edges: [], timestamp: 0, version: CURRENT_VERSION };

      state.viewport = getViewport();
      state.timestamp = Date.now();

      localStorage.setItem(getStorageKey(workflowId), JSON.stringify(state));
      return true;
    } catch (error) {
      onError?.(error as Error);
      return false;
    }
  }, [workflowId, getViewport, onError]);

  // 设置自动保存
  useEffect(() => {
    if (!enableAutoSave) return;

    autoSaveIntervalRef.current = setInterval(() => {
      saveState();
    }, autoSaveInterval);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [enableAutoSave, autoSaveInterval, saveState]);

  // 页面关闭前保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveState();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [saveState]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, []);

  return {
    saveState,
    debouncedSave,
    restoreState,
    clearState,
    getSavedState,
    hasSavedState,
    getHistory,
    restoreFromHistory,
    saveViewportOnly,
    lastSaveTime: lastSaveRef.current,
  };
}

// ===== 辅助函数 =====

// 保存到历史记录
function saveToHistory(workflowId: string, state: CanvasState): void {
  try {
    const historyKey = getHistoryKey(workflowId);
    const history: CanvasState[] = JSON.parse(
      localStorage.getItem(historyKey) || "[]"
    );

    // 添加到开头
    history.unshift(state);

    // 限制历史记录数量
    if (history.length > MAX_HISTORY) {
      history.pop();
    }

    localStorage.setItem(historyKey, JSON.stringify(history));
  } catch (error) {
    console.error("[CanvasPersistence] Save history failed:", error);
  }
}

// ===== 工具函数 =====

// 获取所有保存的工作流 ID
export function getSavedWorkflowIds(): string[] {
  const ids: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX) && !key.endsWith("_history")) {
      ids.push(key.replace(STORAGE_PREFIX, ""));
    }
  }
  return ids;
}

// 清除所有画布状态
export function clearAllCanvasStates(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

// 导出画布状态
export function exportCanvasState(workflowId: string): string | null {
  const state = localStorage.getItem(getStorageKey(workflowId));
  return state;
}

// 导入画布状态
export function importCanvasState(
  workflowId: string,
  stateJson: string
): boolean {
  try {
    const state: CanvasState = JSON.parse(stateJson);
    // 验证结构
    if (!state.version || !state.timestamp) {
      throw new Error("Invalid canvas state format");
    }
    localStorage.setItem(getStorageKey(workflowId), stateJson);
    return true;
  } catch {
    return false;
  }
}

// 获取画布状态的存储大小（字节）
export function getCanvasStateSize(workflowId: string): number {
  const state = localStorage.getItem(getStorageKey(workflowId));
  const history = localStorage.getItem(getHistoryKey(workflowId));
  return (state?.length || 0) + (history?.length || 0);
}

// 压缩画布状态（移除不必要的数据）
export function compressCanvasState(state: CanvasState): CanvasState {
  return {
    ...state,
    nodes: state.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      // 移除临时状态
      selected: undefined,
      dragging: undefined,
    })) as Node[],
    edges: state.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: edge.type,
      data: edge.data,
      // 移除临时状态
      selected: undefined,
    })) as Edge[],
  };
}
