'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';

// WebSocket 消息类型
export type MessageType =
  | 'execution.started'
  | 'execution.completed'
  | 'execution.failed'
  | 'execution.cancelled'
  | 'execution.node.started'
  | 'execution.node.completed'
  | 'execution.node.failed'
  | 'execution.log'
  | 'execution.progress'
  | 'ping'
  | 'pong'
  | 'error';

// WebSocket 消息结构
export interface WSMessage<T = unknown> {
  type: MessageType;
  payload: T;
  timestamp: string;
  sentAt?: number; // 服务端发送时间戳(毫秒)，用于延迟计算
}

// 延迟监控指标
export interface LatencyMetrics {
  totalMessages: number;
  avgLatencyMs: number;
  maxLatencyMs: number;
  lastLatencyMs: number;
  overThreshold: number; // 超过500ms的消息数
}

// 延迟阈值 (500ms)
const LATENCY_THRESHOLD_MS = 500;

// 执行事件载荷
export interface ExecutionPayload {
  executionId: string;
  workflowId?: string;
  status?: string;
  nodeId?: string;
  nodeType?: string;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error?: string;
  durationMs?: number;
  progress?: number;
  totalNodes?: number;
  completedNodes?: number;
}

// 日志载荷
export interface LogPayload {
  executionId: string;
  nodeId?: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
}

// 连接状态
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  onMessage?: (message: WSMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const { tokens } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  
  // 延迟监控指标
  const metricsRef = useRef<LatencyMetrics>({
    totalMessages: 0,
    avgLatencyMs: 0,
    maxLatencyMs: 0,
    lastLatencyMs: 0,
    overThreshold: 0,
  });
  const totalLatencyRef = useRef(0);

  // 计算消息延迟
  const calculateLatency = useCallback((message: WSMessage) => {
    if (!message.sentAt) return;

    const now = Date.now();
    const latencyMs = now - message.sentAt;
    
    // 更新指标
    metricsRef.current.totalMessages++;
    totalLatencyRef.current += latencyMs;
    metricsRef.current.avgLatencyMs = Math.round(totalLatencyRef.current / metricsRef.current.totalMessages);
    metricsRef.current.lastLatencyMs = latencyMs;
    
    if (latencyMs > metricsRef.current.maxLatencyMs) {
      metricsRef.current.maxLatencyMs = latencyMs;
    }
    
    if (latencyMs > LATENCY_THRESHOLD_MS) {
      metricsRef.current.overThreshold++;
      console.warn(`[WebSocket] Message latency exceeded threshold: ${latencyMs}ms (threshold: ${LATENCY_THRESHOLD_MS}ms)`, {
        type: message.type,
        latencyMs,
      });
    }
  }, []);

  // 获取 WebSocket URL
  const getWsUrl = useCallback(() => {
    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';
    const token = tokens?.accessToken;
    return token ? `${baseUrl}?token=${token}` : baseUrl;
  }, [tokens?.accessToken]);

  // 连接 WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    if (!tokens?.accessToken) {
      console.warn('No access token available for WebSocket connection');
      return;
    }

    try {
      setConnectionState('connecting');
      const ws = new WebSocket(getWsUrl());

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionState('connected');
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage;
          
          // 计算延迟
          calculateLatency(message);
          
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setConnectionState('error');
        onError?.(event);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionState('disconnected');
        onDisconnect?.();

        // 自动重连
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            console.log(`Reconnecting... (attempt ${reconnectAttemptsRef.current})`);
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionState('error');
    }
  }, [getWsUrl, tokens?.accessToken, onConnect, onMessage, onDisconnect, onError, reconnectInterval, maxReconnectAttempts, calculateLatency]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttemptsRef.current = maxReconnectAttempts; // 阻止重连
    wsRef.current?.close();
    wsRef.current = null;
  }, [maxReconnectAttempts]);

  // 发送消息
  const sendMessage = useCallback((type: string, payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  // 订阅执行
  const subscribe = useCallback((executionId: string) => {
    sendMessage('subscribe', { executionId });
  }, [sendMessage]);

  // 取消订阅
  const unsubscribe = useCallback((executionId: string) => {
    sendMessage('unsubscribe', { executionId });
  }, [sendMessage]);

  // 发送 ping
  const ping = useCallback(() => {
    sendMessage('ping', null);
  }, [sendMessage]);

  // 获取延迟指标
  const getLatencyMetrics = useCallback((): LatencyMetrics => {
    return { ...metricsRef.current };
  }, []);

  // 重置延迟指标
  const resetLatencyMetrics = useCallback(() => {
    metricsRef.current = {
      totalMessages: 0,
      avgLatencyMs: 0,
      maxLatencyMs: 0,
      lastLatencyMs: 0,
      overThreshold: 0,
    };
    totalLatencyRef.current = 0;
  }, []);

  // 自动连接
  useEffect(() => {
    if (autoConnect && tokens?.accessToken) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, tokens?.accessToken, connect, disconnect]);

  return {
    connectionState,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    unsubscribe,
    ping,
    isConnected: connectionState === 'connected',
    // 延迟监控
    getLatencyMetrics,
    resetLatencyMetrics,
  };
}

export default useWebSocket;
