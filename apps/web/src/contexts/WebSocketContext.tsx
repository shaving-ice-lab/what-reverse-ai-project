"use client";

/**
 * WebSocket 全局上下文
 * 提供实时执行状态和通知
 */

import React, { createContext, useContext, useEffect, useCallback, useState, useRef } from "react";
import { getWsBaseUrl } from "@/lib/env";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { useAuthStore } from "@/stores/useAuthStore";
import { useExecutionStore } from "@/stores/useExecutionStore";
import type { WSMessage, ConnectionState, ExecutionPayload, LogPayload, LatencyMetrics } from "@/hooks/useWebSocket";

// 延迟阈值 (500ms)
const LATENCY_THRESHOLD_MS = 500;

// 通知类型
export interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  executionId?: string;
  workflowId?: string;
}

// WebSocket 上下文类型
interface WebSocketContextType {
  connectionState: ConnectionState;
  isConnected: boolean;
  lastMessage: WSMessage | null;
  notifications: Notification[];
  unreadCount: number;
  connect: () => void;
  disconnect: () => void;
  subscribe: (executionId: string) => void;
  unsubscribe: (executionId: string) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  // 延迟监控
  latencyMetrics: LatencyMetrics;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

// 自定义 Hook
export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within WebSocketProvider");
  }
  return context;
}

// WebSocket Provider 组件
export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { tokens, isAuthenticated } = useAuthStore();
  const { handleWSMessage } = useExecutionStore();
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [latencyMetrics, setLatencyMetrics] = useState<LatencyMetrics>({
    totalMessages: 0,
    avgLatencyMs: 0,
    maxLatencyMs: 0,
    lastLatencyMs: 0,
    overThreshold: 0,
  });
  
  // 延迟统计累计值
  const totalLatencyRef = useRef(0);
  
  const maxReconnectAttempts = 5;
  const reconnectInterval = 3000;

  // 更新延迟指标
  const updateLatencyMetrics = useCallback((sentAt?: number) => {
    if (!sentAt) return;

    const now = Date.now();
    const latencyMs = now - sentAt;
    
    setLatencyMetrics(prev => {
      const newTotal = prev.totalMessages + 1;
      totalLatencyRef.current += latencyMs;
      
      const newMetrics: LatencyMetrics = {
        totalMessages: newTotal,
        avgLatencyMs: Math.round(totalLatencyRef.current / newTotal),
        maxLatencyMs: Math.max(prev.maxLatencyMs, latencyMs),
        lastLatencyMs: latencyMs,
        overThreshold: latencyMs > LATENCY_THRESHOLD_MS ? prev.overThreshold + 1 : prev.overThreshold,
      };
      
      // 如果延迟超过阈值，记录警告
      if (latencyMs > LATENCY_THRESHOLD_MS) {
        console.warn(`[WebSocket] Message latency exceeded ${LATENCY_THRESHOLD_MS}ms threshold: ${latencyMs}ms`);
      }
      
      return newMetrics;
    });
  }, []);

  // 添加通知
  const addNotification = useCallback((notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // 保留最近50条
  }, []);

  // 处理 WebSocket 消息
  const handleMessage = useCallback((message: WSMessage) => {
    setLastMessage(message);
    
    // 更新延迟指标
    updateLatencyMetrics(message.sentAt);
    
    // 转发给 Execution Store 处理
    handleWSMessage(message);
    
    // 生成通知
    switch (message.type) {
      case "execution.started": {
        const payload = message.payload as ExecutionPayload;
        addNotification({
          type: "info",
          title: "执行开始",
          message: `工作流开始执行`,
          executionId: payload.executionId,
          workflowId: payload.workflowId,
        });
        break;
      }
      
      case "execution.completed": {
        const payload = message.payload as ExecutionPayload;
        addNotification({
          type: "success",
          title: "执行完成",
          message: `工作流执行成功，耗时 ${payload.durationMs}ms`,
          executionId: payload.executionId,
          workflowId: payload.workflowId,
        });
        break;
      }
      
      case "execution.failed": {
        const payload = message.payload as ExecutionPayload;
        addNotification({
          type: "error",
          title: "执行失败",
          message: payload.error || "工作流执行失败",
          executionId: payload.executionId,
          workflowId: payload.workflowId,
        });
        break;
      }
      
      case "execution.cancelled": {
        const payload = message.payload as ExecutionPayload;
        addNotification({
          type: "warning",
          title: "执行取消",
          message: "工作流执行已取消",
          executionId: payload.executionId,
          workflowId: payload.workflowId,
        });
        break;
      }
    }
  }, [handleWSMessage, addNotification, updateLatencyMetrics]);

  // 获取 WebSocket URL
  const getWsUrl = useCallback(() => {
    const baseUrl = getWsBaseUrl() ||
      (typeof window !== "undefined"
        ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`
        : "ws://localhost:8080/ws");
    const token = tokens?.accessToken;
    return token ? `${baseUrl}?token=${token}` : baseUrl;
  }, [tokens?.accessToken]);

  // 连接 WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    if (!tokens?.accessToken) {
      console.warn("[WebSocket] 没有可用的访问令牌，跳过连接");
      return;
    }

    // 检查是否启用了本地模式（可能没有后端服务器）
    const isLocalMode = isFeatureEnabled("local_mode");
    if (isLocalMode && process.env.NODE_ENV === "development") {
      console.info("[WebSocket] 本地模式已启用，WebSocket 连接是可选的");
    }

    try {
      setConnectionState("connecting");
      const wsUrl = getWsUrl();
      if (process.env.NODE_ENV === "development") {
        console.info(`[WebSocket] 正在连接: ${wsUrl.replace(/token=.*/, "token=***")}`);
      }
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.info("[WebSocket] 连接成功");
        setConnectionState("connected");
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage;
          handleMessage(message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onerror = () => {
        // WebSocket error 事件不包含具体错误信息
        // 连接失败通常是因为服务器未运行，这在开发环境中是常见的
        if (process.env.NODE_ENV === "development") {
          console.warn("[WebSocket] 连接失败 - 请确保后端服务器正在运行 (localhost:8080)");
        } else {
          console.error("[WebSocket] 连接错误");
        }
        setConnectionState("error");
      };

      ws.onclose = (event) => {
        // 正常关闭 (1000) 或客户端主动关闭 (1005) 不需要重连
        const normalClose = event.code === 1000 || event.code === 1005;
        
        if (normalClose) {
          console.info("[WebSocket] 连接已正常关闭");
        } else {
          console.warn(`[WebSocket] 连接断开 (code: ${event.code})`);
        }
        setConnectionState("disconnected");

        // 自动重连 (非正常关闭时)
        if (!normalClose && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current); // 指数退避
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            console.info(`[WebSocket] 重连中... (第 ${reconnectAttemptsRef.current} 次尝试，延迟 ${Math.round(delay / 1000)}s)`);
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.warn("[WebSocket] 已达到最大重连次数，停止重连");
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setConnectionState("error");
    }
  }, [getWsUrl, tokens?.accessToken, handleMessage]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttemptsRef.current = maxReconnectAttempts;
    wsRef.current?.close();
    wsRef.current = null;
    setConnectionState("disconnected");
  }, []);

  // 发送消息
  const sendMessage = useCallback((type: string, payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  // 订阅执行
  const subscribe = useCallback((executionId: string) => {
    sendMessage("subscribe", { executionId });
  }, [sendMessage]);

  // 取消订阅
  const unsubscribe = useCallback((executionId: string) => {
    sendMessage("unsubscribe", { executionId });
  }, [sendMessage]);

  // 标记通知已读
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  // 标记全部已读
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // 清除通知
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // 自动连接
  useEffect(() => {
    if (isAuthenticated && tokens?.accessToken) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, tokens?.accessToken, connect, disconnect]);

  // 计算未读数量
  const unreadCount = notifications.filter(n => !n.read).length;

  const value: WebSocketContextType = {
    connectionState,
    isConnected: connectionState === "connected",
    lastMessage,
    notifications,
    unreadCount,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    latencyMetrics,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export default WebSocketProvider;
